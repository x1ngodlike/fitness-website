import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Shield, LogOut, FlaskConical, Rocket } from 'lucide-react';
import { useChallengeStore } from '../../store/challengeStore';

export function Header() {
  const navigate = useNavigate();
  const isAdminAuthenticated = useChallengeStore((state) => state.isAdminAuthenticated);
  const envMode = useChallengeStore((state) => state.envMode);
  const logoutAdmin = useChallengeStore((state) => state.logoutAdmin);
  const setEnvMode = useChallengeStore((state) => state.setEnvMode);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">健康</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">星球</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {isAdminAuthenticated ? (
            <>
              {/* 环境切换按钮 */}
              <div className="flex items-center gap-2 px-1 py-1 bg-neutral-800 rounded-lg">
                <button
                  onClick={() => setEnvMode('test')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    envMode === 'test'
                      ? 'bg-green-500/20 text-green-400'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  <FlaskConical className="w-4 h-4" />
                  测试
                </button>
                <button
                  onClick={() => setEnvMode('production')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    envMode === 'production'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  正式
                </button>
              </div>

              <Link
                to="/create"
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" />
                创建挑战
              </Link>
              <Link
                to="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-all"
              >
                <Shield className="w-4 h-4" />
                管理面板
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-all border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </>
          ) : (
            <Link
              to="/admin-login"
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-all"
            >
              <Shield className="w-4 h-4" />
              管理员登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
