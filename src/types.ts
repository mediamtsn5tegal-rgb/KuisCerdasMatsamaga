export type UserRole = 'ADMIN' | 'GURU' | 'SISWA';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  classId?: string;
  studentClass?: string;
  nis?: string;
  nip?: string;
  subject?: string;
  phone?: string;
  gender?: 'L' | 'P';
  isDeveloper?: boolean;
  avatar?: string;
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: 'VII' | 'VIII' | 'IX';
  waliKelas?: string;
  academicYear?: string;
}

export type CognitiveLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export const COGNITIVE_LEVEL_LABELS: Record<CognitiveLevel, string> = {
  C1: 'C1 – Mengingat',
  C2: 'C2 – Memahami',
  C3: 'C3 – Menerapkan',
  C4: 'C4 – Menganalisis',
  C5: 'C5 – Mengevaluasi',
  C6: 'C6 – Mencipta'
};

export type KbcValue = 
  | 'Cinta Allah SWT dan Rasulullah'
  | 'Cinta Ilmu'
  | 'Cinta Diri dan Sesama'
  | 'Cinta Tanah Air'
  | 'Cinta Lingkungan';

export type ProfilLulusan = 
  | 'Keimanan dan ketakwaan kepada Tuhan YME'
  | 'Kewargaan'
  | 'Penalaran kritis'
  | 'Kreativitas'
  | 'Kolaborasi'
  | 'Kemandirian'
  | 'Kesehatan'
  | 'Komunikasi';

export type GameType = 
  | 'CROSSWORD' 
  | 'WORD_SEARCH' 
  | 'MULTIPLE_CHOICE' 
  | 'PICTURE_GUESS' 
  | 'SPEED_QUIZ' 
  | 'COMPETITION';

export type QuizType = GameType;

export const GAME_TYPE_LABELS: Record<GameType, { label: string; icon: string; description: string }> = {
  CROSSWORD: {
    label: 'Teka-Teki Silang (TTS)',
    icon: 'Grid',
    description: 'Menjawab teka-teki kata dengan persilangan huruf otomatis mendatar dan menurun.'
  },
  WORD_SEARCH: {
    label: 'Word Search (Cari Kata)',
    icon: 'Search',
    description: 'Menemukan istilah penting tersembunyi secara horizontal, vertikal, maupun diagonal.'
  },
  MULTIPLE_CHOICE: {
    label: 'Pilihan Ganda',
    icon: 'CheckSquare',
    description: 'Kuis evaluasi formatif/sumatif interaktif dengan 4 opsi pilihan jawaban.'
  },
  PICTURE_GUESS: {
    label: 'Tebak Gambar',
    icon: 'Image',
    description: 'Menjawab pertanyaan visual berbasis pengamatan gambar dengan fitur zoom dan clue.'
  },
  SPEED_QUIZ: {
    label: 'Kuis Cepat (Rapid Fire)',
    icon: 'Zap',
    description: 'Tantangan adu kecepatan dan ketepatan dengan hitung mundur 10 detik per soal.'
  },
  COMPETITION: {
    label: 'Mode Kompetisi Live',
    icon: 'Trophy',
    description: 'Mengerjakan kuis bersamaan satu kelas dengan room code dan live leaderboard.'
  }
};

export interface Question {
  id: string;
  question: string;
  answer: string;
  options?: string[]; // for multiple choice
  explanation?: string;
  hint?: string;
  imageUrl?: string;
  subject: string;
  grade: 'VII' | 'VIII' | 'IX';
  phase?: 'D';
  topic: string;
  subtopic?: string;
  learningObjective?: string;
  indicator?: string;
  cognitiveLevel: CognitiveLevel;
  difficulty: 'Mudah' | 'Sedang' | 'Sulit';
  profilLulusan?: ProfilLulusan[];
  kbcValue?: KbcValue[];
  tags?: string[];
  createdBy: string;
  createdAt: string;
  status?: 'DRAFT' | 'APPROVED';
}

