import { QuizResult, Quiz, Question } from '../types';

export interface SheetSetupResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

const SHEET_NAMES = {
  RESULTS: 'Hasil_Asesmen_Siswa',
  RESPONSES: 'Respon_Jawaban_Detail',
  CLASSES: 'Master_Kelas',
  STUDENTS: 'Master_Siswa',
  TEACHERS: 'Master_Guru',
  QUESTIONS: 'Master_Bank_Soal'
};

const HEADERS = {
  RESULTS: [
    'No',
    'Tanggal & Waktu',
    'NIS Siswa',
    'Nama Siswa',
    'Kelas',
    'Judul Kuis',
    'Tipe Kuis',
    'Skor Poin',
    'Nilai Akhir (0-100)',
    'Predikat',
    'Status KKTP',
    'Benar',
    'Salah',
    'Kosong',
    'Durasi (Detik)'
  ],
  RESPONSES: [
    'Waktu Selesai',
    'Nama Siswa',
    'Kelas',
    'Judul Kuis',
    'ID Soal',
    'Teks Pertanyaan',
    'Jawaban Siswa',
    'Kunci Jawaban',
    'Hasil (Benar/Salah)',
    'Poin Diperoleh',
    'Durasi Jawab (Detik)',
    'Petunjuk Digunakan'
  ],
  CLASSES: [
    'ID Kelas',
    'Nama Kelas',
    'Tingkat (Fase D)',
    'Wali Kelas',
    'Tahun Ajaran'
  ],
  STUDENTS: [
    'NIS',
    'Nama Lengkap',
    'Rombel / Kelas',
    'Jenis Kelamin',
    'Email Akun'
  ],
  TEACHERS: [
    'NIP',
    'Nama Lengkap & Gelar',
    'Mata Pelajaran',
    'Nomor WhatsApp/HP',
    'Email Resmi',
    'Peran / Tim Pengembang'
  ],
  QUESTIONS: [
    'ID Soal',
    'Mata Pelajaran',
    'Tingkat / Fase',
    'Topik / Materi',
    'Tingkat Kesulitan',
    'Level Kognitif',
    'Teks Soal / Pertanyaan',
    'Kunci Jawaban',
    'Penjelasan / Pembahasan',
    'Dibuat Oleh'
  ]
};

/**
 * Creates a brand-new Google Spreadsheet with all required sheets and headers
 */
export async function createMadrasahSpreadsheet(
  accessToken: string,
  madrasahName = 'MTsN 5 Tegal'
): Promise<SheetSetupResult> {
  const title = `[${madrasahName}] Database Asesmen & Nilai Kuis Cerdas Matsamaga`;

  // Step 1: Create Spreadsheet with multiple sheets
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title },
      sheets: Object.values(SHEET_NAMES).map(name => ({
        properties: { title: name }
      }))
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal membuat spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Step 2: Write column headers to each sheet
  const headerData = [
    {
      range: `${SHEET_NAMES.RESULTS}!A1:${String.fromCharCode(64 + HEADERS.RESULTS.length)}1`,
      values: [HEADERS.RESULTS]
    },
    {
      range: `${SHEET_NAMES.RESPONSES}!A1:${String.fromCharCode(64 + HEADERS.RESPONSES.length)}1`,
      values: [HEADERS.RESPONSES]
    },
    {
      range: `${SHEET_NAMES.CLASSES}!A1:${String.fromCharCode(64 + HEADERS.CLASSES.length)}1`,
      values: [HEADERS.CLASSES]
    },
    {
      range: `${SHEET_NAMES.STUDENTS}!A1:${String.fromCharCode(64 + HEADERS.STUDENTS.length)}1`,
      values: [HEADERS.STUDENTS]
    },
    {
      range: `${SHEET_NAMES.TEACHERS}!A1:${String.fromCharCode(64 + HEADERS.TEACHERS.length)}1`,
      values: [HEADERS.TEACHERS]
    },
    {
      range: `${SHEET_NAMES.QUESTIONS}!A1:${String.fromCharCode(64 + HEADERS.QUESTIONS.length)}1`,
      values: [HEADERS.QUESTIONS]
    }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headerData
    })
  });

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Appends a student quiz result and its individual question responses to Google Sheets
 */
