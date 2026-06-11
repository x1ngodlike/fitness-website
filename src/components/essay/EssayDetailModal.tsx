import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Image, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { Essay, Challenge } from '../../types';
import { useChallengeStore } from '../../store/challengeStore';
import { formatTime } from '../../utils/format';
import { ImagePreviewModal } from '../common/ImagePreviewModal';

interface EssayDetailModalProps {
  challenge: Challenge;
  onClose: () => void;
}

export function EssayDetailModal({ challenge, onClose }: EssayDetailModalProps) {
  const { essays, addEssay, deleteEssay, isAdminAuthenticated } = useChallengeStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const challengeEssays = useMemo(() => {
    return essays
      .filter(e => e.challengeId === challenge.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [essays, challenge.id]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h3 className="text-xl font-bold text-white">
            {challenge.hostName} 的小作文
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {challengeEssays.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-neutral-500">还没有小作文，快来发布第一条吧！</p>
            </div>
          ) : (
            challengeEssays.map((essay) => (
              <div
                key={essay.id}
                className="bg-neutral-800/50 rounded-xl p-4 relative"
              >
                {isAdminAuthenticated && (
                  <button
                    onClick={() => {
                      if (confirm('确定要删除这条小作文吗？')) {
                        deleteEssay(essay.id);
                      }
                    }}
                    className="absolute top-3 right-3 p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}

                {essay.imageUrl && (
                  <div
                    className="mb-3 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewImage(essay.imageUrl!)}
                  >
                    <img
                      src={essay.imageUrl}
                      alt="小作文配图"
                      className="w-full object-contain bg-neutral-950 max-h-64"
                      loading="lazy"
                    />
                  </div>
                )}

                <p className="text-white text-sm mb-3 leading-relaxed">
                  {essay.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        essay.sentiment === 'bullish'
                          ? 'bg-red-500/10 text-red-400'  // 利多 - 红色
                          : 'bg-green-500/10 text-green-400'  // 利空 - 绿色
                      }`}
                    >
                      {essay.sentiment === 'bullish' ? (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> 利多
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3" /> 利空
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <Clock className="w-3 h-3" />
                    {formatTime(essay.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <AddEssayModal
          challengeId={challenge.id}
          hostName={challenge.hostName}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}

      {previewImage && (
        <ImagePreviewModal
          src={previewImage}
          alt="图片预览"
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}

interface AddEssayModalProps {
  challengeId: string;
  hostName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddEssayModal({ challengeId, hostName, onClose, onSuccess }: AddEssayModalProps) {
  const { addEssay } = useChallengeStore();
  const [content, setContent] = useState('');
  const [sentiment, setSentiment] = useState<'bullish' | 'bearish'>('bullish');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.url) {
        setImageUrl(result.url);
        setImagePreview(URL.createObjectURL(file));
      }
    } catch (error) {
      console.error('图片上传失败:', error);
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setImagePreview(event.target?.result as string);
          };
          reader.readAsDataURL(file);

          setUploading(true);
          const formData = new FormData();
          formData.append('image', file);

          fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
            .then((response) => response.json())
            .then((result) => {
              if (result.url) {
                setImageUrl(result.url);
              }
            })
            .catch((error) => console.error('图片上传失败:', error))
            .finally(() => setUploading(false));
        }
        break;
      }
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('请输入小作文');
      return;
    }

    await addEssay({
      challengeId,
      content: content.trim(),
      imageUrl: imageUrl || undefined,
      sentiment,
    });

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-white mb-4">发布小作文</h3>

        {/* 配文输入 */}
        <div className="mb-4">
          <label className="block text-white font-medium mb-2">请输入小作文</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder={`为 ${hostName} 的挑战发表你的看法...`}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 resize-none"
            rows={5}
          />
          <p className="text-xs text-neutral-500 mt-1">支持直接粘贴图片（Ctrl+V / Cmd+V）</p>
        </div>

        {/* 图片上传 */}
        <div className="mb-4">
          <label className="block text-white font-medium mb-2">
            <Image className="w-4 h-4 inline mr-2 text-orange-500" />
            图片（可选）
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-400 text-sm"
          />

          {imagePreview && (
            <div className="mt-3 rounded-lg overflow-hidden relative">
              <img
                src={imagePreview}
                alt="预览"
                className="w-full h-32 object-cover"
                loading="lazy"
                decoding="async"
              />
              <button
                onClick={() => {
                  setImageUrl('');
                  setImagePreview('');
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* 观点选择 - 利空在左（绿色），利多在右（红色） */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-2">观点</label>
          <div className="grid grid-cols-2 gap-3">
            {/* 利空 - 绿色 - 左侧 */}
            <button
              onClick={() => setSentiment('bearish')}
              className={`p-3 rounded-xl border-2 transition-all ${
                sentiment === 'bearish'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
              }`}
            >
              <span className={`block text-base font-bold mb-1 ${sentiment === 'bearish' ? 'text-green-400' : 'text-neutral-400'}`}>
                <ThumbsDown className="w-5 h-5 inline mr-1" /> 利空
              </span>
              <span className="block text-xs text-neutral-500">看空挑战成功</span>
            </button>
            {/* 利多 - 红色 - 右侧 */}
            <button
              onClick={() => setSentiment('bullish')}
              className={`p-3 rounded-xl border-2 transition-all ${
                sentiment === 'bullish'
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
              }`}
            >
              <span className={`block text-base font-bold mb-1 ${sentiment === 'bullish' ? 'text-red-400' : 'text-neutral-400'}`}>
                <ThumbsUp className="w-5 h-5 inline mr-1" /> 利多
              </span>
              <span className="block text-xs text-neutral-500">看好挑战成功</span>
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || uploading}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              content.trim() && !uploading
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {uploading ? '上传中...' : '发布'}
          </button>
        </div>
      </div>
    </div>
  );
}