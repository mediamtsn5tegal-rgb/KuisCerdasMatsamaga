import React, { useState } from 'react';
import { Award, Code2, Mail, Phone, BookOpen, CheckCircle, Sparkles, Edit3 } from 'lucide-react';
import { User, SystemSettings } from '../../types';

interface Props {
  developerUser?: User;
  settings?: SystemSettings;
  onUpdate?: () => void;
}

export const DeveloperProfileCard: React.FC<Props> = ({ developerUser, settings, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(developerUser?.name || 'Supro, S.Pd.');
  const [nip, setNip] = useState(developerUser?.nip || '198205122009011012');
  const [subject, setSubject] = useState(developerUser?.subject || 'Ilmu Pengetahuan Sosial (IPS)');
  const [phone, setPhone] = useState(developerUser?.phone || '081234567890');
  const [email, setEmail] = useState(developerUser?.email || 'supro@matsamaga.sch.id');
  const [bio, setBio] = useState(
    settings?.developerBio ||
    'Pendidik inovatif MTsN 5 Tegal yang merancang dan mengembangkan platform asesmen interaktif gamifikasi berbasis Kurikulum Merdeka Fase D & Kurikulum Berbasis Cinta (KBC).'
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (developerUser?.id) {
        await fetch(`/api/teachers/${developerUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            nip,
            subject,
            phone,
            email,
            isDeveloper: true
          })
        });
      }

      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developerName: name,
          developerRole: `Guru Mapel ${subject} & Pengembang Aplikasi`,
          developerBio: bio
        })
      });

      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-700/50">
      {/* Background Decorative Pattern */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-700/60 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/20">
              <Code2 className="w-6 h-6 text-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-400/90 text-amber-950 px-2.5 py-0.5 rounded-full">
                  Identitas Pengembang & Guru
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-semibold bg-emerald-800/60 px-2 py-0.5 rounded-full border border-emerald-600/50">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> Terverifikasi MTsN 5 Tegal
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Profil Guru & Pengembang Aplikasi
              </h2>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 text-xs font-bold transition-colors border border-white/10 backdrop-blur-xs self-end sm:self-auto"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Batal Edit' : 'Edit Profil'}</span>
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="mt-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-emerald-200 font-bold mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-emerald-600/60 text-white font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-emerald-200 font-bold mb-1">NIP (Nomor Induk Pegawai)</label>
                <input
                  type="text"
                  value={nip}
                  onChange={e => setNip(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-emerald-600/60 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-emerald-200 font-bold mb-1">Mata Pelajaran yang Diampu</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-emerald-600/60 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-emerald-200 font-bold mb-1">No. WhatsApp / Telepon</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-emerald-600/60 text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-emerald-200 font-bold mb-1">Email Resmi</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-emerald-600/60 text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-emerald-200 font-bold mb-1">Deskripsi / Peran Inovasi</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-emerald-600/60 text-white leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow-lg"
              >
                {saving ? 'Menyimpan...' : 'Simpan Profil Pengembang'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-2xl font-black text-amber-300 tracking-tight">
                  {name}
                </h3>
                <span className="text-xs bg-emerald-700/80 text-emerald-100 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  Guru Mata Pelajaran {subject}
                </span>
              </div>

              <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl">
                {bio}
              </p>

              <div className="flex flex-wrap gap-4 pt-2 text-xs text-emerald-200/90">
                {nip && (
                  <div className="flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-700/40 font-mono">
                    <span className="text-emerald-400 font-bold">NIP:</span>
                    <span>{nip}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-700/40">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{email}</span>
                </div>
                {phone && (
                  <div className="flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-700/40">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Highlight Box */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Karya Inovasi Madrasah</span>
              </div>
              <p className="text-[11px] text-emerald-100/80 leading-snug">
                Dikembangkan khusus untuk mendukung asesmen diagnostik, formatif, dan sumatif interaktif di lingkungan MTs Negeri 5 Tegal.
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300">
                <span>Versi: 2.4.0 Production</span>
                <span className="font-bold text-amber-400">© MTsN 5 Tegal</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