export async function appendQuizResultToSheets(
  accessToken: string,
  spreadsheetId: string,
  result: QuizResult,
  quizQuestions?: Question[]
): Promise<void> {
  const dateStr = new Date(result.completedAt || Date.now()).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta'
  });

  const isPassed = result.percentage >= 75 ? 'TUNTAS' : 'BELUM TUNTAS';

  // 1. Row for Hasil_Asesmen_Siswa
  const resultRow = [
    result.id,
    dateStr,
    result.userId || '-',
    result.studentName,
    result.studentClass,
    result.quizTitle,
    result.quizType,
    result.score,
    result.percentage,
    result.predicate,
    isPassed,
    result.correctCount,
    result.wrongCount,
    result.unansweredCount || 0,
    result.timeSpentSeconds
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAMES.RESULTS}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [resultRow]
      })
    }
  );

  // 2. Rows for Respon_Jawaban_Detail (if questions and answers are present)
  if (result.answers && result.answers.length > 0) {
    const questionMap = new Map<string, Question>();
    if (quizQuestions) {
      quizQuestions.forEach(q => questionMap.set(q.id, q));
    }

    const responseRows = result.answers.map(ans => {
      const questionObj = questionMap.get(ans.questionId);
      return [
        dateStr,
        result.studentName,
        result.studentClass,
        result.quizTitle,
        ans.questionId,
        questionObj?.question || '-',
        ans.userAnswer || '(Tidak dijawab)',
        questionObj?.answer || '-',
        ans.isCorrect ? 'BENAR' : 'SALAH',
        ans.pointsEarned,
        ans.timeSpentSeconds,
        ans.hintsUsedCount
      ];
    });

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAMES.RESPONSES}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: responseRows
        })
      }
    );
  }
}

/**
 * Pushes all current application data (classes, students, teachers, bank soal, results) to Google Sheets
 */
