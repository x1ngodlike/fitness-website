import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Shield, LogOut, FlaskConical, Rocket, Menu, X } from 'lucide-react';
import { useChallengeStore } from '../../store/challengeStore';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isAdminAuthenticated = useChallengeStore((state) => state.isAdminAuthenticated);
  const envMode = useChallengeStore((state) => state.envMode);
  const logoutAdmin = useChallengeStore((state) => state.logoutAdmin);
  const setEnvMode = useChallengeStore((state) => state.setEnvMode);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            <span className="text-white">健康</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">星球</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4">
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-neutral-900 border-t border-neutral-800">
          <div className="px-4 py-4 space-y-3">
            {isAdminAuthenticated ? (
              <>
                {/* 环境切换 */}
                <div className="flex items-center gap-2 px-1 py-1 bg-neutral-800 rounded-lg">
                  <button
                    onClick={() => setEnvMode('test')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
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
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
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
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all"
                >
                  <Plus className="w-5 h-5" />
                  创建挑战
                </Link>

                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-all"
                >
                  <Shield className="w-5 h-5" />
                  管理面板
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-all border border-red-500/20"
                >
                  <LogOut className="w-5 h-5" />
                  退出登录
                </button>
              </>
            ) : (
              <Link
                to="/admin-login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-all"
              >
                <Shield className="w-5 h-5" />
                管理员登录
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
