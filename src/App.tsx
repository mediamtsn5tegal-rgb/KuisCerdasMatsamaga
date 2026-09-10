import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Quiz } from './types';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';

// Pages
import { LandingPage } from './pages/LandingPage';
import { JoinQuizPage } from './pages/JoinQuizPage';
import { GuruDashboard } from './pages/GuruDashboard';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { AiGeneratorPage } from './pages/AiGeneratorPage';
import { QuizBuilderPage } from './pages/QuizBuilderPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { QuizResultPage } from './pages/QuizResultPage';
import { LoginPage } from './pages/LoginPage';
import { AccessDenied } from './components/AccessDenied';

// Interactive Games
import { CrosswordGame } from './components/games/CrosswordGame';
import { WordSearchGame } from './components/games/WordSearchGame';
import { MultipleChoiceGame } from './components/games/MultipleChoiceGame';
import { PictureGuessGame } from './components/games/PictureGuessGame';
import { SpeedQuizGame } from './components/games/SpeedQuizGame';
import { CompetitionGame } from './components/games/CompetitionGame';

export default function App() {
  const { currentPage, setCurrentPage, activeQuizCode, currentUser } = useApp();

  // Active game session state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [studentName, setStudentName] = useState(currentUser?.name || 'Muhammad Raihan');
  const [studentClass, setStudentClass] = useState(currentUser?.studentClass || 'IX A');
  const [latestResultId, setLatestResultId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Auto-sync student identity if role is SISWA
  React.useEffect(() => {
    if (currentUser?.role === 'SISWA' && currentUser.name) {
      setStudentName(currentUser.name);
      if (currentUser.studentClass) setStudentClass(currentUser.studentClass);
    }
  }, [currentUser]);

  // Auto-fetch active quiz if on play/gameplay page and quiz not loaded
  React.useEffect(() => {
    if ((currentPage === 'play' || currentPage === 'gameplay') && !activeQuiz && activeQuizCode) {
      fetch(`/api/quizzes/${activeQuizCode}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.id) {
            setActiveQuiz(data);
          }
        })
        .catch(() => {});
    }
  }, [currentPage, activeQuiz, activeQuizCode]);

  const handleStartGame = (quiz: Quiz, name: string, cls: string) => {
    setActiveQuiz(quiz);
    setStudentName(name);
    setStudentClass(cls);
    setCurrentPage('play');
  };

  const handleFinishGame = (resultId: string) => {
    setLatestResultId(resultId);
    setCurrentPage('result');
  };

  const handlePlayAgain = () => {
    if (activeQuiz) {
      setCurrentPage('play');
    } else {
      setCurrentPage('join');
    }
  };

  const renderGame = () => {
    if (!activeQuiz) {
      return <JoinQuizPage onStartGame={handleStartGame} />;
    }

    switch (activeQuiz.type) {
      case 'CROSSWORD':
        return (
          <CrosswordGame
            quiz={activeQuiz}
            studentName={studentName}
            studentClass={studentClass}
            onFinish={handleFinishGame}
            onBack={() => setCurrentPage('join')}
          />
        );
      case 'WORD_SEARCH':
        return (
          <WordSearchGame
            quiz={activeQuiz}
            studentName={studentName}
            studentClass={studentClass}
            onFinish={handleFinishGame}
            onBack={() => setCurrentPage('join')}
          />
        );
      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoiceGame
            quiz={activeQuiz}
            studentName={studentName}
            studentClass={studentClass}
            onFinish={handleFinishGame}
            onBack={() => setCurrentPage('join')}
          />
        );
      case 'PICTURE_GUESS':
        return (
          <PictureGuessGame
            quiz={activeQuiz}
            studentName={studentName}
            studentClass={studentClass}
            onFinish={handleFinishGame}
            onBack={() => setCurrentPage('join')}
          />
        );
      case 'SPEED_QUIZ':
        return (
          <SpeedQuizGame
            quiz={activeQuiz}
            studentName={studentName}
            studentClass={studentClass}
            onFinish={handleFinishGame}
            onBack={() => setCurrentPage('join')}
          />
        );
      case 'COMPETITION':
        return (
          <CompetitionGame
            roomCode={activeQuiz.code}
            quiz={activeQuiz}
            studentName={studentName}
            studentClass={studentClass}
            onFinish={handleFinishGame}
            onBack={() => setCurrentPage('join')}
          />
        );
      default:
        return (
          <CrosswordGame
            quiz={activeQuiz}
            studentName={studentName}
            studentClass={studentClass}
            onFinish={handleFinishGame}
            onBack={() => setCurrentPage('join')}
          />
        );
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <LoginPage />;
      case 'join':
        return <JoinQuizPage onStartGame={handleStartGame} />;
      case 'guru_dashboard':
        if (currentUser.role === 'SISWA') {
          return <AccessDenied requiredRole="GURU" pageTitle="Dashboard Dewan Guru" />;
        }
        return <GuruDashboard />;
      case 'question_bank':
        if (currentUser.role === 'SISWA') {
          return <AccessDenied requiredRole="GURU" pageTitle="Bank Soal Terstandar Madrasah" />;
        }
        return <QuestionBankPage />;
      case 'ai_generator':
        if (currentUser.role === 'SISWA') {
          return <AccessDenied requiredRole="GURU" pageTitle="AI Quiz & Soal Generator" />;
        }
        return <AiGeneratorPage />;
      case 'quiz_builder':
        if (currentUser.role === 'SISWA') {
          return <AccessDenied requiredRole="GURU" pageTitle="Pembuat Kuis Interaktif" />;
        }
        return <QuizBuilderPage />;
      case 'student_dashboard':
        return <StudentDashboard />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'admin_dashboard':
        if (currentUser.role === 'SISWA') {
          return <AccessDenied requiredRole="GURU" pageTitle="Panel Kelola Data & Nilai Madrasah" />;
        }
        return <AdminDashboard />;
      case 'google_sheets':
        if (currentUser.role === 'SISWA') {
          return <AccessDenied requiredRole="GURU" pageTitle="Integrasi Google Spreadsheet" />;
        }
        return <AdminDashboard initialTab="SHEETS" />;
      case 'analytics':
        if (currentUser.role === 'SISWA') {
          return <AccessDenied requiredRole="GURU" pageTitle="Analisis Butir Soal & Nilai" />;
        }
        return <AnalyticsPage />;
      case 'play':
      case 'gameplay':
        return renderGame();
      case 'result':
        return <QuizResultPage resultId={latestResultId} onPlayAgain={handlePlayAgain} />;
      default:
        return <LandingPage />;
    }
  };

  // If on login page, render as dedicated standalone initial page without full app sidebar
  if (currentPage === 'login') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-[#1F2937] font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950">
        <main className="flex-1">
          <LoginPage />
        </main>
        <Footer />
        <ToastContainer />
      </div>
    );
  }

  // Authenticated & Internal Pages with Responsive Sidebar Layout
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1F2937] font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area (offset by sidebar width on lg screens) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1">
          {renderCurrentPage()}
        </main>
        <Footer />
      </div>
      <ToastContainer />
    </div>
  );
}