export interface QuizSettings {
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  durationMinutes: number; // 0 = no timer
  allowHints: boolean;
  immediateFeedback: boolean;
  showLeaderboard?: boolean;
  showExplanation?: 'IMMEDIATE' | 'AFTER_CLOSE' | 'NEVER';
  allowRetry?: boolean;
  kktp?: number; // Kriteria Ketuntasan Tujuan Pembelajaran, default 75
  passingScore?: number;
  showScoreAtEnd?: boolean;
  privacyNameFormat?: 'FULL_NAME' | 'NICKNAME' | 'INITIALS';
  allowGuest?: boolean;
  scoreCorrect?: number;
  scoreWrong?: number;
  hintPenalty?: number;
  speedBonusMax?: number;
  perfectBonus?: number;
}

export interface Quiz {
  id: string;
  code: string; // e.g. KCM-9A7X2
  title: string;
  description: string;
  subject: string;
  grade: 'VII' | 'VIII' | 'IX';
  topic: string;
  type: GameType;
  questions: Question[];
  settings: QuizSettings;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  targetClasses?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// Crossword specific types
export interface CrosswordPlacement {
  id: string;
  number: number;
  direction: 'ACROSS' | 'DOWN' | 'across' | 'down';
  word: string;
  clue: string;
  hint?: string;
  explanation?: string;
  row: number;
  col: number;
  length: number;
}

export type CrosswordWordPlacement = CrosswordPlacement;

export interface CrosswordCell {
  row: number;
  col: number;
  letter: string;
  number?: number;
  isBlack: boolean;
  isBlocked?: boolean;
  acrossIndex?: number;
  downIndex?: number;
}

export type CrosswordGridCell = CrosswordCell;

export interface CrosswordGrid {
  rows: number;
  cols: number;
  grid: CrosswordCell[][];
  placements: CrosswordPlacement[];
  placedWords: CrosswordPlacement[];
  failedWords: string[];
}

// Word Search specific types
export interface WordSearchPlacement {
  word: string;
  clue?: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  direction: string;
}

export interface WordSearchGrid {
  rows: number;
  cols: number;
  grid: string[][];
  words: { word: string; clue?: string }[];
  placements: WordSearchPlacement[];
}

// Result & Submission
export interface QuestionAnswerRecord {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  timeSpentSeconds: number;
  hintsUsedCount: number;
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  quizType: GameType;
  studentName: string;
  studentClass: string;
  userId?: string;
  score: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  completedAt: string;
  answers: QuestionAnswerRecord[];
  badgesUnlocked?: string[];
  predicate: string; // e.g. 'Istimewa (A)', 'Sangat Baik (B)', dll
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
}

export interface CompetitionRoom {
  id: string;
  code: string;
  quizId: string;
  quizTitle: string;
  hostTeacherId: string;
  hostTeacherName: string;
  status: 'WAITING' | 'STARTED' | 'FINISHED';
  participants: {
    id: string;
    name: string;
    studentClass: string;
    score: number;
    currentQuestionIndex: number;
    completed: boolean;
    lastActiveAt: string;
  }[];
  startedAt?: string;
}

export interface ItemAnalysis {
  questionId: string;
  question: string;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  correctPercentage: number;
  difficultyCategory: 'Mudah' | 'Sedang' | 'Sulit';
  averageTimeSeconds: number;
  discriminationIndex?: number;
}

export interface SystemSettings {
  madrasahName: string;
  appName: string;
  tagline: string;
  vision: string;
  developerName?: string;
  developerRole?: string;
  developerBio?: string;
  logoUrl?: string;
  defaultDuration: number;
  defaultKktp: number;
  academicYear: string;
  googleSpreadsheetId?: string;
  googleSpreadsheetUrl?: string;
  lastSpreadsheetSync?: string;
  autoSyncSheets?: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  role: string;
  details: string;
  timestamp: string;
}

export interface RoleFeatureAccess {
  feature: string;
  category: 'Asesmen & Game' | 'Bank Soal & AI' | 'Manajemen Data Madrasah' | 'Laporan & Nilai' | 'Pengaturan Sistem';
  admin: boolean;
  guru: boolean;
  siswa: boolean;
  notes?: string;
}

export interface RolePermissionInfo {
  role: UserRole;
  title: string;
  badgeLabel: string;
  badgeClass: string;
  portalDescription: string;
  targetDashboard: string;
  allowedSummary: string[];
  restrictedSummary: string[];
}

