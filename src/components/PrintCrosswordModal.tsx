import React, { useState, useMemo } from 'react';
import { Quiz } from '../types';
import { generateCrossword } from '../services/crosswordGenerator';
import { Printer, X, Eye, EyeOff } from 'lucide-react';

interface PrintCrosswordModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export const PrintCrosswordModal: React.FC<PrintCrosswordModalProps> = ({ quiz, onClose }) => {
  const [showAnswers, setShowAnswers] = useState(false);

  const crosswordLayout = useMemo(() => {
    const items = quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      hint: q.hint,
      explanation: q.explanation
    }));
    return generateCrossword(items);
  }, [quiz.questions]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 flex justify-center items-start">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200">
        {/* Modal Controls Bar (Hidden during Print) */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-300" />
              Cetak Lembar Kerja Teka-Teki Silang (TTS)
            </h3>
            <p className="text-xs text-emerald-200">
              Format siap cetak A4 / Folio MTsN 5 Tegal
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-xs font-semibold border border-emerald-600 transition-colors"
            >
              {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAnswers ? 'Mode Siswa (Kosongkan)' : 'Mode Guru (Tampilkan Kunci)'}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold shadow-sm transition-transform active:scale-95"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              Cetak Sekarang
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 sm:p-12 print:p-4 bg-white text-slate-900 printable-area">
          {/* Official Madrasah Header */}
          <div className="border-b-4 border-double border-slate-900 pb-4 text-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              KEMENTERIAN AGAMA REPUBLIK INDONESIA
            </h4>
            <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-slate-900 mt-0.5">
              MADRASAH TSANAWIYAH NEGERI 5 TEGAL
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Jalan Madrasah, Kec. Tarub / Lebaksiu, Kab. Tegal • Status Terakreditasi A
            </p>
            <div className="inline-block mt-2 px-3 py-1 bg-slate-100 border border-slate-300 rounded font-black text-sm uppercase tracking-wide">
              LEMBAR KERJA PESERTA DIDIK (LKPD) - TEKA-TEKI SILANG
              {showAnswers && ' [KUNCI JAWABAN GURU]'}
            </div>
          </div>

          {/* Student Identity Section */}
          <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 border border-slate-300 rounded text-xs font-medium">
            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-28 font-bold">Nama Peserta Didik</span>
                <span>: .....................................................</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold">Nomor Absen / NIS</span>
                <span>: .....................................................</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold">Kelas</span>
                <span>: {quiz.grade} ( ........................ )</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-28 font-bold">Mata Pelajaran</span>
                <span>: {quiz.subject}</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold">Materi Pokok</span>
                <span>: {quiz.topic}</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold">Tanggal / Waktu</span>
                <span>: .....................................................</span>
              </div>
            </div>
          </div>

          {/* Crossword Grid Matrix */}
          <div className="my-6 flex justify-center overflow-x-auto">
            <div
              className="grid gap-[1px] bg-slate-900 border-2 border-slate-900 p-[1px] shadow-sm select-none"
              style={{
                gridTemplateColumns: `repeat(${crosswordLayout.cols}, minmax(0, 1fr))`
              }}
            >
              {crosswordLayout.grid.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  if (cell.isBlocked) {
                    return (
                      <div
                        key={`cell_${rIdx}_${cIdx}`}
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-900 print:bg-black"
                      />
                    );
                  }
                  return (
                    <div
                      key={`cell_${rIdx}_${cIdx}`}
                      className="w-7 h-7 sm:w-8 sm:h-8 bg-white relative flex items-center justify-center font-bold text-xs sm:text-sm text-slate-900"
                    >
                      {cell.number && (
                        <span className="absolute top-0.5 left-0.5 text-[8px] sm:text-[9px] font-bold text-slate-600 leading-none">
                          {cell.number}
                        </span>
                      )}
                      {showAnswers ? cell.char : ''}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clues Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-slate-300 pt-4 text-xs leading-relaxed">
            {/* Mendatar (Across) */}
            <div>
              <h4 className="font-extrabold uppercase border-b-2 border-slate-800 pb-1 mb-2 text-slate-900 flex items-center justify-between">
                <span>MENDATAR (ACROSS)</span>
                <span className="text-[10px] font-normal text-slate-600">
                  {crosswordLayout.placedWords.filter(w => w.direction === 'ACROSS').length} Pertanyaan
                </span>
              </h4>
              <ol className="space-y-2">
                {crosswordLayout.placedWords
                  .filter(w => w.direction === 'ACROSS')
                  .sort((a, b) => a.number - b.number)
                  .map(word => (
                    <li key={`clue_${word.id}`} className="flex gap-2">
                      <span className="font-extrabold text-slate-900 shrink-0 w-5">
                        {word.number}.
                      </span>
                      <div>
                        <span>{word.clue}</span>
                        <span className="text-slate-500 font-semibold ml-1">
                          ({word.word.length} huruf)
                        </span>
                        {showAnswers && (
                          <span className="font-mono font-bold text-emerald-800 ml-1.5">
                            [{word.word}]
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
              </ol>
            </div>

            {/* Menurun (Down) */}
            <div>
              <h4 className="font-extrabold uppercase border-b-2 border-slate-800 pb-1 mb-2 text-slate-900 flex items-center justify-between">
                <span>MENURUN (DOWN)</span>
                <span className="text-[10px] font-normal text-slate-600">
                  {crosswordLayout.placedWords.filter(w => w.direction === 'DOWN').length} Pertanyaan
                </span>
              </h4>
              <ol className="space-y-2">
                {crosswordLayout.placedWords
                  .filter(w => w.direction === 'DOWN')
                  .sort((a, b) => a.number - b.number)
                  .map(word => (
                    <li key={`clue_down_${word.id}`} className="flex gap-2">
                      <span className="font-extrabold text-slate-900 shrink-0 w-5">
                        {word.number}.
                      </span>
                      <div>
                        <span>{word.clue}</span>
                        <span className="text-slate-500 font-semibold ml-1">
                          ({word.word.length} huruf)
                        </span>
                        {showAnswers && (
                          <span className="font-mono font-bold text-emerald-800 ml-1.5">
                            [{word.word}]
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
              </ol>
            </div>
          </div>

          {/* Printable Footer with Madrasah Values */}
          <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-600">
            <span className="italic font-serif">
              "KUIS CERDAS MATSAMAGA — Belajar, Bermain, Berpikir, dan Berprestasi."
            </span>
            <span className="font-bold">
              MTsN 5 Tegal • Kode Kuis: {quiz.code}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
