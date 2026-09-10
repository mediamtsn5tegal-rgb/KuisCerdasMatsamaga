import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Quiz } from '../../types';
import { generateWordSearch, sanitizeWord } from '../../services/wordSearchGenerator';
import { soundManager } from '../../services/audioEffects';
import { useApp } from '../../context/AppContext';
import { Clock, CheckCircle, ArrowLeft, Search, Sparkles } from 'lucide-react';

interface WordSearchGameProps {
  quiz: Quiz;
  studentName: string;
  studentClass: string;
  onFinish: (resultId: string) => void;
  onBack: () => void;
}

export const WordSearchGame: React.FC<WordSearchGameProps> = ({
  quiz,
  studentName,
  studentClass,
  onFinish,
  onBack
}) => {
  const { showToast, currentUser } = useApp();

  // Words list
  const wordsToFind = useMemo(() => {
    return quiz.questions.map(q => ({
      id: q.id,
      word: sanitizeWord(q.answer),
      clue: q.question
    })).filter(w => w.word.length >= 3);
  }, [quiz.questions]);

  // Generate word search matrix
  const matrixData = useMemo(() => {
    return generateWordSearch(wordsToFind, 14);
  }, [wordsToFind]);

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(quiz.settings.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Get straight line of cells between start and end
  const getLineCells = (start: { row: number; col: number }, end: { row: number; col: number }) => {
    const dr = end.row - start.row;
    const dc = end.col - start.col;
    const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
    const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;

    // Check valid direction (horizontal, vertical, diagonal)
    const isHorizontal = dr === 0 && dc !== 0;
    const isVertical = dc === 0 && dr !== 0;
    const isDiagonal = Math.abs(dr) === Math.abs(dc) && dr !== 0;

    if (!isHorizontal && !isVertical && !isDiagonal) {
      return [start];
    }

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const cells: { row: number; col: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      cells.push({
        row: start.row + i * stepR,
        col: start.col + i * stepC
      });
    }
    return cells;
  };

  const handleCellMouseDown = (row: number, col: number) => {
    soundManager.playClick();
    setDragStart({ row, col });
    setSelectedCells([{ row, col }]);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!dragStart) return;
    const line = getLineCells(dragStart, { row, col });
    setSelectedCells(line);
  };

  const handleCellMouseUp = () => {
    if (!dragStart || selectedCells.length === 0) {
      setDragStart(null);
      setSelectedCells([]);
      return;
    }

    // Read characters along selected line
    const wordChars = selectedCells.map(c => matrixData.grid[c.row]?.[c.col] || '').join('');
    const reverseChars = wordChars.split('').reverse().join('');

    // Check against remaining words
    const matched = matrixData.placements.find(
      pw => !foundWords.includes(pw.word) && (pw.word === wordChars || pw.word === reverseChars)
    );

    if (matched) {
      soundManager.playCorrect();
      const updated = [...foundWords, matched.word];
      setFoundWords(updated);
      showToast(`Hebat! Kata "${matched.word}" berhasil ditemukan!`, 'success');

      if (updated.length === matrixData.placements.length) {
        soundManager.playVictory();
        confetti({ particleCount: 100, spread: 70 });
        showToast('Luar biasa! Semua kata telah ditemukan!', 'success');
      }
    } else {
      soundManager.playWrong();
    }

    setDragStart(null);
    setSelectedCells([]);
  };

  // Check if a cell is inside an already found word
  const isCellFound = (row: number, col: number) => {
    return matrixData.placements.some(pw => {
      if (!foundWords.includes(pw.word)) return false;
      const dr = pw.endRow - pw.startRow;
      const dc = pw.endCol - pw.startCol;
      const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
      const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
      const steps = Math.max(Math.abs(dr), Math.abs(dc));

      for (let i = 0; i <= steps; i++) {
        if (pw.startRow + i * stepR === row && pw.startCol + i * stepC === col) {
          return true;
        }
      }
      return false;
    });
  };

  // Submit
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const clientTimeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const userAnswers: Record<string, { answer: string; hintsUsed: number; timeSpent: number }> = {};

    quiz.questions.forEach(q => {
      const cleanAns = sanitizeWord(q.answer);
      const isFound = foundWords.includes(cleanAns);
      userAnswers[q.id] = {
        answer: isFound ? q.answer : '',
        hintsUsed: 0,
        timeSpent: Math.round(clientTimeSpent / quiz.questions.length)
      };
    });

    try {
      const response = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          studentClass,
          userId: currentUser.role === 'SISWA' ? currentUser.id : undefined,
          userAnswers,
          clientTimeSpent
        })
      });

      const data = await response.json();
      if (data.success && data.result) {
        soundManager.playVictory();
        onFinish(data.result.id);
      }
    } catch (err: any) {
      showToast('Gagal mengirim jawaban: ' + err.message, 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onMouseUp={handleCellMouseUp}
      className="select-none flex flex-col min-h-[calc(100vh-140px)]"
    >
      {/* Top Bar */}
      <div className="bg-white border-b border-emerald-100 py-3 px-4 sm:px-6 shadow-xs sticky top-16 z-30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              WORD SEARCH • {studentClass}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {quiz.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Ditemukan: {foundWords.length} / {matrixData.placements.length}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Memeriksa...' : 'Selesai'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Matrix Grid */}
        <div className="lg:col-span-8 flex justify-center bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-md overflow-x-auto">
          <div
            className="grid gap-1 bg-slate-100 p-2 rounded-xl border border-slate-300"
            style={{
              gridTemplateColumns: `repeat(${matrixData.cols}, minmax(0, 1fr))`
            }}
          >
            {matrixData.grid.map((row, rIdx) =>
              row.map((letter, cIdx) => {
                const isSelected = selectedCells.some(c => c.row === rIdx && c.col === cIdx);
                const isFound = isCellFound(rIdx, cIdx);

                let cellStyle = 'bg-white text-slate-800 hover:bg-emerald-50';
                if (isSelected) {
                  cellStyle = 'bg-amber-300 text-slate-950 font-black scale-105';
                } else if (isFound) {
                  cellStyle = 'bg-emerald-100 text-emerald-900 font-extrabold border-emerald-300';
                }

                return (
                  <div
                    key={`ws_cell_${rIdx}_${cIdx}`}
                    onMouseDown={() => handleCellMouseDown(rIdx, cIdx)}
                    onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                    className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center font-bold text-xs sm:text-base rounded-md cursor-pointer transition-all duration-150 border border-slate-200 shadow-2xs ${cellStyle}`}
                  >
                    {letter}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Word Targets List */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600" />
              Kata Yang Dicari
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Tarik huruf lurus
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {matrixData.placements.map((pw, pIdx) => {
              const isFound = foundWords.includes(pw.word);
              return (
                <div
                  key={`target_${pw.word}_${pIdx}`}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isFound
                      ? 'bg-emerald-50/70 border-emerald-200 text-slate-500 line-through'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold tracking-wider text-sm font-mono uppercase">
                      {pw.word}
                    </span>
                    {isFound && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full not-italic">
                        DITEMUKAN
                      </span>
                    )}
                  </div>
                  {pw.clue && (
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug not-italic">
                      {pw.clue}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
