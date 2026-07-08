import { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Target, Flame, DollarSign, Shield, Upload, Image } from 'lucide-react';
import { useChallengeStore, loadToken } from '../store/challengeStore';
import { FALLBACK_COVER } from '../data/placeholderImages';
import { Button, Input, Textarea, useToast } from '../components/ui';

export function CreateChallengePage() {
  const navigate = useNavigate();
  const isAdminAuthenticated = useChallengeStore((state) => state.isAdminAuthenticated);
  const addChallenge = useChallengeStore((state) => state.addChallenge);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    theme: '',
    goal: '',
    hostName: '',
    coverImage: '',
    startDate: '',
    endDate: '',
    maxPayout: 500,
    minStake: 200,
  });

  const [coverPreview, setCoverPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      const res = await fetch('/api/admin-upload', {
        method: 'POST',
        headers: { 'x-api-token': loadToken() || '' },
        body: formDataUpload,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData({ ...formData, coverImage: data.url });
      setCoverPreview(data.url);
    } catch (err) {
      toast('图片上传失败：' + (err as Error).message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, coverImage: url });
    setCoverPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    const savedFormData = { ...formData };

    setTimeout(async () => {
      try {
        await addChallenge({
          theme: savedFormData.theme,
          goal: savedFormData.goal,
          hostName: savedFormData.hostName,
          coverImage: savedFormData.coverImage || FALLBACK_COVER,
          startDate: savedFormData.startDate,
          endDate: savedFormData.endDate,
          maxPayout: savedFormData.maxPayout,
          minStake: savedFormData.minStake,
        });
        navigate('/');
      } catch (err) {
        console.error('Create challenge failed:', err);
        toast('创建失败，请重试', 'error');
      } finally {
        setSubmitting(false);
      }
    }, 0);
  };

  const isValid =
    formData.theme &&
    formData.goal &&
    formData.hostName &&
    formData.startDate &&
    formData.endDate &&
    formData.maxPayout >= 0 &&
    formData.minStake >= 200;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-8 -ml-3">
          <ArrowLeft className="w-5 h-5" />
          返回
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">创建挑战</h1>
          <p className="text-[var(--faint)]">设定目标，与伙伴们一起坚持到底</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-6 space-y-6">
            <div>
              <label className="flex items-center gap-2 text-[var(--text)] font-medium mb-3">
                <Upload className="w-5 h-5 text-[var(--accent)]" />
                封面图片 (16:9)
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full px-4 py-3 bg-[var(--surface-2)] border-2 border-dashed border-[var(--line-strong)] rounded-xl text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98]"
                >
                  <Image className="w-5 h-5" />
                  {uploading ? '上传中...' : '点击上传本地图片'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Input
                  type="text"
                  placeholder="或输入图片URL地址..."
                  value={formData.coverImage && !formData.coverImage.startsWith('data:') ? formData.coverImage : ''}
                  onChange={handleCoverUrlChange}
                />
              </div>
              {coverPreview && (
                <div className="mt-3 aspect-[16/9] rounded-xl overflow-hidden border border-[var(--line-strong)]">
                  <img
                    src={coverPreview}
                    alt="封面预览"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={() => setCoverPreview('')}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-[var(--text)] font-medium mb-3">
                <Target className="w-5 h-5 text-[var(--accent)]" />
                挑战主题
              </label>
              <Input
                type="text"
                placeholder="例如：30天俯卧撑挑战"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[var(--text)] font-medium mb-3">
                <Target className="w-5 h-5 text-[var(--accent)]" />
                挑战目标
              </label>
              <Textarea
                placeholder="详细描述你要达成的目标..."
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[var(--text)] font-medium mb-3">
                <Shield className="w-5 h-5 text-[var(--accent)]" />
                挑战者姓名
              </label>
              <Input
                type="text"
                placeholder="发起挑战的人名"
                value={formData.hostName}
                onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-[var(--text)] font-medium mb-3">
                  <Calendar className="w-5 h-5 text-[var(--accent)]" />
                  开始日期
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[var(--text)] font-medium mb-3">
                  <Calendar className="w-5 h-5 text-[var(--accent)]" />
                  结束日期
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-[var(--text)] font-medium mb-3">
                  <DollarSign className="w-5 h-5 text-[var(--accent)]" />
                  最高赔付
                  <span className="text-xs text-[var(--faint)] font-normal">（失败后赔付上限）</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.maxPayout}
                  onChange={(e) => setFormData({ ...formData, maxPayout: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[var(--text)] font-medium mb-3">
                  <Flame className="w-5 h-5 text-[var(--accent)]" />
                  最低赔付
                  <span className="text-xs text-[var(--faint)] font-normal">（最少200）</span>
                </label>
                <Input
                  type="number"
                  min="200"
                  step="50"
                  value={formData.minStake}
                  onChange={(e) => setFormData({ ...formData, minStake: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={!isValid}>
            发布挑战
          </Button>
        </form>
      </div>
    </div>
  );
}
