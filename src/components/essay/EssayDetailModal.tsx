import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Image, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { Challenge } from '../../types';
import { useChallengeStore } from '../../store/challengeStore';
import { formatTime } from '../../utils/format';
import { ImagePreviewModal } from '../common/ImagePreviewModal';
import { Modal, Button, Input, Textarea, Badge, IconButton, useConfirm, useToast } from '../../components/ui';

interface EssayDetailModalProps {
  challenge: Challenge;
  onClose: () => void;
}

export function EssayDetailModal({ challenge, onClose }: EssayDetailModalProps) {
  const { essays, deleteEssay, isAdminAuthenticated } = useChallengeStore();
  const { confirm } = useConfirm();
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const challengeEssays = useMemo(() => {
    return essays.filter((e) => e.challengeId === challenge.id).sort((a, b) => b.createdAt - a.createdAt);
  }, [essays, challenge.id]);

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${challenge.hostName}的小作文`}
      headerRight={
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          添加
        </Button>
      }
    >
      <div className="space-y-3">
        {challengeEssays.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line-strong)] py-10 text-center">
            <div className="mb-3 text-4xl">📝</div>
            <p className="text-sm text-[var(--faint)]">还没有小作文，快来发布第一条吧！</p>
          </div>
        ) : (
          challengeEssays.map((essay) => (
            <div
              key={essay.id}
              className="group/essay relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 pl-5 transition-colors hover:border-[var(--line-strong)]"
            >
              {/* 左侧情感色条：红=利多 / 绿=利空（与红涨绿跌一致） */}
              <span
                className="absolute left-0 top-0 h-full w-1"
                style={{ background: essay.sentiment === 'bullish' ? 'var(--up)' : 'var(--down)' }}
              />

              {isAdminAuthenticated && (
                <IconButton
                  label="删除小作文"
                  variant="danger"
                  size="sm"
                  className="absolute right-2.5 top-2.5 opacity-0 transition-opacity group-hover/essay:opacity-100 focus-visible:opacity-100"
                  onClick={async () => {
                    if (await confirm({ title: '删除小作文', message: '确定要删除这条小作文吗？', confirmText: '删除', danger: true })) {
                      deleteEssay(essay.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              )}

              {essay.imageUrl && (
                <div
                  className="mb-3 cursor-pointer overflow-hidden rounded-lg border border-[var(--line)] transition-opacity hover:opacity-90"
                  onClick={() => setPreviewImage(essay.imageUrl!)}
                >
                  <img
                    src={essay.imageUrl}
                    alt="小作文配图"
                    className="max-h-64 w-full bg-[var(--bg)] object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              <p className="mb-3 text-sm leading-relaxed text-[var(--text)]">{essay.content}</p>

              <div className="flex items-center justify-between">
                <Badge variant={essay.sentiment === 'bullish' ? 'support' : 'oppose'} size="sm">
                  {essay.sentiment === 'bullish' ? (
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> 利多
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" /> 利空
                    </span>
                  )}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-[var(--faint)]">
                  <Clock className="w-3 h-3" />
                  {formatTime(essay.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
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
        <ImagePreviewModal src={previewImage} alt="图片预览" onClose={() => setPreviewImage(null)} />
      )}
    </Modal>
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
  const { toast } = useToast();
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
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
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

          fetch('/api/upload', { method: 'POST', body: formData })
            .then((response) => response.json())
            .then((result) => {
              if (result.url) setImageUrl(result.url);
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
      toast('请输入小作文', 'error');
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
    <Modal
      open
      onClose={onClose}
      title="发布小作文"
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            fullWidth
            disabled={!content.trim() || uploading}
            onClick={handleSubmit}
          >
            {uploading ? '上传中...' : '发布'}
          </Button>
        </>
      }
    >
      <div className="mb-4">
        <label className="mb-2 block font-medium text-[var(--text)]">请输入小作文</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePaste}
          placeholder={`为 ${hostName} 的挑战发表你的看法...`}
          rows={5}
        />
        <p className="mt-1 text-xs text-[var(--faint)]">支持直接粘贴图片（Ctrl+V / Cmd+V）</p>
      </div>

      <div className="mb-4">
        <label className="mb-2 block font-medium text-[var(--text)]">
          <Image className="mr-2 inline h-4 w-4 text-[var(--accent)]" />
          图片（可选）
        </label>
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          className="text-sm text-[var(--muted)]"
        />

        {imagePreview && (
          <div className="relative mt-3 overflow-hidden rounded-lg border border-[var(--line)]">
            <img src={imagePreview} alt="预览" className="h-32 w-full object-cover" loading="lazy" decoding="async" />
            <button
              onClick={() => {
                setImageUrl('');
                setImagePreview('');
              }}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1 transition-colors hover:bg-black/70"
            >
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="mb-1">
        <label className="mb-2 block font-medium text-[var(--text)]">观点</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSentiment('bullish')}
            className={`relative overflow-hidden rounded-xl border-2 p-3.5 text-left transition-all ${
              sentiment === 'bullish'
                ? 'border-[var(--up)] bg-[var(--up-soft)]'
                : 'border-[var(--line-strong)] bg-[var(--surface-2)] hover:border-[var(--line)]'
            }`}
          >
            <span
              className="flex items-center gap-2 text-base font-bold"
              style={{ color: sentiment === 'bullish' ? 'var(--up)' : 'var(--muted)' }}
            >
              <ThumbsUp className="h-5 w-5" /> 利多
            </span>
            <span className="mt-1 block text-xs text-[var(--faint)]">看好挑战成功</span>
          </button>
          <button
            onClick={() => setSentiment('bearish')}
            className={`relative overflow-hidden rounded-xl border-2 p-3.5 text-left transition-all ${
              sentiment === 'bearish'
                ? 'border-[var(--down)] bg-[var(--down-soft)]'
                : 'border-[var(--line-strong)] bg-[var(--surface-2)] hover:border-[var(--line)]'
            }`}
          >
            <span
              className="flex items-center gap-2 text-base font-bold"
              style={{ color: sentiment === 'bearish' ? 'var(--down)' : 'var(--muted)' }}
            >
              <ThumbsDown className="h-5 h-5" /> 利空
            </span>
            <span className="mt-1 block text-xs text-[var(--faint)]">看空挑战成功</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
