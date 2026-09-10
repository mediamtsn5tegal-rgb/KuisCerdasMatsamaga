import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, CrosswordWordPlacement, CrosswordGridCell } from '../../types';
import { generateCrossword, sanitizeAnswer } from '../../services/crosswordGenerator';
import { soundManager } from '../../services/audioEffects';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  ArrowLeft,
  Info,
  Maximize2
} from 'lucide-react';

interface CrosswordGameProps {
  quiz: Quiz;
  studentName: string;
  studentClass: string;
  onFinish: (resultId: string) => void;
  onBack: () => void;
}

export const CrosswordGame: React.FC<CrosswordGameProps> = ({
  quiz,
  studentName,
  studentClass,
  onFinish,
  onBack
}) => {
  const { showToast, currentUser } = useApp();

  // Layout generation
  const layout = useMemo(() => {
    const items = quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      hint: q.hint,
      explanation: q.explanation
    }));
    return generateCrossword(items);
  }, [quiz.questions]);

  // Game state
  // userGrid: Map of "r,c" => char
  const [userLetters, setUserLetters] = useState<{ [coord: string]: string }>({});
  const [selectedWord, setSelectedWord] = useState<CrosswordWordPlacement | null>(null);
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<'ACROSS' | 'DOWN'>('ACROSS');
  const [hintsUsed, setHintsUsed] = useState<{ [questionId: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState<number>(quiz.settings.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());
  const [zoomGrid, setZoomGrid] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Set initial selected word
  useEffect(() => {
    if (layout.placedWords.length > 0 && !selectedWord) {
      const first = layout.placedWords[0];
      setSelectedWord(first);
      setActiveCell({ row: first.row, col: first.col });
      setDirection(first.direction);
    }
  }, [layout.placedWords, selectedWord]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAnswers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find word at cell
  const findWordsAtCell = (row: number, col: number) => {
    return layout.placedWords.filter(w => {
      if (w.direction === 'ACROSS') {
        return w.row === row && col >= w.col && col < w.col + w.word.length;
      } else {
        return w.col === col && row >= w.row && row < w.row + w.word.length;
      }
    });
  };

  // Cell click handler
  const handleCellClick = (row: number, col: number, cell: CrosswordGridCell) => {
    if (cell.isBlocked) return;
    soundManager.playClick();

    const matchingWords = findWordsAtCell(row, col);
    if (matchingWords.length === 0) return;

    // Toggle direction if clicked on the same active cell and cell has both directions
    if (activeCell?.row === row && activeCell?.col === col && matchingWords.length > 1) {
      const nextDir = direction === 'ACROSS' ? 'DOWN' : 'ACROSS';
      setDirection(nextDir);
      const nextWord = matchingWords.find(w => w.direction === nextDir) || matchingWords[0];
      setSelectedWord(nextWord);
    } else {
      // Pick matching word with current direction or first available
      const wordWithCurrentDir = matchingWords.find(w => w.direction === direction);
      const targetWord = wordWithCurrentDir || matchingWords[0];
      setSelectedWord(targetWord);
      setDirection(targetWord.direction);
      setActiveCell({ row, col });
    }
  };

  // Select clue directly from list
  const handleSelectWord = (word: CrosswordWordPlacement) => {
    setSelectedWord(word);
    setDirection(word.direction);
    setActiveCell({ row: word.row, col: word.col });
    soundManager.playClick();
  };

  // Advance cell inside the selected word
  const advanceCell = (step: number = 1) => {
    if (!selectedWord || !activeCell) return;
    const { row, col } = activeCell;
    const nextRow = direction === 'DOWN' ? row + step : row;
    const nextCol = direction === 'ACROSS' ? col + step : col;

    // Check boundary within current word
    if (direction === 'ACROSS') {
      if (nextCol >= selectedWord.col && nextCol < selectedWord.col + selectedWord.word.length) {
        setActiveCell({ row: nextRow, col: nextCol });
      }
    } else {
      if (nextRow >= selectedWord.row && nextRow < selectedWord.row + selectedWord.word.length) {
        setActiveCell({ row: nextRow, col: nextCol });
      }
    }
  };

  // Keydown handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeCell || !selectedWord) return;

    const { key } = e;
    const coord = `${activeCell.row},${activeCell.col}`;

    if (/^[a-zA-Z]$/.test(key)) {
      e.preventDefault();
      const char = key.toUpperCase();
      setUserLetters(prev => ({ ...prev, [coord]: char }));
      soundManager.playClick();
      advanceCell(1);
    } else if (key === 'Backspace') {
      e.preventDefault();
      if (userLetters[coord]) {
        setUserLetters(prev => {
          const copy = { ...prev };
          delete copy[coord];
          return copy;
        });
      } else {
        advanceCell(-1);
        const prevCoord = direction === 'ACROSS'
          ? `${activeCell.row},${activeCell.col - 1}`
          : `${activeCell.row - 1},${activeCell.col}`;
        setUserLetters(prev => {
          const copy = { ...prev };
          delete copy[prevCoord];
          return copy;
        });
      }
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      if (direction === 'ACROSS') advanceCell(1);
      else {
        setDirection('ACROSS');
        const words = findWordsAtCell(activeCell.row, activeCell.col);
        const across = words.find(w => w.direction === 'ACROSS');
        if (across) setSelectedWord(across);
      }
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      advanceCell(-1);
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      if (direction === 'DOWN') advanceCell(1);
      else {
        setDirection('DOWN');
        const words = findWordsAtCell(activeCell.row, activeCell.col);
        const down = words.find(w => w.direction === 'DOWN');
        if (down) setSelectedWord(down);
      }
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      advanceCell(-1);
    }
  };

  // Hint button: reveal first letter or random letter
  const handleUseHint = () => {
    if (!selectedWord) return;
    const qId = selectedWord.id;
    const currentHints = hintsUsed[qId] || 0;

    if (currentHints >= 3) {
      showToast('Batas petunjuk untuk soal ini sudah tercapai.', 'info');
      return;
    }

    // Find first unrevealed or incorrect letter in this word
    let targetIndex = -1;
    for (let i = 0; i < selectedWord.word.length; i++) {
      const r = selectedWord.direction === 'DOWN' ? selectedWord.row + i : selectedWord.row;
      const c = selectedWord.direction === 'ACROSS' ? selectedWord.col + i : selectedWord.col;
      const key = `${r},${c}`;
      if (!userLetters[key] || userLetters[key] !== selectedWord.word[i]) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex === -1) {
      showToast('Semua kotak pada kata ini sudah terisi dengan benar!', 'info');
      return;
    }

    const revealRow = selectedWord.direction === 'DOWN' ? selectedWord.row + targetIndex : selectedWord.row;
    const revealCol = selectedWord.direction === 'ACROSS' ? selectedWord.col + targetIndex : selectedWord.col;
    const charToReveal = selectedWord.word[targetIndex];

    setUserLetters(prev => ({
      ...prev,
      [`${revealRow},${revealCol}`]: charToReveal
    }));

    setHintsUsed(prev => ({
      ...prev,
      [qId]: currentHints + 1
    }));

    soundManager.playClick();
    showToast(`Petunjuk huruf terungkap! (Penalti: -${quiz.settings.hintPenalty || 3} poin)`, 'info');
  };

  // Calculate completion percentage
  const totalPlayableCells = useMemo(() => {
    let count = 0;
    layout.grid.forEach(row => {
      row.forEach(cell => {
        if (!cell.isBlocked) count++;
      });
    });
    return count;
  }, [layout]);

  const filledCellsCount = useMemo(() => {
    return Object.keys(userLetters).filter(key => Boolean(userLetters[key])).length;
  }, [userLetters]);

  const progressPercentage = totalPlayableCells > 0
    ? Math.min(100, Math.round((filledCellsCount / totalPlayableCells) * 100))
    : 0;

  // Submit gameplay answers
  const handleSubmitAnswers = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const clientTimeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    // Construct userAnswers object for server
    const userAnswers: Record<string, { answer: string; hintsUsed: number; timeSpent: number }> = {};

    layout.placedWords.forEach(pw => {
      let assembled = '';
      for (let i = 0; i < pw.word.length; i++) {
        const r = pw.direction === 'DOWN' ? pw.row + i : pw.row;
        const c = pw.direction === 'ACROSS' ? pw.col + i : pw.col;
        assembled += userLetters[`${r},${c}`] || ' ';
      }
      userAnswers[pw.id] = {
        answer: assembled.trim(),
        hintsUsed: hintsUsed[pw.id] || 0,
        timeSpent: Math.round(clientTimeSpent / layout.placedWords.length)
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
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        showToast('Kuis berhasil diselesaikan!', 'success');
        onFinish(data.result.id);
      } else {
        throw new Error(data.error || 'Gagal menyimpan hasil');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Terjadi kesalahan pengiriman: ' + err.message, 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="outline-hidden flex flex-col min-h-[calc(100vh-140px)]"
    >
      {/* Top Floating Control Bar */}
      <div className="bg-white border-b border-emerald-100 py-3 px-4 sm:px-6 shadow-xs sticky top-16 z-30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              {quiz.subject} • {studentClass}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
              {quiz.title}
            </h2>
          </div>
        </div>

        {/* Status Indicators: Timer & Progress */}
        <div className="flex items-center gap-3">
          {/* Timer pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-colors ${
              timeLeft < 60
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Progress pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>Progress: {progressPercentage}%</span>
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitAnswers}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Memeriksa...' : 'Selesai'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Layout: Grid + Clue Panel */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Crossword Matrix */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center">
          {/* Active Word Clue Bar banner */}
          {selectedWord && (
            <div className="w-full bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 mb-4 shadow-xs animate-in fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-700 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                    {selectedWord.number}
                  </span>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      {selectedWord.direction === 'ACROSS' ? 'MENDATAR (ACROSS)' : 'MENURUN (DOWN)'} • {selectedWord.word.length} HURUF
                    </span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5 leading-snug">
                      {selectedWord.clue}
                    </p>
                  </div>
                </div>

                {/* Hint Button */}
                {quiz.settings.allowHints && (
                  <button
                    onClick={handleUseHint}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border border-amber-300 transition-colors shadow-2xs"
                    title="Buka 1 huruf petunjuk (-3 poin)"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-700" />
                    <span className="hidden sm:inline">Petunjuk</span>
                  </button>
                )}
              </div>

              {selectedWord.hint && (
                <div className="mt-2.5 pt-2 border-t border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5 italic">
                  <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Clue Tambahan: {selectedWord.hint}</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Matrix Board */}
          <div className="w-full bg-white p-3 sm:p-6 rounded-3xl border border-slate-200 shadow-md flex flex-col items-center overflow-x-auto relative">
            <div className="absolute top-3 right-3 no-print">
              <button
                onClick={() => setZoomGrid(!zoomGrid)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Perbesar / Perkecil Kotak"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`grid gap-[2px] bg-slate-800 border-3 border-slate-800 p-[2px] rounded-lg shadow-inner select-none transition-transform ${
                zoomGrid ? 'scale-110 my-4' : ''
              }`}
              style={{
                gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`
              }}
            >
              {layout.grid.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  if (cell.isBlocked) {
                    return (
                      <div
                        key={`cell_${rIdx}_${cIdx}`}
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-slate-900 rounded-[2px]"
                      />
                    );
                  }

                  const coord = `${rIdx},${cIdx}`;
                  const isCurrentActive = activeCell?.row === rIdx && activeCell?.col === cIdx;

                  // Check if cell is part of current selected word
                  let isPartOfSelectedWord = false;
                  if (selectedWord) {
                    if (selectedWord.direction === 'ACROSS') {
                      isPartOfSelectedWord =
                        selectedWord.row === rIdx &&
                        cIdx >= selectedWord.col &&
                        cIdx < selectedWord.col + selectedWord.word.length;
                    } else {
                      isPartOfSelectedWord =
                        selectedWord.col === cIdx &&
                        rIdx >= selectedWord.row &&
                        rIdx < selectedWord.row + selectedWord.word.length;
                    }
                  }

                  const val = userLetters[coord] || '';

                  let bgStyle = 'bg-white text-slate-900 hover:bg-emerald-50';
                  if (isCurrentActive) {
                    bgStyle = 'bg-amber-300 text-slate-950 ring-2 ring-amber-500 ring-offset-1 z-10';
                  } else if (isPartOfSelectedWord) {
                    bgStyle = 'bg-emerald-100 text-emerald-950';
                  }

                  return (
                    <button
                      key={`cell_${rIdx}_${cIdx}`}
                      onClick={() => handleCellClick(rIdx, cIdx, cell)}
                      className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 relative flex items-center justify-center font-black text-xs sm:text-base transition-colors rounded-[2px] cursor-pointer ${bgStyle}`}
                    >
                      {cell.number && (
                        <span className="absolute top-0.5 left-0.5 text-[8px] sm:text-[10px] font-bold text-slate-500 leading-none pointer-events-none">
                          {cell.number}
                        </span>
                      )}
                      <span className="mt-1 font-mono uppercase">{val}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Mobile Virtual Keyboard Assist */}
            <div className="mt-6 w-full max-w-md lg:hidden space-y-1.5 pt-4 border-t border-slate-200">
              <div className="text-[11px] font-semibold text-center text-slate-400">
                Papan Ketik Sentuh (Virtual Keyboard)
              </div>
              {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-1">
                  {row.split('').map(letter => (
                    <button
                      key={letter}
                      onClick={() => {
                        if (!activeCell) return;
                        const coord = `${activeCell.row},${activeCell.col}`;
                        setUserLetters(prev => ({ ...prev, [coord]: letter }));
                        soundManager.playClick();
                        advanceCell(1);
                      }}
                      className="flex-1 max-w-[34px] h-10 rounded-lg bg-slate-100 active:bg-emerald-600 active:text-white text-slate-800 font-bold text-sm shadow-2xs border border-slate-300 flex items-center justify-center"
                    >
                      {letter}
                    </button>
                  ))}
                  {rowIdx === 2 && (
                    <button
                      onClick={() => {
                        if (!activeCell) return;
                        const coord = `${activeCell.row},${activeCell.col}`;
                        setUserLetters(prev => {
                          const copy = { ...prev };
                          delete copy[coord];
                          return copy;
                        });
                        advanceCell(-1);
                      }}
                      className="px-2.5 h-10 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs shadow-2xs border border-rose-300 flex items-center justify-center"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Clues List (Mendatar & Menurun) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              Daftar Pertanyaan
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {layout.placedWords.length} Soal
            </span>
          </div>

          {/* Across Clues */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              Mendatar (Across)
            </h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {layout.placedWords
                .filter(w => w.direction === 'ACROSS')
                .sort((a, b) => a.number - b.number)
                .map(word => {
                  const isSelected = selectedWord?.id === word.id;
                  return (
                    <div
                      key={`clue_across_${word.id}`}
                      onClick={() => handleSelectWord(word)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                          : 'bg-white hover:bg-emerald-50/70 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`font-black shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {word.number}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium leading-snug">{word.clue}</p>
                          <span
                            className={`text-[10px] mt-1 inline-block ${
                              isSelected ? 'text-emerald-200' : 'text-slate-500'
                            }`}
                          >
                            ({word.word.length} Huruf)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Down Clues */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              Menurun (Down)
            </h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {layout.placedWords
                .filter(w => w.direction === 'DOWN')
                .sort((a, b) => a.number - b.number)
                .map(word => {
                  const isSelected = selectedWord?.id === word.id;
                  return (
                    <div
                      key={`clue_down_${word.id}`}
                      onClick={() => handleSelectWord(word)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                          : 'bg-white hover:bg-emerald-50/70 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`font-black shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {word.number}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium leading-snug">{word.clue}</p>
                          <span
                            className={`text-[10px] mt-1 inline-block ${
                              isSelected ? 'text-emerald-200' : 'text-slate-500'
                            }`}
                          >
                            ({word.word.length} Huruf)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
