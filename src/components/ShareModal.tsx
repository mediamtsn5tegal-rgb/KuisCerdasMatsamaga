import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Quiz } from '../types';
import { useApp } from '../context/AppContext';
import { X, Download, Printer, Copy, Share2, Check } from 'lucide-react';

interface ShareModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ quiz, onClose }) => {
  const { showToast } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const joinUrl = `${window.location.origin}/join?code=${quiz.code}`;

  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#064e3b', // emerald-900
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR:', err));
  }, [joinUrl, quiz.code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    showToast('Tautan kuis berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${quiz.code}_Matsamaga.png`;
    a.click();
    showToast('Gambar QR Code berhasil diunduh.', 'success');
  };

  const handlePrintQR = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareText = `Yuk ikuti kuis "${quiz.title}" MTsN 5 Tegal!\nKode Kuis: ${quiz.code}\nLink: ${joinUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: quiz.title,
          text: shareText,
          url: joinUrl
        });
        showToast('Berhasil membagikan kuis.', 'success');
      } catch {
        handleCopy();
      }
    } else {
      // Fallback to WhatsApp share
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        ref={printRef}
        className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-900/50 text-emerald-200 border border-emerald-600/50">
            BAGIKAN KUIS
          </span>
          <h3 className="text-xl font-bold mt-2 leading-tight">
            {quiz.title}
          </h3>
          <p className="text-xs text-emerald-200 mt-1">
            Mata Pelajaran: {quiz.subject} • Kelas {quiz.grade}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-5">
          <div className="inline-block p-4 rounded-2xl bg-emerald-50/70 border-2 border-dashed border-emerald-300">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code ${quiz.code}`}
                className="w-48 h-48 mx-auto rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                Membuat QR Code...
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              KODE KUIS RESMI
            </div>
            <div className="text-3xl font-black tracking-widest text-emerald-900 mt-1 font-mono select-all">
              {quiz.code}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Peserta didik dapat memasukkan kode ini pada menu <b>Gabung Kuis</b>
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin!' : 'Salin Tautan'}
            </button>

            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download QR
            </button>

            <button
              onClick={handlePrintQR}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              Cetak QR
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              Bagikan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
