import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Target, Flame, DollarSign, Shield, Upload, Image } from 'lucide-react';
import { useChallengeStore } from '../store/challengeStore';

export function CreateChallengePage() {
  const navigate = useNavigate();
  const isAdminAuthenticated = useChallengeStore((state) => state.isAdminAuthenticated);
  const addChallenge = useChallengeStore((state) => state.addChallenge);

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
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="max-w-lg mx-auto px-6 pt-24 pb-16">
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-neutral-900 rounded-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">需要管理员权限</h3>
            <p className="text-neutral-500 mb-6">请先登录管理员账号才能创建挑战</p>
            <button
              onClick={() => navigate('/admin-login')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
            >
              <Shield className="w-4 h-4" />
              管理员登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData({ ...formData, coverImage: data.url });
      setCoverPreview(data.url);
    } catch (err) {
      alert('图片上传失败：' + (err as Error).message);
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
          coverImage: savedFormData.coverImage || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Fitness%20challenge%20poster%2C%20modern%20gym%20background%2C%20energetic%20orange%20lighting%2C%20motivational%20atmosphere&image_size=landscape_16_9',
          startDate: savedFormData.startDate,
          endDate: savedFormData.endDate,
          maxPayout: savedFormData.maxPayout,
          minStake: savedFormData.minStake,
        });
        navigate('/');
      } catch (err) {
        console.error('Create challenge failed:', err);
        alert('创建失败，请重试');
      } finally {
        setSubmitting(false);
      }
    }, 0);
  };

  const isValid = formData.theme && formData.goal && formData.hostName && formData.startDate && formData.endDate && formData.maxPayout >= 0 && formData.minStake >= 200;

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">创建挑战</h1>
          <p className="text-neutral-500">设定目标，与伙伴们一起坚持到底</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-6">
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-3">
                <Upload className="w-5 h-5 text-orange-500" />
                封面图片 (16:9)
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full px-4 py-3 bg-neutral-800 border-2 border-dashed border-neutral-700 rounded-xl text-neutral-400 hover:border-orange-500 hover:text-orange-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                <input
                  type="text"
                  placeholder="或输入图片URL地址..."
                  value={formData.coverImage && !formData.coverImage.startsWith('data:') ? formData.coverImage : ''}
                  onChange={handleCoverUrlChange}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              {coverPreview && (
                <div className="mt-3 aspect-video rounded-xl overflow-hidden border border-neutral-700">
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
              <label className="flex items-center gap-2 text-white font-medium mb-3">
                <Target className="w-5 h-5 text-orange-500" />
                挑战主题
              </label>
              <input
                type="text"
                placeholder="例如：30天俯卧撑挑战"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-3">
                <Target className="w-5 h-5 text-orange-500" />
                挑战目标
              </label>
              <textarea
                placeholder="详细描述你要达成的目标..."
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-3">
                <Shield className="w-5 h-5 text-orange-500" />
                挑战者姓名
              </label>
              <input
                type="text"
                placeholder="发起挑战的人名"
                value={formData.hostName}
                onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-3">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  开始日期
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-3">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  结束日期
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-3">
                  <DollarSign className="w-5 h-5 text-orange-500" />
                  最高赔付
                  <span className="text-xs text-neutral-500 font-normal">（失败后赔付上限）</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.maxPayout}
                  onChange={(e) => setFormData({ ...formData, maxPayout: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-3">
                  <Flame className="w-5 h-5 text-orange-500" />
                  最低赔付
                  <span className="text-xs text-neutral-500 font-normal">（最少200）</span>
                </label>
                <input
                  type="number"
                  min="200"
                  step="50"
                  value={formData.minStake}
                  onChange={(e) => setFormData({ ...formData, minStake: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              isValid
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-0.5'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            发布挑战
          </button>
        </form>
      </div>
    </div>
  );
}