import express from 'express';
import path from 'path';
import fs from 'fs';
import { db } from './server/db';
import { generateQuizQuestionsWithAi } from './server/gemini';
import { generateCrossword, sanitizeAnswer } from './src/services/crosswordGenerator';
import { QuizResult, QuestionAnswerRecord, Quiz, Question, CompetitionRoom } from './src/types';

export const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Auth: Role-Differentiated Login System
  app.post('/api/auth/login', (req, res) => {
    const { email, identifier, role, password } = req.body;
    const state = db.getState();
    const query = (identifier || email || '').toLowerCase().trim();

    let user = state.users.find(u => {
      const matchEmail = u.email.toLowerCase() === query;
      const matchNis = u.nis && u.nis.toLowerCase() === query;
      const matchNip = u.nip && u.nip.toLowerCase() === query;
      const matchName = u.name.toLowerCase() === query;
      return matchEmail || matchNis || matchNip || matchName;
    });

    if (!user && role) {
      // Fallback to role representative
      user = state.users.find(u => u.role === role);
    }

    if (!user) {
      return res.status(401).json({ 
        error: 'Identitas tidak ditemukan. Pastikan NIS/NIP/Email sudah terdaftar atau gunakan akun demo.' 
      });
    }

    // Role check if requested portal specifically demands a role
    if (role && user.role !== role) {
      const roleNames: Record<string, string> = {
        ADMIN: 'Administrator Madrasah',
        GURU: 'Dewan Guru',
        SISWA: 'Peserta Didik (Siswa)'
      };
      return res.status(403).json({
        error: `Akses ditolak: Akun "${user.name}" terdaftar sebagai ${roleNames[user.role] || user.role}. Silakan gunakan Portal Login ${roleNames[user.role] || user.role}.`
      });
    }

    db.logAudit('USER_LOGIN', user.name, user.role, `Login berhasil melalui portal ${role || user.role}`);
    res.json({ success: true, user });
  });

  // Dedicated Student Portal Login (NIS / Name + Class)
  app.post('/api/auth/student-login', (req, res) => {
    const { nis, name, studentClass } = req.body;
    const state = db.getState();

    let student = state.users.find(u => {
      if (u.role !== 'SISWA') return false;
      if (nis && u.nis && u.nis.trim() === nis.trim()) return true;
      if (name && u.name.toLowerCase().includes(name.toLowerCase().trim())) {
        if (!studentClass || (u.studentClass && u.studentClass.toLowerCase() === studentClass.toLowerCase())) {
          return true;
        }
      }
      return false;
    });

    // Fallback: if student not found and name provided, create or select first student
    if (!student) {
      if (name && name.trim().length >= 3) {
        // Create student account on the fly if valid
        const newStudent = {
          id: `u_siswa_${Date.now()}`,
          name: name.trim(),
          nis: nis?.trim() || `2122${Math.floor(1000 + Math.random() * 9000)}`,
          email: `${name.toLowerCase().replace(/\s+/g, '')}@matsamaga.sch.id`,
          role: 'SISWA' as const,
          studentClass: studentClass?.trim() || 'IX A',
          classId: state.classes.find(c => c.name.toLowerCase() === (studentClass || 'IX A').toLowerCase())?.id || 'c_9a',
          createdAt: new Date().toISOString()
        };
        db.updateState(prev => ({ ...prev, users: [...prev.users, newStudent] }));
        student = newStudent;
      } else {
        return res.status(404).json({
          error: 'Data siswa tidak ditemukan. Periksa kembali NIS atau gunakan akun demo siswa yang tersedia.'
        });
      }
    }

    db.logAudit('STUDENT_LOGIN', student.name, 'SISWA', `Siswa ${student.name} (${student.studentClass || 'Siswa'}) masuk via Portal Siswa.`);
    res.json({ success: true, user: student });
  });

  // Dedicated Teacher Portal Login (NIP / Email)
  app.post('/api/auth/teacher-login', (req, res) => {
    const { identifier, password } = req.body;
    const state = db.getState();
    const query = (identifier || '').toLowerCase().trim();

    const teacher = state.users.find(u => {
      if (u.role !== 'GURU' && u.role !== 'ADMIN') return false;
      return (
        u.email.toLowerCase() === query ||
        (u.nip && u.nip.trim() === query) ||
        u.name.toLowerCase().includes(query)
      );
    });

    if (!teacher) {
      return res.status(401).json({
        error: 'Identitas Pendidik tidak ditemukan. Gunakan NIP atau Email resmi madrasah, atau pilih akun demo guru.'
      });
    }

    db.logAudit('TEACHER_LOGIN', teacher.name, teacher.role, `Guru ${teacher.name} (${teacher.subject || 'Mapel'}) masuk via Portal Guru.`);
    res.json({ success: true, user: teacher });
  });

  // Dedicated Admin Portal Login
  app.post('/api/auth/admin-login', (req, res) => {
    const { identifier, password } = req.body;
    const state = db.getState();
    const query = (identifier || '').toLowerCase().trim();

    const admin = state.users.find(u => {
      if (u.role !== 'ADMIN') return false;
      return (
        u.email.toLowerCase() === query ||
        query === 'admin' ||
        u.name.toLowerCase().includes(query)
      );
    });

    if (!admin) {
      return res.status(403).json({
        error: 'Kredensial Administrator tidak valid. Khusus untuk pengelola sistem Madrasah.'
      });
    }

    db.logAudit('ADMIN_LOGIN', admin.name, 'ADMIN', `Administrator masuk via Portal Administrator.`);
    res.json({ success: true, user: admin });
  });

  app.get('/api/users', (req, res) => {
    res.json(db.getState().users);
  });

  // --- CLASSES CRUD & IMPORT ---
  app.get('/api/classes', (req, res) => {
    const state = db.getState();
    const classesWithCount = state.classes.map(c => {
      const studentCount = state.users.filter(
        u => u.role === 'SISWA' && (u.classId === c.id || u.studentClass?.trim().toLowerCase() === c.name.trim().toLowerCase())
      ).length;
      return { ...c, studentCount };
    });
    res.json(classesWithCount);
  });

  app.post('/api/classes', (req, res) => {
    const { name, grade, waliKelas, academicYear } = req.body;
    if (!name || !grade) {
      return res.status(400).json({ error: 'Nama kelas dan tingkatan wajib diisi' });
    }

    const state = db.getState();
    if (state.classes.some(c => c.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      return res.status(400).json({ error: `Kelas ${name} sudah terdaftar` });
    }

    const newClass = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      grade: grade as 'VII' | 'VIII' | 'IX',
      waliKelas: waliKelas?.trim() || '-',
      academicYear: academicYear?.trim() || state.settings.academicYear || '2026/2027'
    };

    db.updateState(prev => ({
      ...prev,
      classes: [...prev.classes, newClass]
    }));

    db.logAudit('CREATE_CLASS', 'Admin/Guru', 'ADMIN', `Menambahkan kelas baru: ${newClass.name}`);
    res.status(201).json({ success: true, class: newClass });
  });

  app.put('/api/classes/:id', (req, res) => {
    const { id } = req.params;
    const { name, grade, waliKelas, academicYear } = req.body;

    const state = db.getState();
    const existing = state.classes.find(c => c.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    }

    const updated = {
      ...existing,
      name: name ? name.trim() : existing.name,
      grade: grade || existing.grade,
      waliKelas: waliKelas !== undefined ? waliKelas.trim() : existing.waliKelas,
      academicYear: academicYear !== undefined ? academicYear.trim() : existing.academicYear
    };

    // Also sync studentClass on students if name changed
    db.updateState(prev => ({
      ...prev,
      classes: prev.classes.map(c => (c.id === id ? updated : c)),
      users: prev.users.map(u => {
        if (u.role === 'SISWA' && (u.classId === id || u.studentClass === existing.name)) {
          return { ...u, studentClass: updated.name };
        }
        return u;
      })
    }));

    db.logAudit('UPDATE_CLASS', 'Admin/Guru', 'ADMIN', `Memperbarui data kelas: ${updated.name}`);
    res.json({ success: true, class: updated });
  });

  app.delete('/api/classes/:id', (req, res) => {
    const { id } = req.params;
    const state = db.getState();
    const target = state.classes.find(c => c.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    }

    db.updateState(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c.id !== id),
      users: prev.users.map(u => (u.classId === id ? { ...u, classId: undefined, studentClass: undefined } : u))
    }));

    db.logAudit('DELETE_CLASS', 'Admin/Guru', 'ADMIN', `Menghapus kelas: ${target.name}`);
    res.json({ success: true, message: `Kelas ${target.name} berhasil dihapus` });
  });

  app.post('/api/classes/import', (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data kelas tidak valid atau kosong' });
    }

    const state = db.getState();
    const addedClasses: any[] = [];
    const updatedClasses = [...state.classes];

    for (const item of items) {
      const name = String(item.name || item.Nama || item.nama || '').trim();
      if (!name) continue;

      let grade: 'VII' | 'VIII' | 'IX' = 'IX';
      const rawGrade = String(item.grade || item.Tingkat || item.tingkat || '').toUpperCase();
      if (rawGrade.includes('7') || rawGrade.includes('VII')) grade = 'VII';
      else if (rawGrade.includes('8') || rawGrade.includes('VIII')) grade = 'VIII';
      else if (rawGrade.includes('9') || rawGrade.includes('IX')) grade = 'IX';
      else if (name.startsWith('VII ') || name.startsWith('7')) grade = 'VII';
      else if (name.startsWith('VIII ') || name.startsWith('8')) grade = 'VIII';

      const waliKelas = String(item.waliKelas || item.WaliKelas || item['Wali Kelas'] || item.walikelas || '-').trim();
      const academicYear = String(item.academicYear || item.TahunAjaran || item['Tahun Ajaran'] || '2026/2027').trim();

      const existingIndex = updatedClasses.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
      if (existingIndex >= 0) {
        updatedClasses[existingIndex] = {
          ...updatedClasses[existingIndex],
          grade,
          waliKelas: waliKelas !== '-' ? waliKelas : updatedClasses[existingIndex].waliKelas,
          academicYear
        };
      } else {
        const newC = {
          id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name,
          grade,
          waliKelas,
          academicYear
        };
        updatedClasses.push(newC);
        addedClasses.push(newC);
      }
    }

    db.updateState(prev => ({
      ...prev,
      classes: updatedClasses
    }));

    db.logAudit('IMPORT_CLASSES', 'Admin/Guru', 'ADMIN', `Import ${addedClasses.length} kelas baru`);
    res.json({
      success: true,
      message: `Berhasil mengimpor ${addedClasses.length} kelas baru`,
      total: updatedClasses.length
    });
  });

  // --- STUDENTS (SISWA) CRUD & IMPORT ---
  app.get('/api/students', (req, res) => {
    const { classId, search } = req.query;
    const state = db.getState();
    let students = state.users.filter(u => u.role === 'SISWA');

    if (classId && classId !== 'ALL') {
      students = students.filter(s => s.classId === classId || s.studentClass === classId);
    }

    if (search) {
      const q = String(search).toLowerCase();
      students = students.filter(
        s => s.name.toLowerCase().includes(q) || s.nis?.toLowerCase().includes(q) || s.studentClass?.toLowerCase().includes(q)
      );
    }

    res.json(students);
  });

  app.post('/api/students', (req, res) => {
    const { name, nis, email, classId, studentClass, gender } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama siswa wajib diisi' });
    }

    const state = db.getState();
    let finalClassId = classId;
    let finalClassName = studentClass;

    if (finalClassId && !finalClassName) {
      const cls = state.classes.find(c => c.id === finalClassId);
      if (cls) finalClassName = cls.name;
    } else if (!finalClassId && finalClassName) {
      const cls = state.classes.find(c => c.name.toLowerCase() === finalClassName.toLowerCase());
      if (cls) finalClassId = cls.id;
    }

    const newStudent = {
      id: `u_siswa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      nis: nis ? String(nis).trim() : `212209${Math.floor(Math.random() * 90) + 10}`,
      email: email?.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@matsamaga.sch.id`,
      role: 'SISWA' as const,
      classId: finalClassId,
      studentClass: finalClassName,
      gender: gender === 'P' ? ('P' as const) : ('L' as const),
      createdAt: new Date().toISOString()
    };

    db.updateState(prev => ({
      ...prev,
      users: [...prev.users, newStudent]
    }));

    db.logAudit('CREATE_STUDENT', 'Admin/Guru', 'ADMIN', `Menambahkan siswa: ${newStudent.name} (${newStudent.studentClass || '-'})`);
    res.status(201).json({ success: true, student: newStudent });
  });

  app.put('/api/students/:id', (req, res) => {
    const { id } = req.params;
    const { name, nis, email, classId, studentClass, gender } = req.body;

    const state = db.getState();
    const existing = state.users.find(u => u.id === id && u.role === 'SISWA');
    if (!existing) {
      return res.status(404).json({ error: 'Data siswa tidak ditemukan' });
    }

    let finalClassId = classId !== undefined ? classId : existing.classId;
    let finalClassName = studentClass !== undefined ? studentClass : existing.studentClass;
    if (classId && !studentClass) {
      const cls = state.classes.find(c => c.id === classId);
      if (cls) finalClassName = cls.name;
    }

    const updated = {
      ...existing,
      name: name ? name.trim() : existing.name,
      nis: nis !== undefined ? String(nis).trim() : existing.nis,
      email: email !== undefined ? email.trim() : existing.email,
      classId: finalClassId,
      studentClass: finalClassName,
      gender: gender !== undefined ? gender : existing.gender
    };

    db.updateState(prev => ({
      ...prev,
      users: prev.users.map(u => (u.id === id ? updated : u))
    }));

    db.logAudit('UPDATE_STUDENT', 'Admin/Guru', 'ADMIN', `Memperbarui data siswa: ${updated.name}`);
    res.json({ success: true, student: updated });
  });

  app.delete('/api/students/:id', (req, res) => {
    const { id } = req.params;
    const state = db.getState();
    const existing = state.users.find(u => u.id === id && u.role === 'SISWA');
    if (!existing) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }

    db.updateState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id)
    }));

    db.logAudit('DELETE_STUDENT', 'Admin/Guru', 'ADMIN', `Menghapus siswa: ${existing.name}`);
    res.json({ success: true, message: `Siswa ${existing.name} berhasil dihapus` });
  });

  app.post('/api/students/import', (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data siswa tidak valid atau kosong' });
    }

    const state = db.getState();
    const newStudents: any[] = [];
    const existingUsers = [...state.users];

    for (const item of items) {
      const name = String(item.name || item.Nama || item.nama || '').trim();
      if (!name) continue;

      const nis = String(item.nis || item.NIS || item.NISN || item.nisn || `212209${Math.floor(Math.random() * 90) + 10}`).trim();
      const rawClass = String(item.class || item.kelas || item.Kelas || item.studentClass || '').trim();
      const gender = String(item.gender || item.jk || item.JK || item['Jenis Kelamin'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
      const email = String(item.email || item.Email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@matsamaga.sch.id`).trim();

      // Find or link class
      let classId: string | undefined = undefined;
      let studentClass = rawClass;
      if (rawClass) {
        const matchedClass = state.classes.find(c => c.name.toLowerCase() === rawClass.toLowerCase());
        if (matchedClass) {
          classId = matchedClass.id;
          studentClass = matchedClass.name;
        }
      }

      // Check if student with same NIS or name already exists
      const existingIdx = existingUsers.findIndex(
        u => u.role === 'SISWA' && (u.nis === nis || u.name.toLowerCase() === name.toLowerCase())
      );

      if (existingIdx >= 0) {
        existingUsers[existingIdx] = {
          ...existingUsers[existingIdx],
          name,
          nis,
          studentClass: studentClass || existingUsers[existingIdx].studentClass,
          classId: classId || existingUsers[existingIdx].classId,
          gender: gender as 'L' | 'P'
        };
      } else {
        const student = {
          id: `u_siswa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name,
          nis,
          email,
          role: 'SISWA' as const,
          classId,
          studentClass,
          gender: gender as 'L' | 'P',
          createdAt: new Date().toISOString()
        };
        existingUsers.push(student);
        newStudents.push(student);
      }
    }

    db.updateState(prev => ({
      ...prev,
      users: existingUsers
    }));

    db.logAudit('IMPORT_STUDENTS', 'Admin/Guru', 'ADMIN', `Import ${newStudents.length} siswa baru`);
    res.json({
      success: true,
      message: `Berhasil mengimpor ${newStudents.length} data siswa baru`,
      total: existingUsers.filter(u => u.role === 'SISWA').length
    });
  });

  // --- TEACHERS (GURU) CRUD & IMPORT ---
  app.get('/api/teachers', (req, res) => {
    const state = db.getState();
    const teachers = state.users.filter(u => u.role === 'GURU');
    res.json(teachers);
  });

  app.post('/api/teachers', (req, res) => {
    const { name, nip, email, subject, phone, isDeveloper } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama guru wajib diisi' });
    }

    const newTeacher = {
      id: `u_guru_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      nip: nip ? String(nip).trim() : '',
      email: email?.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@matsamaga.sch.id`,
      role: 'GURU' as const,
      subject: subject?.trim() || 'Umum',
      phone: phone?.trim() || '',
      isDeveloper: !!isDeveloper,
      createdAt: new Date().toISOString()
    };

    db.updateState(prev => ({
      ...prev,
      users: [...prev.users, newTeacher]
    }));

    db.logAudit('CREATE_TEACHER', 'Admin', 'ADMIN', `Menambahkan guru: ${newTeacher.name} (${newTeacher.subject})`);
    res.status(201).json({ success: true, teacher: newTeacher });
  });

  app.put('/api/teachers/:id', (req, res) => {
    const { id } = req.params;
    const { name, nip, email, subject, phone, isDeveloper } = req.body;

    const state = db.getState();
    const existing = state.users.find(u => u.id === id && u.role === 'GURU');
    if (!existing) {
      return res.status(404).json({ error: 'Data guru tidak ditemukan' });
    }

    const updated = {
      ...existing,
      name: name ? name.trim() : existing.name,
      nip: nip !== undefined ? String(nip).trim() : existing.nip,
      email: email !== undefined ? email.trim() : existing.email,
      subject: subject !== undefined ? subject.trim() : existing.subject,
      phone: phone !== undefined ? phone.trim() : existing.phone,
      isDeveloper: isDeveloper !== undefined ? !!isDeveloper : existing.isDeveloper
    };

    db.updateState(prev => ({
      ...prev,
      users: prev.users.map(u => (u.id === id ? updated : u))
    }));

    db.logAudit('UPDATE_TEACHER', 'Admin', 'ADMIN', `Memperbarui data guru: ${updated.name}`);
    res.json({ success: true, teacher: updated });
  });

  app.delete('/api/teachers/:id', (req, res) => {
    const { id } = req.params;
    const state = db.getState();
    const existing = state.users.find(u => u.id === id && u.role === 'GURU');
    if (!existing) {
      return res.status(404).json({ error: 'Guru tidak ditemukan' });
    }

    // Protect developer Supro, S.Pd. from accidental full deletion
    if (existing.isDeveloper || existing.name?.includes('Supro')) {
      return res.status(400).json({ error: 'Profil pengembang aplikasi utama Supro, S.Pd. dilindungi dari penghapusan.' });
    }

    db.updateState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id)
    }));

    db.logAudit('DELETE_TEACHER', 'Admin', 'ADMIN', `Menghapus data guru: ${existing.name}`);
    res.json({ success: true, message: `Guru ${existing.name} berhasil dihapus` });
  });

  app.post('/api/teachers/import', (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data guru tidak valid atau kosong' });
    }

    const state = db.getState();
    const newTeachers: any[] = [];
    const existingUsers = [...state.users];

    for (const item of items) {
      const name = String(item.name || item.Nama || item.nama || '').trim();
      if (!name) continue;

      const nip = String(item.nip || item.NIP || item.Nip || '').trim();
      const subject = String(item.subject || item.mapel || item.Mapel || item['Mata Pelajaran'] || 'Umum').trim();
      const email = String(item.email || item.Email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@matsamaga.sch.id`).trim();
      const phone = String(item.phone || item.HP || item.Telepon || '').trim();
      const isDeveloper = name.includes('Supro') || !!item.isDeveloper;

      const existingIdx = existingUsers.findIndex(
        u => u.role === 'GURU' && (u.name.toLowerCase() === name.toLowerCase() || (nip && u.nip === nip))
      );

      if (existingIdx >= 0) {
        existingUsers[existingIdx] = {
          ...existingUsers[existingIdx],
          name,
          nip: nip || existingUsers[existingIdx].nip,
          subject: subject || existingUsers[existingIdx].subject,
          phone: phone || existingUsers[existingIdx].phone,
          isDeveloper: isDeveloper || existingUsers[existingIdx].isDeveloper
        };
      } else {
        const teacher = {
          id: `u_guru_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name,
          nip,
          email,
          role: 'GURU' as const,
          subject,
          phone,
          isDeveloper,
          createdAt: new Date().toISOString()
        };
        existingUsers.push(teacher);
        newTeachers.push(teacher);
      }
    }

    db.updateState(prev => ({
      ...prev,
      users: existingUsers
    }));

    db.logAudit('IMPORT_TEACHERS', 'Admin', 'ADMIN', `Import ${newTeachers.length} guru baru`);
    res.json({
      success: true,
      message: `Berhasil mengimpor ${newTeachers.length} data guru`,
      total: existingUsers.filter(u => u.role === 'GURU').length
    });
  });

  app.get('/api/subjects', (req, res) => {
    res.json(db.getState().subjects);
  });

  app.get('/api/badges', (req, res) => {
    res.json(db.getState().badges);
  });

  // --- QUESTIONS (BANK SOAL) ---
  app.get('/api/questions', (req, res) => {
    const { subject, grade, cognitiveLevel, difficulty, search } = req.query;
    let list = [...db.getState().questions];

    if (subject && subject !== 'ALL') {
      list = list.filter(q => q.subject.toLowerCase() === String(subject).toLowerCase());
    }
    if (grade && grade !== 'ALL') {
      list = list.filter(q => q.grade === grade);
    }
    if (cognitiveLevel && cognitiveLevel !== 'ALL') {
      list = list.filter(q => q.cognitiveLevel === cognitiveLevel);
    }
    if (difficulty && difficulty !== 'ALL') {
      list = list.filter(q => q.difficulty === difficulty);
    }
    if (search) {
      const s = String(search).toLowerCase();
      list = list.filter(q => q.question.toLowerCase().includes(s) || q.answer.toLowerCase().includes(s));
    }

    res.json(list);
  });

  app.post('/api/questions', (req, res) => {
    const body = req.body;
    if (!body.question || !body.answer) {
      return res.status(400).json({ error: 'Pertanyaan dan jawaban wajib diisi.' });
    }

    const newQuestion: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      question: body.question,
      answer: (body.answer || '').toUpperCase().trim(),
      options: Array.isArray(body.options) ? body.options : [body.answer, 'Opsi B', 'Opsi C', 'Opsi D'],
      explanation: body.explanation || '',
      hint: body.hint || '',
      imageUrl: body.imageUrl || '',
      subject: body.subject || 'IPS',
      grade: body.grade || 'IX',
      phase: 'D',
      topic: body.topic || 'Materi Umum',
      subtopic: body.subtopic || '',
      learningObjective: body.learningObjective || '',
      indicator: body.indicator || '',
      cognitiveLevel: body.cognitiveLevel || 'C3',
      difficulty: body.difficulty || 'Sedang',
      profilLulusan: body.profilLulusan || ['Penalaran kritis'],
      kbcValue: body.kbcValue || ['Cinta Ilmu'],
      tags: body.tags || [],
      createdBy: body.createdBy || 'u_guru_1',
      createdAt: new Date().toISOString(),
      status: 'APPROVED'
    };

    db.updateState(prev => ({
      ...prev,
      questions: [newQuestion, ...prev.questions]
    }));

    db.logAudit('CREATE_QUESTION', 'Guru', 'GURU', `Menambahkan butir soal baru: "${newQuestion.question.substring(0, 40)}..."`);
    res.status(201).json(newQuestion);
  });

  app.put('/api/questions/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body;

    let updatedQuestion: Question | null = null;
    db.updateState(prev => {
      const questions = prev.questions.map(q => {
        if (q.id === id) {
          updatedQuestion = { ...q, ...body, answer: (body.answer ? String(body.answer).toUpperCase().trim() : q.answer) };
          return updatedQuestion;
        }
        return q;
      });
      return { ...prev, questions };
    });

    if (!updatedQuestion) {
      return res.status(404).json({ error: 'Soal tidak ditemukan.' });
    }

    db.logAudit('EDIT_QUESTION', 'Guru', 'GURU', `Mengedit butir soal ID: ${id}`);
    res.json(updatedQuestion);
  });

  app.delete('/api/questions/:id', (req, res) => {
    const { id } = req.params;
    db.updateState(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));

    db.logAudit('DELETE_QUESTION', 'Guru', 'GURU', `Menghapus butir soal ID: ${id}`);
    res.json({ success: true });
  });

  // Import CSV endpoint
  app.post('/api/questions/import-csv', (req, res) => {
    const { csvData, subject, grade } = req.body;
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ error: 'Data CSV tidak valid atau kosong.' });
    }

    const lines = csvData.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'File CSV minimal harus memiliki header dan 1 baris data.' });
    }

    const newQuestions: Question[] = [];
    const errors: { line: number; message: string }[] = [];

    // Header expected: question,answer,hint,explanation,subject,grade,topic,cognitive_level
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle simple CSV parsing with quotes
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      if (parts.length < 2 || !parts[0] || !parts[1]) {
        errors.push({ line: i + 1, message: 'Kolom question atau answer kosong' });
        continue;
      }

      const qText = parts[0];
      const ansText = parts[1].toUpperCase();
      const hintText = parts[2] || '';
      const expText = parts[3] || '';
      const subj = parts[4] || subject || 'IPS';
      const grd = (parts[5] || grade || 'IX') as 'VII' | 'VIII' | 'IX';
      const topic = parts[6] || 'Materi Umum';
      const cog = (['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].includes(parts[7]) ? parts[7] : 'C3') as any;

      newQuestions.push({
        id: `q_csv_${Date.now()}_${i}`,
        question: qText,
        answer: ansText,
        options: [ansText, 'Opsi B', 'Opsi C', 'Opsi D'],
        explanation: expText,
        hint: hintText,
        subject: subj,
        grade: grd,
        phase: 'D',
        topic,
        cognitiveLevel: cog,
        difficulty: 'Sedang',
        profilLulusan: ['Penalaran kritis'],
        kbcValue: ['Cinta Ilmu'],
        createdBy: 'u_guru_1',
        createdAt: new Date().toISOString(),
        status: 'APPROVED'
      });
    }

    if (newQuestions.length > 0) {
      db.updateState(prev => ({
        ...prev,
        questions: [...newQuestions, ...prev.questions]
      }));
      db.logAudit('IMPORT_CSV', 'Guru', 'GURU', `Berhasil mengimpor ${newQuestions.length} butir soal dari CSV.`);
    }

    res.json({
      success: true,
      importedCount: newQuestions.length,
      errors
    });
  });

  // Import Batch Questions (e.g. from Google Sheets Master_Bank_Soal)
  app.post('/api/questions/import-batch', (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data butir soal tidak valid atau kosong' });
    }

    const state = db.getState();
    const existingQuestions = [...state.questions];
    let addedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const qText = String(item.question || item.TeksSoal || item['Teks Soal'] || '').trim();
      const ansText = String(item.answer || item.Kunci || item['Kunci Jawaban'] || '').trim().toUpperCase();
      if (!qText || !ansText) continue;

      const subject = String(item.subject || item.Mapel || 'IPS').trim();
      let grade: 'VII' | 'VIII' | 'IX' = 'IX';
      const rawGrade = String(item.grade || item.Tingkat || 'IX').toUpperCase();
      if (rawGrade.includes('7') || rawGrade.includes('VII')) grade = 'VII';
      else if (rawGrade.includes('8') || rawGrade.includes('VIII')) grade = 'VIII';
      else if (rawGrade.includes('9') || rawGrade.includes('IX')) grade = 'IX';

      const topic = String(item.topic || item.Topik || 'Materi Pembelajaran').trim();
      const rawDiff = String(item.difficulty || item.Kesulitan || 'Sedang').trim();
      const difficulty = (['Mudah', 'Sedang', 'Sulit'].includes(rawDiff) ? rawDiff : 'Sedang') as any;
      const rawCog = String(item.cognitiveLevel || item.Kognitif || 'C3').trim().toUpperCase();
      const cognitiveLevel = (['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].includes(rawCog) ? rawCog : 'C3') as any;
      const explanation = String(item.explanation || item.Pembahasan || '').trim();
      const createdBy = String(item.createdBy || 'Supro, S.Pd.').trim();

      const existingIdx = existingQuestions.findIndex(
        q => (item.id && q.id === item.id) || q.question.toLowerCase() === qText.toLowerCase()
      );

      if (existingIdx >= 0) {
        existingQuestions[existingIdx] = {
          ...existingQuestions[existingIdx],
          question: qText,
          answer: ansText,
          subject,
          grade,
          topic,
          difficulty,
          cognitiveLevel,
          explanation
        };
        updatedCount++;
      } else {
        const id = item.id && !existingQuestions.some(q => q.id === item.id)
          ? item.id
          : `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        existingQuestions.push({
          id,
          question: qText,
          answer: ansText,
          options: item.options && Array.isArray(item.options) ? item.options : [ansText, 'Opsi B', 'Opsi C', 'Opsi D'],
          explanation,
          hint: item.hint || `Diawali dengan huruf ${ansText.charAt(0)}`,
          subject,
          grade,
          phase: 'D',
          topic,
          cognitiveLevel,
          difficulty,
          profilLulusan: ['Penalaran kritis'],
          kbcValue: ['Cinta Ilmu'],
          createdBy,
          createdAt: new Date().toISOString(),
          status: 'APPROVED'
        });
        addedCount++;
      }
    }

    db.updateState(prev => ({
      ...prev,
      questions: existingQuestions
    }));
    db.logAudit(
      'IMPORT_QUESTIONS_BATCH',
      'Guru/Admin',
      'GURU',
      `Impor Bank Soal dari Google Sheets: ${addedCount} baru ditambahkan, ${updatedCount} diperbarui.`
    );

    res.json({
      success: true,
      addedCount,
      updatedCount,
      total: existingQuestions.length
    });
  });

  // --- QUIZZES ---
  app.get('/api/quizzes', (req, res) => {
    res.json(db.getState().quizzes);
  });

  app.get('/api/quizzes/:idOrCode', (req, res) => {
    const { idOrCode } = req.params;
    const quiz = db.getState().quizzes.find(
      q => q.id === idOrCode || q.code.toUpperCase() === idOrCode.toUpperCase()
    );

    if (!quiz) {
      return res.status(404).json({ error: 'Kuis dengan kode/ID tersebut tidak ditemukan.' });
    }
    res.json(quiz);
  });

  app.post('/api/quizzes', (req, res) => {
    const body = req.body;
    if (!body.title || !body.type) {
      return res.status(400).json({ error: 'Judul dan tipe permainan wajib diisi.' });
    }

    // Generate unique code e.g. KCM-9A7X2
    const code = `KCM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newQuiz: Quiz = {
      id: `quiz_${Date.now()}`,
      code,
      title: body.title,
      description: body.description || '',
      subject: body.subject || 'IPS',
      grade: body.grade || 'IX',
      topic: body.topic || 'Materi Kuis',
      type: body.type,
      questions: Array.isArray(body.questions) ? body.questions : [],
      settings: body.settings || {
        randomizeQuestions: false,
        randomizeOptions: true,
        durationMinutes: 15,
        allowHints: true,
        immediateFeedback: true,
        showLeaderboard: true,
        showExplanation: 'IMMEDIATE',
        allowRetry: true,
        kktp: 75,
        privacyNameFormat: 'FULL_NAME',
        allowGuest: true,
        scoreCorrect: 10,
        scoreWrong: 0,
        hintPenalty: 3,
        speedBonusMax: 10,
        perfectBonus: 20
      },
      status: body.status || 'ACTIVE',
      targetClasses: body.targetClasses || ['c_9a'],
      createdBy: body.createdBy || 'u_guru_1',
      createdAt: new Date().toISOString()
    };

    db.updateState(prev => ({
      ...prev,
      quizzes: [newQuiz, ...prev.quizzes]
    }));

    db.logAudit('CREATE_QUIZ', 'Guru', 'GURU', `Membuat kuis baru: "${newQuiz.title}" (Kode: ${newQuiz.code})`);
    res.status(201).json(newQuiz);
  });

  app.put('/api/quizzes/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body;

    let updated: Quiz | null = null;
    db.updateState(prev => {
      const quizzes = prev.quizzes.map(q => {
        if (q.id === id) {
          updated = { ...q, ...body, updatedAt: new Date().toISOString() };
          return updated;
        }
        return q;
      });
      return { ...prev, quizzes };
    });

    if (!updated) {
      return res.status(404).json({ error: 'Kuis tidak ditemukan.' });
    }

    db.logAudit('EDIT_QUIZ', 'Guru', 'GURU', `Mengedit kuis: "${(updated as Quiz).title}"`);
    res.json(updated);
  });

  app.delete('/api/quizzes/:id', (req, res) => {
    const { id } = req.params;
    db.updateState(prev => ({
      ...prev,
      quizzes: prev.quizzes.filter(q => q.id !== id)
    }));

    db.logAudit('DELETE_QUIZ', 'Guru', 'GURU', `Menghapus kuis ID: ${id}`);
    res.json({ success: true });
  });

  // Duplicate Quiz endpoint
  app.post('/api/quizzes/:id/duplicate', (req, res) => {
    const { id } = req.params;
    const original = db.getState().quizzes.find(q => q.id === id);
    if (!original) {
      return res.status(404).json({ error: 'Kuis asli tidak ditemukan.' });
    }

    const newCode = `KCM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const duplicate: Quiz = {
      ...original,
      id: `quiz_${Date.now()}`,
      code: newCode,
      title: `${original.title} (Salinan)`,
      createdAt: new Date().toISOString(),
      status: 'DRAFT'
    };

    db.updateState(prev => ({
      ...prev,
      quizzes: [duplicate, ...prev.quizzes]
    }));

    db.logAudit('DUPLICATE_QUIZ', 'Guru', 'GURU', `Menduplikasi kuis "${original.title}" menjadi "${duplicate.title}"`);
    res.status(201).json(duplicate);
  });

  // Generate Crossword for a quiz
  app.post('/api/quizzes/:id/generate-crossword', (req, res) => {
    const { id } = req.params;
    const quiz = db.getState().quizzes.find(q => q.id === id);
    if (!quiz) {
      return res.status(404).json({ error: 'Kuis tidak ditemukan.' });
    }

    const items = quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      hint: q.hint,
      explanation: q.explanation
    }));

    const result = generateCrossword(items);
    res.json(result);
  });

  // Start a Quiz Gameplay Session
  app.post('/api/quizzes/:id/start', (req, res) => {
    const { id } = req.params;
    const { studentName, studentClass } = req.body;
    const quiz = db.getState().quizzes.find(q => q.id === id || q.code.toUpperCase() === id.toUpperCase());

    if (!quiz) {
      return res.status(404).json({ error: 'Kuis tidak ditemukan.' });
    }

    if (quiz.status === 'CLOSED') {
      return res.status(403).json({ error: 'Kuis telah ditutup oleh guru.' });
    }

    const serverStartTime = Date.now();
    const sessionId = `sess_${serverStartTime}_${Math.random().toString(36).substring(2, 6)}`;

    // Questions preparation
    let questions = [...quiz.questions];
    if (quiz.settings.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    db.logAudit('START_QUIZ', studentName || 'Guest', 'SISWA', `Memulai kuis ${quiz.title} (${quiz.code})`);

    res.json({
      sessionId,
      serverStartTime,
      quiz: {
        ...quiz,
        questions
      }
    });
  });

  // Submit Quiz Gameplay Session with Server-Side Scoring Engine
  app.post('/api/quizzes/:id/submit', (req, res) => {
    const { id } = req.params;
    const {
      studentName,
      studentClass,
      userId,
      userAnswers, // Record<questionId, { answer: string, hintsUsed: number, timeSpent: number }>
      clientTimeSpent
    } = req.body;

    const quiz = db.getState().quizzes.find(q => q.id === id || q.code.toUpperCase() === id.toUpperCase());
    if (!quiz) {
      return res.status(404).json({ error: 'Kuis tidak ditemukan.' });
    }

    // SERVER-SIDE SCORING ENGINE (as demanded by prompt section R & AT:
    // "Semua skor harus dihitung di server, jangan mempercayai skor dari client!")
    const settings = quiz.settings;
    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const answersRecord: QuestionAnswerRecord[] = [];

    quiz.questions.forEach(q => {
      const submission = userAnswers?.[q.id];
      const givenAnswer = submission?.answer ? String(submission.answer).trim() : '';
      const cleanExpected = sanitizeAnswer(q.answer);
      const cleanGiven = sanitizeAnswer(givenAnswer);

      if (!cleanGiven) {
        unansweredCount++;
        answersRecord.push({
          questionId: q.id,
          userAnswer: '',
          isCorrect: false,
          pointsEarned: 0,
          timeSpentSeconds: submission?.timeSpent || 0,
          hintsUsedCount: 0
        });
      } else if (cleanGiven === cleanExpected) {
        correctCount++;
        // Base correct point
        let questionPoints = settings.scoreCorrect || 10;
        // Hint penalty
        const hintsUsed = submission?.hintsUsed || 0;
        const penalty = hintsUsed * (settings.hintPenalty || 3);
        questionPoints = Math.max(1, questionPoints - penalty);

        // Speed bonus if answered in under 15s
        if (submission?.timeSpent && submission.timeSpent < 15) {
          const speedBonus = Math.min(settings.speedBonusMax || 5, Math.ceil((15 - submission.timeSpent) / 2));
          questionPoints += speedBonus;
        }

        totalScore += questionPoints;
        answersRecord.push({
          questionId: q.id,
          userAnswer: givenAnswer,
          isCorrect: true,
          pointsEarned: questionPoints,
          timeSpentSeconds: submission?.timeSpent || 0,
          hintsUsedCount: hintsUsed
        });
      } else {
        wrongCount++;
        const wrongPenalty = settings.scoreWrong || 0;
        totalScore = Math.max(0, totalScore - wrongPenalty);
        answersRecord.push({
          questionId: q.id,
          userAnswer: givenAnswer,
          isCorrect: false,
          pointsEarned: 0,
          timeSpentSeconds: submission?.timeSpent || 0,
          hintsUsedCount: submission?.hintsUsed || 0
        });
      }
    });

    // Perfect completion bonus
    if (correctCount === quiz.questions.length && quiz.questions.length > 0) {
      totalScore += settings.perfectBonus || 20;
    }

    const totalQuestions = quiz.questions.length || 1;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // Predicate assignment
    let predicate = 'Perlu Pendampingan (D)';
    if (percentage >= 90) predicate = 'Istimewa (A)';
    else if (percentage >= 80) predicate = 'Sangat Baik (B)';
    else if (percentage >= 70) predicate = 'Baik (C)';

    // Badges calculation
    const badgesUnlocked: string[] = ['First Game'];
    if (quiz.type === 'CROSSWORD' || quiz.type === 'WORD_SEARCH') {
      badgesUnlocked.push('Puzzle Solver');
    }
    if (percentage === 100) {
      badgesUnlocked.push('Perfect Score');
    }
    if (clientTimeSpent && clientTimeSpent < (settings.durationMinutes * 60 * 0.4)) {
      badgesUnlocked.push('Speed Solver');
    }
    if (quiz.type === 'CROSSWORD' && percentage === 100) {
      badgesUnlocked.push('TTS Master');
    }
    if (quiz.type === 'WORD_SEARCH' && percentage === 100) {
      badgesUnlocked.push('Word Search Master');
    }

    const result: QuizResult = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizType: quiz.type,
      studentName: studentName || 'Peserta Matsamaga',
      studentClass: studentClass || 'IX A',
      userId: userId || undefined,
      score: totalScore,
      percentage,
      correctCount,
      wrongCount,
      unansweredCount,
      timeSpentSeconds: clientTimeSpent || 60,
      completedAt: new Date().toISOString(),
      answers: answersRecord,
      badgesUnlocked,
      predicate
    };

    db.updateState(prev => ({
      ...prev,
      results: [result, ...prev.results]
    }));

    db.logAudit(
      'SUBMIT_QUIZ',
      result.studentName,
      'SISWA',
      `Menyelesaikan kuis "${quiz.title}" dengan nilai ${percentage} (${result.predicate})`
    );

    res.json({
      success: true,
      result
    });
  });

  // --- RESULTS & ANALYTICS ---
  app.get('/api/results', (req, res) => {
    const { quizId, studentName, studentClass } = req.query;
    let list = [...db.getState().results];

    if (quizId) {
      list = list.filter(r => r.quizId === quizId);
    }
    if (studentClass) {
      list = list.filter(r => r.studentClass.toLowerCase() === String(studentClass).toLowerCase());
    }
    if (studentName) {
      list = list.filter(r => r.studentName.toLowerCase().includes(String(studentName).toLowerCase()));
    }

    res.json(list);
  });

  app.get('/api/results/:id', (req, res) => {
    const { id } = req.params;
    const result = db.getState().results.find(r => r.id === id);
    if (!result) {
      return res.status(404).json({ error: 'Hasil pengerjaan tidak ditemukan.' });
    }
    res.json(result);
  });

  app.get('/api/analytics/:quizId', (req, res) => {
    const { quizId } = req.params;
    const quiz = db.getState().quizzes.find(q => q.id === quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Kuis tidak ditemukan.' });
    }

    const quizResults = db.getState().results.filter(r => r.quizId === quizId);
    const totalParticipants = quizResults.length;

    if (totalParticipants === 0) {
      return res.json({
        quizId,
        quizTitle: quiz.title,
        totalParticipants: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passPercentage: 0,
        itemAnalysis: quiz.questions.map(q => ({
          questionId: q.id,
          question: q.question,
          totalAttempts: 0,
          correctCount: 0,
          wrongCount: 0,
          correctPercentage: 0,
          difficultyCategory: 'Sedang' as const,
          averageTimeSeconds: 0
        }))
      });
    }

    const scores = quizResults.map(r => r.percentage);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalParticipants);
    const passCount = scores.filter(s => s >= (quiz.settings.kktp || 75)).length;
    const passPercentage = Math.round((passCount / totalParticipants) * 100);

    // Item-by-item analysis
    const itemAnalysis = quiz.questions.map(q => {
      let qAttempts = 0;
      let qCorrect = 0;
      let totalTime = 0;

      quizResults.forEach(r => {
        const ans = r.answers.find(a => a.questionId === q.id);
        if (ans) {
          qAttempts++;
          if (ans.isCorrect) qCorrect++;
          totalTime += ans.timeSpentSeconds || 0;
        }
      });

      const correctPercentage = qAttempts > 0 ? Math.round((qCorrect / qAttempts) * 100) : 0;
      let difficultyCategory: 'Mudah' | 'Sedang' | 'Sulit' = 'Sedang';
      if (correctPercentage <= 40) difficultyCategory = 'Sulit';
      else if (correctPercentage > 70) difficultyCategory = 'Mudah';

      return {
        questionId: q.id,
        question: q.question,
        totalAttempts: qAttempts,
        correctCount: qCorrect,
        wrongCount: qAttempts - qCorrect,
        correctPercentage,
        difficultyCategory,
        averageTimeSeconds: qAttempts > 0 ? Math.round(totalTime / qAttempts) : 0
      };
    });

    res.json({
      quizId,
      quizTitle: quiz.title,
      totalParticipants,
      averageScore,
      highestScore,
      lowestScore,
      passPercentage,
      itemAnalysis
    });
  });

  // --- AI QUIZ GENERATOR ENDPOINT ---
  app.post('/api/ai/generate-questions', async (req, res) => {
    try {
      const params = req.body;
      const teacherId = req.body.teacherId || 'u_guru_1';
      const questions = await generateQuizQuestionsWithAi(params, teacherId);

      db.logAudit(
        'AI_GENERATE',
        'Guru',
        'GURU',
        `Membuat ${questions.length} soal AI untuk materi: "${params.topic || 'Umum'}"`
      );

      res.json({ success: true, questions });
    } catch (err: any) {
      console.error('Error generating questions with AI:', err);
      res.status(500).json({ error: 'Gagal membuat soal dengan AI: ' + (err.message || 'Kesalahan internal') });
    }
  });

  // --- COMPETITION LIVE ROOMS ---
  app.get('/api/competition/rooms', (req, res) => {
    res.json(db.getState().competitionRooms);
  });

  app.post('/api/competition/rooms', (req, res) => {
    const { quizId, roomCode } = req.body;
    const quiz = db.getState().quizzes.find(q => q.id === quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Kuis tidak ditemukan.' });
    }

    const code = (roomCode || `KCM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`).toUpperCase();
    const newRoom: CompetitionRoom = {
      id: `room_${Date.now()}`,
      code,
      quizId: quiz.id,
      quizTitle: quiz.title,
      hostTeacherId: 'u_guru_1',
      hostTeacherName: 'Ahmad Fauzi, M.Pd.',
      status: 'WAITING',
      participants: []
    };

    db.updateState(prev => ({
      ...prev,
      competitionRooms: [newRoom, ...prev.competitionRooms.filter(r => r.code !== code)]
    }));

    db.logAudit('CREATE_ROOM', 'Guru', 'GURU', `Membuka room kompetisi live: ${code}`);
    res.status(201).json(newRoom);
  });

  app.get('/api/competition/rooms/:code', (req, res) => {
    const { code } = req.params;
    const room = db.getState().competitionRooms.find(r => r.code.toUpperCase() === code.toUpperCase());
    if (!room) {
      return res.status(404).json({ error: 'Room kompetisi tidak ditemukan.' });
    }
    res.json(room);
  });

  app.post('/api/competition/rooms/:code/join', (req, res) => {
    const { code } = req.params;
    const { studentName, studentClass } = req.body;
    let joinedRoom: CompetitionRoom | null = null;

    db.updateState(prev => {
      const rooms = prev.competitionRooms.map(r => {
        if (r.code.toUpperCase() === code.toUpperCase()) {
          const participantId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
          const existingIdx = r.participants.findIndex(p => p.name.toLowerCase() === studentName.toLowerCase());
          let participants = [...r.participants];

          if (existingIdx >= 0) {
            participants[existingIdx].lastActiveAt = new Date().toISOString();
          } else {
            participants.push({
              id: participantId,
              name: studentName,
              studentClass: studentClass || 'IX A',
              score: 0,
              currentQuestionIndex: 0,
              completed: false,
              lastActiveAt: new Date().toISOString()
            });
          }
          joinedRoom = { ...r, participants };
          return joinedRoom;
        }
        return r;
      });
      return { ...prev, competitionRooms: rooms };
    });

    if (!joinedRoom) {
      return res.status(404).json({ error: 'Room tidak ditemukan.' });
    }

    res.json({ success: true, room: joinedRoom });
  });

  app.post('/api/competition/rooms/:code/start', (req, res) => {
    const { code } = req.params;
    let startedRoom: CompetitionRoom | null = null;

    db.updateState(prev => {
      const rooms = prev.competitionRooms.map(r => {
        if (r.code.toUpperCase() === code.toUpperCase()) {
          startedRoom = { ...r, status: 'STARTED', startedAt: new Date().toISOString() };
          return startedRoom;
        }
        return r;
      });
      return { ...prev, competitionRooms: rooms };
    });

    if (!startedRoom) {
      return res.status(404).json({ error: 'Room tidak ditemukan.' });
    }

    db.logAudit('START_COMPETITION', 'Guru', 'GURU', `Kompetisi dimulai untuk room ${code}`);
    res.json({ success: true, room: startedRoom });
  });

  app.post('/api/competition/rooms/:code/update-score', (req, res) => {
    const { code } = req.params;
    const { studentName, score, questionIndex, completed } = req.body;
    let currentRoom: CompetitionRoom | null = null;

    db.updateState(prev => {
      const rooms = prev.competitionRooms.map(r => {
        if (r.code.toUpperCase() === code.toUpperCase()) {
          const participants = r.participants.map(p => {
            if (p.name.toLowerCase() === (studentName || '').toLowerCase()) {
              return {
                ...p,
                score: score !== undefined ? score : p.score,
                currentQuestionIndex: questionIndex !== undefined ? questionIndex : p.currentQuestionIndex,
                completed: completed !== undefined ? completed : p.completed,
                lastActiveAt: new Date().toISOString()
              };
            }
            return p;
          });
          currentRoom = { ...r, participants };
          return currentRoom;
        }
        return r;
      });
      return { ...prev, competitionRooms: rooms };
    });

    res.json({ success: true, room: currentRoom });
  });

  // --- ADMIN STATS & SETTINGS ---
  app.get('/api/admin/stats', (req, res) => {
    const state = db.getState();
    const totalGuru = state.users.filter(u => u.role === 'GURU').length;
    const totalSiswa = state.users.filter(u => u.role === 'SISWA').length;
    const totalKuis = state.quizzes.length;
    const totalSoal = state.questions.length;
    const kuisAktif = state.quizzes.filter(q => q.status === 'ACTIVE').length;
    const jumlahPengerjaan = state.results.length;

    res.json({
      totalGuru,
      totalSiswa,
      totalKuis,
      totalSoal,
      kuisAktif,
      jumlahPengerjaan,
      recentQuizzes: state.quizzes.slice(0, 5),
      recentResults: state.results.slice(0, 5)
    });
  });

  app.get(['/api/admin/audit-logs', '/api/audit-logs'], (req, res) => {
    res.json(db.getState().auditLogs || []);
  });

  app.get('/api/admin/settings', (req, res) => {
    res.json(db.getState().settings);
  });

  app.put('/api/admin/settings', (req, res) => {
    const newSettings = req.body;
    db.updateState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
    db.logAudit('UPDATE_SETTINGS', 'Administrator', 'ADMIN', 'Memperbarui konfigurasi sistem madrasah');
    res.json(db.getState().settings);
  });

  // Reset Demo Database
  app.post('/api/admin/reset-demo', (req, res) => {
    db.resetToInitial();
    db.logAudit('RESET_DATABASE', 'Administrator', 'ADMIN', 'Me-reset database demo ke pengaturan awal MTsN 5 Tegal');
    res.json({ success: true, message: 'Database demo berhasil di-reset ke data bawaan MTsN 5 Tegal.' });
  });

  // Clear demo results and prepare for real examination / production data
  app.post('/api/admin/clear-demo-results', (req, res) => {
    db.updateState(prev => ({
      ...prev,
      results: [],
      competitionRooms: []
    }));
    db.logAudit(
      'PREPARE_PRODUCTION',
      'Administrator',
      'ADMIN',
      'Membersihkan data hasil demo uji coba. Sistem siap untuk data asesmen riil madrasah.'
    );
    res.json({
      success: true,
      message: 'Seluruh riwayat asesmen dan nilai demo telah dibersihkan. Aplikasi siap digunakan untuk asesmen riil madrasah!'
    });
  });

  // --- REPORT: DOWNLOAD HASIL NILAI SISWA PER KELAS ---
  app.get('/api/reports/class-results', (req, res) => {
    const { classId, quizId, format } = req.query;
    const state = db.getState();

    // Determine target class
    let targetClass: any = null;
    if (classId && classId !== 'ALL') {
      targetClass = state.classes.find(
        c => c.id === classId || c.name.toLowerCase() === String(classId).toLowerCase()
      );
    }

    const className = targetClass ? targetClass.name : (classId && classId !== 'ALL' ? String(classId) : 'Semua Kelas');

    // Get students in this class
    const classStudents = state.users.filter(u => {
      if (u.role !== 'SISWA') return false;
      if (!targetClass && (!classId || classId === 'ALL')) return true;
      if (targetClass && (u.classId === targetClass.id || u.studentClass?.toLowerCase() === targetClass.name.toLowerCase())) {
        return true;
      }
      if (u.studentClass?.toLowerCase() === String(classId).toLowerCase()) return true;
      return false;
    });

    // Get results
    let results = state.results;
    if (targetClass) {
      results = results.filter(
        r => r.studentClass?.toLowerCase() === targetClass.name.toLowerCase() ||
             classStudents.some(s => s.id === r.userId || s.name.toLowerCase() === r.studentName.toLowerCase())
      );
    } else if (classId && classId !== 'ALL') {
      results = results.filter(r => r.studentClass?.toLowerCase() === String(classId).toLowerCase());
    }

    if (quizId && quizId !== 'ALL') {
      results = results.filter(r => r.quizId === quizId);
    }

    const kktp = state.settings.defaultKktp || 75;

    // Build row items
    const rows = results.map((r, idx) => {
      const student = classStudents.find(
        s => s.id === r.userId || s.name.toLowerCase() === r.studentName.toLowerCase()
      );
      const isPassed = r.percentage >= kktp;
      return {
        no: idx + 1,
        studentId: student?.id || r.userId || '-',
        nis: student?.nis || '-',
        studentName: r.studentName,
        studentClass: r.studentClass || className,
        gender: student?.gender || '-',
        quizTitle: r.quizTitle,
        quizType: r.quizType,
        score: r.percentage,
        rawScore: r.score,
        correctCount: r.correctCount,
        wrongCount: r.wrongCount,
        unansweredCount: r.unansweredCount || 0,
        timeSpentSeconds: r.timeSpentSeconds,
        timeSpentFormatted: `${Math.floor(r.timeSpentSeconds / 60)}m ${r.timeSpentSeconds % 60}s`,
        status: isPassed ? 'TUNTAS' : 'BELUM TUNTAS',
        predicate: r.predicate || (isPassed ? 'Tuntas' : 'Perlu Pendampingan'),
        completedAt: r.completedAt
      };
    });

    // Statistical summary
    const totalRecords = rows.length;
    const scores = rows.map(r => r.score);
    const avgScore = totalRecords > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / totalRecords) * 10) / 10 : 0;
    const maxScore = totalRecords > 0 ? Math.max(...scores) : 0;
    const minScore = totalRecords > 0 ? Math.min(...scores) : 0;
    const passedCount = rows.filter(r => r.status === 'TUNTAS').length;
    const passedPercentage = totalRecords > 0 ? Math.round((passedCount / totalRecords) * 100) : 0;

    // Check if CSV format requested
    if (format === 'csv') {
      const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      
      const csvHeader = [
        'No',
        'NIS',
        'Nama Siswa',
        'Kelas',
        'L/P',
        'Judul Kuis',
        'Jenis Kuis',
        'Nilai (0-100)',
        'Skor Bobot',
        'Benar',
        'Salah',
        'Kosong',
        'Durasi',
        'Ketuntasan KKTP',
        'Predikat',
        'Waktu Selesai'
      ].join(';');

      const csvRows = rows.map(r => [
        r.no,
        escapeCsv(r.nis),
        escapeCsv(r.studentName),
        escapeCsv(r.studentClass),
        escapeCsv(r.gender),
        escapeCsv(r.quizTitle),
        escapeCsv(r.quizType),
        r.score,
        r.rawScore,
        r.correctCount,
        r.wrongCount,
        r.unansweredCount,
        escapeCsv(r.timeSpentFormatted),
        escapeCsv(r.status),
        escapeCsv(r.predicate),
        escapeCsv(new Date(r.completedAt).toLocaleString('id-ID'))
      ].join(';'));

      const summaryLines = [
        `\r\n"REKAPITULASI HASIL NILAI ASESMEN SISWA - MTs NEGERI 5 TEGAL"`,
        `"Kelas: ${className}"`,
        `"Wali Kelas: ${targetClass?.waliKelas || '-'}"`,
        `"Tahun Ajaran: ${state.settings.academicYear || '2026/2027'}"`,
        `"KKTP Madrasah: ${kktp}"`,
        `"Rata-rata Nilai: ${avgScore}"`,
        `"Ketuntasan Klasikal: ${passedPercentage}% (${passedCount}/${totalRecords} Siswa)"`,
        `"Dicetak pada: ${new Date().toLocaleString('id-ID')}"`,
        `"Pengembang Aplikasi: Supro, S.Pd. (MTsN 5 Tegal)"\r\n`
      ];

      // Add UTF-8 BOM for Microsoft Excel compatibility
      const csvContent = '\uFEFF' + summaryLines.join('\r\n') + '\r\n' + csvHeader + '\r\n' + csvRows.join('\r\n');

      const safeClassName = className.replace(/[^a-zA-Z0-9]/g, '_');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Rekap_Nilai_${safeClassName}_${Date.now()}.csv"`);
      return res.send(csvContent);
    }

    // Default JSON response
    res.json({
      className,
      classInfo: targetClass,
      totalRegisteredStudents: classStudents.length,
      totalSubmissions: totalRecords,
      kktp,
      averageScore: avgScore,
      maxScore,
      minScore,
      passedCount,
      failedCount: totalRecords - passedCount,
      passedPercentage,
      academicYear: state.settings.academicYear,
      developerName: state.settings.developerName || 'Supro, S.Pd.',
      records: rows
    });
  });

  // 404 Handler for unmatched /api routes (prevents returning SPA HTML for API calls)
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Only start standalone HTTP server and Vite middleware if NOT running on Vercel serverless function
  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    async function startServer() {
      // Vite middleware setup
      const isProduction =
        process.env.NODE_ENV === 'production' ||
        (!process.env.NODE_ENV && fs.existsSync(path.join(process.cwd(), 'dist', 'index.html')));

      if (!isProduction) {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa'
        });
        app.use(vite.middlewares);
      } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
      });
    }

    startServer();
  }

  export default app;
