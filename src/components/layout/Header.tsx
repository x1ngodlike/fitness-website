import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Shield, LogOut, Menu, X, Sun, Moon, Monitor } from 'lucide-react';
import { useChallengeStore } from '../../store/challengeStore';
import { buttonClassName, IconButton } from '../ui';
import { useTheme } from '../../hooks/useTheme';

const THEME_LABELS: Record<string, string> = {
  dark: '深色模式',
  light: '浅色模式',
  system: '跟随系统',
};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isAdminAuthenticated = useChallengeStore((state) => state.isAdminAuthenticated);
  const logoutAdmin = useChallengeStore((state) => state.logoutAdmin);
  const { theme, cycle } = useTheme();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const adminHref = isAdminAuthenticated ? '/admin' : '/admin-login';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-90)] backdrop-blur-xl border-b border-[var(--line)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="壹拳俱乐部" className="h-9 w-9 rounded-xl object-contain group-hover:scale-105 transition-transform" />
          <span className="font-display text-lg font-bold tracking-tight text-[var(--text)]">
            壹拳俱乐部
          </span>
        </Link>

        {/* 桌面端 */}
        <div className="hidden lg:flex items-center gap-2">
          <IconButton label={THEME_LABELS[theme]} size="sm" onClick={cycle}>
            {theme === 'dark' && <Moon className="w-5 h-5" />}
            {theme === 'light' && <Sun className="w-5 h-5" />}
            {theme === 'system' && <Monitor className="w-5 h-5" />}
          </IconButton>
          <Link to={adminHref} className={buttonClassName({ variant: 'ghost' })}>
            <Shield className="w-4 h-4" />
            管理后台
          </Link>
          <Link to="/create" className={buttonClassName({ variant: 'primary' })}>
            <Plus className="w-4 h-4" />
            创建挑战
          </Link>
        </div>

        {/* 移动端 */}
        <div className="flex items-center gap-1 lg:hidden">
          <IconButton label={THEME_LABELS[theme]} size="sm" onClick={cycle}>
            {theme === 'dark' && <Moon className="w-5 h-5" />}
            {theme === 'light' && <Sun className="w-5 h-5" />}
            {theme === 'system' && <Monitor className="w-5 h-5" />}
          </IconButton>
          <IconButton
            label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </IconButton>
        </div>
      </div>

        {mobileMenuOpen && (
        <div className="lg:hidden bg-[var(--surface)] border-t border-[var(--line)]">
          <div className="px-4 py-4 flex flex-col gap-2">
            <Link
              to="/create"
              onClick={() => setMobileMenuOpen(false)}
              className={buttonClassName({ variant: 'primary', fullWidth: true })}
            >
              <Plus className="w-5 h-5" />
              创建挑战
            </Link>
            <Link
              to={adminHref}
              onClick={() => setMobileMenuOpen(false)}
              className={buttonClassName({ variant: 'secondary', fullWidth: true })}
            >
              <Shield className="w-5 h-5" />
              管理后台
            </Link>
            {isAdminAuthenticated && (
              <button onClick={handleLogout} className={buttonClassName({ variant: 'danger', fullWidth: true })}>
                <LogOut className="w-5 h-5" />
                退出登录
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
