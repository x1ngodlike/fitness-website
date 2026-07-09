import { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Target, Flame, DollarSign, Shield, Image } from 'lucide-react';
import { useChallengeStore, loadToken } from '../store/challengeStore';
import { FALLBACK_COVER } from '../data/placeholderImages';
import { Button, Input, Textarea, useToast } from '../components/ui';

interface ChallengeDraft {
  theme: string;
  goal: string;
  hostName: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  maxPayout: number;
  minStake: number;
}

function MoneyField({
  icon,
  label,
  hint,
  presets,
  value,
  onChange,
  onBlur,
  error,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  presets: number[];
  value: number;
  onChange: (v: number) => void;
  onBlur: () => void;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 font-medium text-[var(--text)]">
        {icon}
        {label}
        {hint && <span className="text-xs font-normal text-[var(--faint)]">（{hint}）</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant={value === p ? 'primary' : 'secondary'}
            onClick={() => onChange(p)}
          >
            ¥{p}
          </Button>
        ))}
        <Input
          type="number"
          min="0"
          placeholder="自定义"
          value={Number.isNaN(value) ? '' : value}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={onBlur}
          className="min-w-0 flex-1"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-[var(--bad)]">{error}</p>}
    </div>
  );
}

function PreviewCard({ draft }: { draft: ChallengeDraft }) {
  const cover = draft.coverImage || FALLBACK_COVER;
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={cover}
          alt="预览封面"
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_COVER;
            e.currentTarget.onerror = null;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
          预览
        </div>
      </div>
      <div className="p-5">
        <h3 className="mb-1.5 line-clamp-2 text-lg font-bold leading-snug text-[var(--text)]">
          {draft.theme || '挑战主题预览'}
        </h3>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold text-[var(--accent)]">@{draft.hostName || '挑战者'}</span>
          <span className="text-[var(--faint)]">发起</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Calendar className="h-3.5 w-3.5 text-[var(--faint)]" />
          <span>
            {draft.startDate || '开始日期'} ~ {draft.endDate || '结束日期'}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <div className="text-xs text-[var(--muted)]">最高赔付</div>
            <div className="mt-0.5 text-base font-bold text-[var(--text)]">¥{draft.maxPayout}</div>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <div className="text-xs text-[var(--muted)]">最低赔付</div>
            <div className="mt-0.5 text-base font-bold text-[var(--text)]">¥{draft.minStake}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreateChallengePage() {
  const navigate = useNavigate();
  const isAdminAuthenticated = useChallengeStore((state) => state.isAdminAuthenticated);
  const addChallenge = useChallengeStore((state) => state.addChallenge);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ChallengeDraft>({
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
  const [dragging, setDragging] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  const markTouched = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/admin-upload', {
        method: 'POST',
        headers: { 'x-api-token': loadToken() || '' },
        body: fd,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleCoverUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, coverImage: url });
    setCoverPreview(url);
    markTouched('coverImage');
  };

  const errors = {
    theme: formData.theme.trim() ? '' : '请输入挑战主题',
    goal: formData.goal.trim() ? '' : '请输入挑战目标',
    hostName: formData.hostName.trim() ? '' : '请输入挑战者姓名',
    startDate: formData.startDate ? '' : '请选择开始日期',
    endDate: !formData.endDate
      ? '请选择结束日期'
      : formData.startDate && formData.endDate < formData.startDate
        ? '结束日期不能早于开始日期'
        : '',
    maxPayout: formData.maxPayout < 0 ? '最高赔付不能为负数' : '',
    minStake: formData.minStake < 200 ? '最低赔付不能低于 200' : '',
  };
  const isValid = Object.values(errors).every((e) => !e);
  const showErr = (field: keyof typeof errors) => (touched[field] || attempted) && errors[field];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!isValid) {
      toast('请检查表单中的错误项', 'error');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await addChallenge({
        theme: formData.theme,
        goal: formData.goal,
        hostName: formData.hostName,
        coverImage: formData.coverImage || FALLBACK_COVER,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxPayout: formData.maxPayout,
        minStake: formData.minStake,
      });
      navigate('/');
    } catch (err) {
      console.error('Create challenge failed:', err);
      toast('创建失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-20 sm:px-6 sm:pt-24">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-8 -ml-3">
          <ArrowLeft className="h-5 w-5" />
          返回
        </Button>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-[var(--text)]">创建挑战</h1>
          <p className="text-[var(--faint)]">设定目标，与伙伴们一起坚持到底</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* 左侧：分组表单 */}
          <form onSubmit={handleSubmit} noValidate className="order-2 space-y-6 lg:order-1">
            {/* 基本信息 */}
            <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold text-[var(--text)]">
                <Target className="h-4 w-4 text-[var(--accent)]" />
                基本信息
              </h2>

              <div>
                <label className="mb-2 flex items-center gap-2 font-medium text-[var(--text)]">
                  <Image className="h-4 w-4 text-[var(--accent)]" />
                  封面图片 (16:9)
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) uploadFile(file);
                    }}
                    disabled={uploading}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-[var(--muted)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                      dragging
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-[var(--line-strong)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                    }`}
                  >
                    <Image className="h-5 w-5" />
                    {uploading ? '上传中...' : dragging ? '松开上传图片' : '点击上传或拖拽图片'}
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
                    value={
                      formData.coverImage && !formData.coverImage.startsWith('data:')
                        ? formData.coverImage
                        : ''
                    }
                    onChange={handleCoverUrlChange}
                  />
                </div>
                {coverPreview && (
                  <div className="mt-3 aspect-[16/9] overflow-hidden rounded-xl border border-[var(--line-strong)]">
                    <img
                      src={coverPreview}
                      alt="封面预览"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={() => setCoverPreview('')}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 font-medium text-[var(--text)]">
                  <Target className="h-4 w-4 text-[var(--accent)]" />
                  挑战主题
                </label>
                <Input
                  type="text"
                  placeholder="例如：30天俯卧撑挑战"
                  value={formData.theme}
                  onChange={(e) => {
                    setFormData({ ...formData, theme: e.target.value });
                    markTouched('theme');
                  }}
                />
                {showErr('theme') && <p className="mt-1.5 text-xs text-[var(--bad)]">{errors.theme}</p>}
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 font-medium text-[var(--text)]">
                  <Target className="h-4 w-4 text-[var(--accent)]" />
                  挑战目标
                </label>
                <Textarea
                  placeholder="详细描述你要达成的目标..."
                  value={formData.goal}
                  onChange={(e) => {
                    setFormData({ ...formData, goal: e.target.value });
                    markTouched('goal');
                  }}
                  rows={4}
                />
                {showErr('goal') && <p className="mt-1.5 text-xs text-[var(--bad)]">{errors.goal}</p>}
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 font-medium text-[var(--text)]">
                  <Shield className="h-4 w-4 text-[var(--accent)]" />
                  挑战者姓名
                </label>
                <Input
                  type="text"
                  placeholder="发起挑战的人名"
                  value={formData.hostName}
                  onChange={(e) => {
                    setFormData({ ...formData, hostName: e.target.value });
                    markTouched('hostName');
                  }}
                />
                {showErr('hostName') && (
                  <p className="mt-1.5 text-xs text-[var(--bad)]">{errors.hostName}</p>
                )}
              </div>
            </section>

            {/* 时间 */}
            <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold text-[var(--text)]">
                <Calendar className="h-4 w-4 text-[var(--accent)]" />
                时间
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-medium text-[var(--text)]">开始日期</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => {
                      setFormData({ ...formData, startDate: e.target.value });
                      markTouched('startDate');
                    }}
                  />
                  {showErr('startDate') && (
                    <p className="mt-1.5 text-xs text-[var(--bad)]">{errors.startDate}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block font-medium text-[var(--text)]">结束日期</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => {
                      setFormData({ ...formData, endDate: e.target.value });
                      markTouched('endDate');
                    }}
                  />
                  {showErr('endDate') && (
                    <p className="mt-1.5 text-xs text-[var(--bad)]">{errors.endDate}</p>
                  )}
                </div>
              </div>
            </section>

            {/* 押注规则 */}
            <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold text-[var(--text)]">
                <Flame className="h-4 w-4 text-[var(--accent)]" />
                押注规则
              </h2>
              <MoneyField
                icon={<DollarSign className="h-4 w-4 text-[var(--accent)]" />}
                label="最高赔付"
                hint="失败后赔付上限"
                presets={[500, 1000, 2000, 5000]}
                value={formData.maxPayout}
                onChange={(v) => {
                  setFormData({ ...formData, maxPayout: v });
                  markTouched('maxPayout');
                }}
                onBlur={() => markTouched('maxPayout')}
                error={showErr('maxPayout') ? errors.maxPayout : ''}
              />
              <MoneyField
                icon={<Flame className="h-4 w-4 text-[var(--accent)]" />}
                label="最低赔付"
                hint="最低参与金额，≥200"
                presets={[200, 500, 1000]}
                value={formData.minStake}
                onChange={(v) => {
                  setFormData({ ...formData, minStake: v });
                  markTouched('minStake');
                }}
                onBlur={() => markTouched('minStake')}
                error={showErr('minStake') ? errors.minStake : ''}
              />
            </section>

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
              {submitting ? '发布中...' : '发布挑战'}
            </Button>
          </form>

          {/* 右侧：实时预览 */}
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <p className="mb-3 text-sm font-medium text-[var(--muted)]">实时预览</p>
              <PreviewCard draft={formData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
