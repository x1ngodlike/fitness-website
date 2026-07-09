import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Activity, Users, Database } from 'lucide-react';
import { useChallengeStore } from '../store/challengeStore';
import { Input, Button } from '../components/ui';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const authenticateAdmin = useChallengeStore((state) => state.authenticateAdmin);
  const isAdminAuthenticated = useChallengeStore((state) => state.isAdminAuthenticated);

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAdminAuthenticated) {
    navigate('/admin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await authenticateAdmin(password);
    if (ok) {
      navigate('/admin');
    } else {
      setError('密码错误，请重试');
      setPassword('');
    }
  };

  const highlights = [
    { icon: Activity, label: '实时掌控挑战进度' },
    { icon: Users, label: '参与者与资金一目了然' },
    { icon: Database, label: '一键备份与恢复' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex">
      {/* 左侧品牌叙事面板（桌面） */}
      <aside className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-[var(--surface)] border-r border-[var(--line)]">
        <div
          className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
        />
        <div className="relative flex items-center gap-3">
          <img src="/logo.png" alt="壹拳俱乐部" className="h-11 w-11 rounded-xl object-contain" />
          <span className="font-display text-lg font-bold tracking-tight">壹拳俱乐部 · 控制台</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight">
            管理你的<br />健身挑战生态
          </h1>
          <p className="text-[var(--muted)] mt-4 text-[15px] leading-relaxed">
            在这里统筹每一个挑战的进度、参与者与资金流向，数据备份与恢复尽在指尖。
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-[var(--muted)]">
                <span className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[var(--accent)]" />
                </span>
                <span className="text-sm">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-[var(--faint)]">
          © 壹拳俱乐部 · 仅限授权管理员访问
        </div>
      </aside>

      {/* 右侧登录表单 */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* 移动端品牌 */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="壹拳俱乐部" className="h-11 w-11 rounded-xl object-contain" />
            <span className="font-display text-lg font-bold tracking-tight">壹拳俱乐部 · 控制台</span>
          </div>

          <div className="lg:text-center mb-8">
            <h2 className="font-display text-2xl font-bold">管理员登录</h2>
            <p className="text-[var(--muted)] text-sm mt-2">输入管理员密码以访问管理功能</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 space-y-4"
          >
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--muted)] mb-2.5">
                <Lock className="w-4 h-4 text-[var(--accent)]" />
                管理员密码
              </label>
              <Input
                type="password"
                value={password}
                autoFocus
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码..."
              />
            </div>

            {error && (
              <div className="p-3 bg-[var(--bad-soft)] border border-[var(--bad-line)] rounded-xl text-[var(--bad)] text-sm">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={!password}>
              登录
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="w-full mt-4">
            返回首页
          </Button>
        </div>
      </main>
    </div>
  );
}