export async function syncAllDataToGoogleSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<{ success: boolean; message: string }> {
  // Fetch fresh data from local API
  const [classes, students, teachers, questions, quizzes, results] = await Promise.all([
    fetch('/api/classes').then(r => (r.ok ? r.json() : [])).catch(() => []),
    fetch('/api/students').then(r => (r.ok ? r.json() : [])).catch(() => []),
    fetch('/api/teachers').then(r => (r.ok ? r.json() : [])).catch(() => []),
    fetch('/api/questions').then(r => (r.ok ? r.json() : [])).catch(() => []),
    fetch('/api/quizzes').then(r => (r.ok ? r.json() : [])).catch(() => []),
    fetch('/api/results').then(r => (r.ok ? r.json() : [])).catch(() => [])
  ]);

  // Build question map for response lookup
  const questionMap = new Map<string, any>();
  questions.forEach((q: any) => questionMap.set(q.id, q));

  // 1. Classes rows
  const classRows = [
    HEADERS.CLASSES,
    ...classes.map((c: any) => [
      c.id,
      c.name,
      c.grade || 'Fase D',
      c.waliKelas || '-',
      c.academicYear || '2026/2027'
    ])
  ];

  // 2. Students rows
  const studentRows = [
    HEADERS.STUDENTS,
    ...students.map((s: any) => [
      s.nis || '-',
      s.name,
      s.studentClass || '-',
      s.gender || '-',
      s.email || '-'
    ])
  ];

  // 3. Teachers rows
  const teacherRows = [
    HEADERS.TEACHERS,
    ...teachers.map((t: any) => [
      t.nip || '-',
      t.name,
      t.subject || '-',
      t.phone || '-',
      t.email || '-',
      t.isDeveloper ? 'Pengembang Aplikasi KCM & Guru' : 'Dewan Guru'
    ])
  ];

  // 4. Questions rows
  const questionRows = [
    HEADERS.QUESTIONS,
    ...questions.map((q: any) => [
      q.id,
      q.subject,
      q.grade,
      q.topic,
      q.difficulty,
      q.cognitiveLevel || 'C3',
      q.question,
      q.answer,
      q.explanation || '-',
      q.createdBy || 'Supro, S.Pd.'
    ])
  ];

  // 5. Results rows
  const resultRows = [
    HEADERS.RESULTS,
    ...results.map((r: any, idx: number) => {
      const dateStr = new Date(r.completedAt || Date.now()).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta'
      });
      return [
        idx + 1,
        dateStr,
        r.userId || '-',
        r.studentName,
        r.studentClass,
        r.quizTitle,
        r.quizType,
        r.score,
        r.percentage,
        r.predicate,
        r.percentage >= 75 ? 'TUNTAS' : 'BELUM TUNTAS',
        r.correctCount,
        r.wrongCount,
        r.unansweredCount || 0,
        r.timeSpentSeconds
      ];
    })
  ];

  // 6. Detailed Response rows
  const detailResponseRows: any[][] = [HEADERS.RESPONSES];
  results.forEach((r: any) => {
    const dateStr = new Date(r.completedAt || Date.now()).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta'
    });
    if (Array.isArray(r.answers)) {
      r.answers.forEach((ans: any) => {
        const qObj = questionMap.get(ans.questionId);
        detailResponseRows.push([
          dateStr,
          r.studentName,
          r.studentClass,
          r.quizTitle,
          ans.questionId,
          qObj?.question || '-',
          ans.userAnswer || '(Kosong)',
          qObj?.answer || '-',
          ans.isCorrect ? 'BENAR' : 'SALAH',
          ans.pointsEarned || 0,
          ans.timeSpentSeconds || 0,
          ans.hintsUsedCount || 0
        ]);
      });
    }
  });

  // Batch update all sheets
  const updatePayload = [
    { range: `${SHEET_NAMES.CLASSES}!A1`, values: classRows },
    { range: `${SHEET_NAMES.STUDENTS}!A1`, values: studentRows },
    { range: `${SHEET_NAMES.TEACHERS}!A1`, values: teacherRows },
    { range: `${SHEET_NAMES.QUESTIONS}!A1`, values: questionRows },
    { range: `${SHEET_NAMES.RESULTS}!A1`, values: resultRows },
    { range: `${SHEET_NAMES.RESPONSES}!A1`, values: detailResponseRows }
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updatePayload
      })
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal sinkronisasi data: ${res.statusText}`);
  }

  // Update last sync time in settings
  await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lastSpreadsheetSync: new Date().toISOString()
    })
  }).catch(() => {});

  return {
    success: true,
    message: `Berhasil menyinkronkan ${results.length} hasil asesmen, ${detailResponseRows.length - 1} respon jawaban, ${classes.length} kelas, ${students.length} siswa, dan ${questions.length} bank soal ke Google Spreadsheet!`
  };
}

/**
 * Arah 2: Tarik Data dari Google Spreadsheet ke Aplikasi (Google Sheets -> App)
 * Mengambil perubahan atau baris baru dari Master_Kelas, Master_Siswa, Master_Guru, dan Master_Bank_Soal
 */
export async function importDataFromGoogleSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<{ success: boolean; message: string; stats: any }> {
  const ranges = [
    `${SHEET_NAMES.CLASSES}!A2:E`,
    `${SHEET_NAMES.STUDENTS}!A2:E`,
    `${SHEET_NAMES.TEACHERS}!A2:F`,
    `${SHEET_NAMES.QUESTIONS}!A2:J`
  ];

  const queryParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membaca data dari Google Spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  const valueRanges: { range: string; values?: any[][] }[] = data.valueRanges || [];

  const classRange = valueRanges.find(vr => vr.range.includes(SHEET_NAMES.CLASSES));
  const studentRange = valueRanges.find(vr => vr.range.includes(SHEET_NAMES.STUDENTS));
  const teacherRange = valueRanges.find(vr => vr.range.includes(SHEET_NAMES.TEACHERS));
  const questionRange = valueRanges.find(vr => vr.range.includes(SHEET_NAMES.QUESTIONS));

  let importedClassesCount = 0;
  let importedStudentsCount = 0;
  let importedTeachersCount = 0;
  let importedQuestionsCount = 0;

  // 1. Process Classes
  if (classRange?.values && classRange.values.length > 0) {
    const classItems = classRange.values
      .filter(r => r && r[1])
      .map(r => ({
        id: r[0],
        name: r[1],
        grade: r[2] || 'IX',
        waliKelas: r[3] || '-',
        academicYear: r[4] || '2026/2027'
      }));

    if (classItems.length > 0) {
      const resp = await fetch('/api/classes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: classItems })
      });
      if (resp.ok) {
        const d = await resp.json();
        importedClassesCount = (d.addedCount || 0) + (d.updatedCount || 0);
      }
    }
  }

  // 2. Process Students
  if (studentRange?.values && studentRange.values.length > 0) {
    const studentItems = studentRange.values
      .filter(r => r && r[1])
      .map(r => ({
        nis: r[0],
        name: r[1],
        class: r[2] || 'IX A',
        gender: r[3] || 'L',
        email: r[4] || ''
      }));

    if (studentItems.length > 0) {
      const resp = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: studentItems })
      });
      if (resp.ok) {
        const d = await resp.json();
        importedStudentsCount = (d.addedCount || 0) + (d.updatedCount || 0);
      }
    }
  }

  // 3. Process Teachers
  if (teacherRange?.values && teacherRange.values.length > 0) {
    const teacherItems = teacherRange.values
      .filter(r => r && r[1])
      .map(r => ({
        nip: r[0],
        name: r[1],
        subject: r[2] || 'IPS',
        phone: r[3] || '',
        email: r[4] || '',
        role: r[5] || 'GURU'
      }));

    if (teacherItems.length > 0) {
      const resp = await fetch('/api/teachers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: teacherItems })
      });
      if (resp.ok) {
        const d = await resp.json();
        importedTeachersCount = (d.addedCount || 0) + (d.updatedCount || 0);
      }
    }
  }

  // 4. Process Questions
  if (questionRange?.values && questionRange.values.length > 0) {
    const questionItems = questionRange.values
      .filter(r => r && r[6] && r[7]) // Needs question text and answer
      .map(r => ({
        id: r[0],
        subject: r[1] || 'IPS',
        grade: r[2] || 'IX',
        topic: r[3] || 'Materi Umum',
        difficulty: r[4] || 'Sedang',
        cognitiveLevel: r[5] || 'C3',
        question: r[6],
        answer: r[7],
        explanation: r[8] || '',
        createdBy: r[9] || 'Supro, S.Pd.'
      }));

    if (questionItems.length > 0) {
      const resp = await fetch('/api/questions/import-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: questionItems })
      });
      if (resp.ok) {
        const d = await resp.json();
        importedQuestionsCount = (d.addedCount || 0) + (d.updatedCount || 0);
      }
    }
  }

  const message = `Berhasil menarik data dari Spreadsheet: ${importedClassesCount} kelas, ${importedStudentsCount} siswa, ${importedTeachersCount} guru, dan ${importedQuestionsCount} butir soal telah diperbarui di aplikasi!`;

  // Update last sync time
  await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lastSpreadsheetSync: new Date().toISOString()
    })
  }).catch(() => {});

  return {
    success: true,
    message,
    stats: {
      classes: importedClassesCount,
      students: importedStudentsCount,
      teachers: importedTeachersCount,
      questions: importedQuestionsCount
    }
  };
}

/**
 * Sinkronisasi Dua Arah (Two-Way Sync):
 * 1. Tarik perubahan dari Spreadsheet (Sheets -> App)
 * 2. Kirim seluruh rekaman hasil asesmen dan master terbaru ke Spreadsheet (App -> Sheets)
 */
export async function twoWaySyncWithGoogleSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<{ success: boolean; message: string }> {
  // Step 1: Pull updates from Google Sheets
  const pullResult = await importDataFromGoogleSheets(accessToken, spreadsheetId);

  // Step 2: Push complete state back to Google Sheets
  const pushResult = await syncAllDataToGoogleSheets(accessToken, spreadsheetId);

  return {
    success: true,
    message: `Sinkronisasi Dua Arah Berhasil! Data madrasah diperbarui dari spreadsheet, dan seluruh nilai asesmen terbaru telah disinkronkan kembali ke Google Sheets.`
  };
}

/**
 * Template Google Apps Script siap pakai bagi madrasah yang ingin
 * integrasi 100% bebas error Firebase dan bebas OAuth domain restriction.
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// ===============================================================
// SKRIP GOOGLE APPS SCRIPT UNTUK KUIS CERDAS MATSAMAGA
// MTsN 5 TEGAL - 100% BEBAS FIREBASE & OAUTH DOMAIN RESTRICTION
// ===============================================================
// CARA PEMASANGAN:
// 1. Buat Google Spreadsheet baru di Google Drive Anda (sheets.new)
// 2. Buka menu: Ekstensi > Apps Script
// 3. Hapus semua kode yang ada, tempelkan SELURUH skrip ini
// 4. Klik tombol "Simpan" (ikon disket)
// 5. Klik tombol "Terapkan" (Deploy) di kanan atas > "Deployment baru"
// 6. Pilih jenis: "Aplikasi Web" (Web app)
//    - Jalankan sebagai: "Saya (email Anda)"
//    - Siapa yang memiliki akses: "Siapa saja" (Anyone)
// 7. Klik "Deploy", izinkan akses Google jika diminta
// 8. Salin "URL Aplikasi Web" (akhiran /exec) dan tempelkan ke aplikasi Kuis Cerdas Matsamaga.
// ===============================================================

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var sheetName = data.sheet || 'Hasil_Asesmen_Siswa';
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (data.headers) {
        sheet.appendRow(data.headers);
      }
    }
    
    if (data.rows && Array.isArray(data.rows)) {
      for (var i = 0; i < data.rows.length; i++) {
        sheet.appendRow(data.rows[i]);
      }
    } else if (data.row) {
      sheet.appendRow(data.row);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Data berhasil disimpan' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : 'Hasil_Asesmen_Siswa';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ data: [] })).setMimeType(ContentService.MimeType.JSON);
  }
  var values = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify({ data: values })).setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Kirim data ke Google Apps Script Web App tanpa melalui Firebase Auth / OAuth
 */
export async function syncToAppsScriptWebapp(
  appsScriptUrl: string,
  sheetName: string,
  headers: string[],
  rows: any[][]
): Promise<boolean> {
  try {
    await fetch(appsScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ sheet: sheetName, headers, rows })
    });
    return true;
  } catch (err) {
    console.error('Apps Script Sync Error:', err);
    return false;
  }
}

