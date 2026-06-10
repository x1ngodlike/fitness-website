import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { ChallengeDetailPage } from './pages/ChallengeDetailPage';
import { CreateChallengePage } from './pages/CreateChallengePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { useChallengeStore } from './store/challengeStore';

export default function App() {
  const init = useChallengeStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <div className="min-h-screen bg-neutral-950">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/challenge/:id" element={<ChallengeDetailPage />} />
          <Route path="/create" element={<CreateChallengePage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminPanelPage />} />
        </Routes>
      </div>
    </Router>
  );
}
