import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { ChallengeDetailPage } from './pages/ChallengeDetailPage';
import { CreateChallengePage } from './pages/CreateChallengePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { FeedbackProvider } from './components/ui';
import { useChallengeStore } from './store/challengeStore';

export default function App() {
  const init = useChallengeStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <FeedbackProvider>
        <AppShell />
      </FeedbackProvider>
    </Router>
  );
}

function AppShell() {
  const location = useLocation();
  // 管理员相关路由使用独立的面板布局，隐藏公共 Header（避免遮挡登录页、与管理面板导航重复）
  const hideHeader = ['/admin', '/admin-login'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/challenge/:id" element={<ChallengeDetailPage />} />
        <Route path="/create" element={<CreateChallengePage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
      </Routes>
    </div>
  );
}
