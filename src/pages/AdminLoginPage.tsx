import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { useChallengeStore } from '../store/challengeStore';

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

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">管理员登录</h1>
          <p className="text-neutral-500">输入管理员密码以访问管理功能</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <div className="mb-4">
            <label className="flex items-center gap-2 text-white font-medium mb-3">
              <Lock className="w-5 h-5 text-orange-500" />
              管理员密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码..."
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!password}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              password
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/20'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
}