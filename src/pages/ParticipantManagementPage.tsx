import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Upload, User } from 'lucide-react';
import { useChallengeStore, loadToken } from '../store/challengeStore';
import { ParticipantItem } from '../types';
import { buttonClassName, Modal, Input, Checkbox } from '../components/ui';

export default function ParticipantManagementPage() {
  const { participants, addParticipantItem, updateParticipantItem, deleteParticipantItem, loadParticipants } = useChallengeStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ParticipantItem | null>(null);
  const [formData, setFormData] = useState({ name: '', avatar: '', isActive: true });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = loadToken();
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`/api/participants/${editingItem?.id || 'temp'}/avatar`, {
        method: 'POST',
        headers: token ? { 'x-api-token': token } : {},
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, avatar: data.url }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    const success = await addParticipantItem(formData.name.trim(), formData.avatar || undefined);
    if (success) {
      setShowAddModal(false);
      setFormData({ name: '', avatar: '', isActive: true });
    }
  };

  const handleEdit = async () => {
    if (!editingItem || !formData.name.trim()) return;
    const success = await updateParticipantItem(editingItem.id, {
      name: formData.name.trim(),
      avatar: formData.avatar || undefined,
      isActive: formData.isActive,
    });
    if (success) {
      setShowEditModal(false);
      setEditingItem(null);
      setFormData({ name: '', avatar: '', isActive: true });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个参与者吗？已参与的挑战记录将被标记为"已删除"。')) return;
    await deleteParticipantItem(id);
  };

  const openEdit = (item: ParticipantItem) => {
    setEditingItem(item);
    setFormData({ name: item.name, avatar: item.avatar || '', isActive: item.isActive });
    setShowEditModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--text)]">参与者管理</h2>
        <button
          onClick={() => {
            setFormData({ name: '', avatar: '', isActive: true });
            setShowAddModal(true);
          }}
          className={buttonClassName({ variant: 'primary' })}
        >
          <Plus className="w-4 h-4" />
          新增参与者
        </button>
      </div>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--line)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--surface-2)]">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-[var(--muted)]">头像</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-[var(--muted)]">姓名</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-[var(--muted)]">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-[var(--muted)]">创建时间</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-[var(--muted)]">操作</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[var(--faint)]">
                  暂无参与者，请点击上方按钮添加
                </td>
              </tr>
            ) : (
              participants.map((item) => (
                <tr key={item.id} className="border-t border-[var(--line)] hover:bg-[var(--hover)]">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center overflow-hidden">
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-[var(--muted)]" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--text)] font-medium">{item.name}</td>
                  <td className="px-6 py-4">
                    {item.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--ok-soft)] text-[var(--ok)] text-xs font-medium">
                        <Check className="w-3 h-3" />
                        启用
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bad-soft)] text-[var(--bad)] text-xs font-medium">
                        <X className="w-3 h-3" />
                        停用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--muted)]">
                    {new Date(item.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className={buttonClassName({ variant: 'ghost', size: 'sm' })}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className={buttonClassName({ variant: 'danger', size: 'sm' })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="新增参与者">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">姓名</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">头像</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              id="add-avatar"
            />
            <button
              type="button"
              onClick={() => document.getElementById('add-avatar')?.click()}
              className={buttonClassName({ variant: 'secondary' })}
            >
              <Upload className="w-4 h-4" />
              上传头像
            </button>
            {formData.avatar && (
              <div className="mt-2">
                <img src={formData.avatar} alt="预览" className="w-16 h-16 rounded-full object-cover" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setShowAddModal(false)}
              className={buttonClassName({ variant: 'ghost' })}
            >
              取消
            </button>
            <button onClick={handleAdd} className={buttonClassName({ variant: 'primary' })}>
              确定
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="编辑参与者">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">姓名</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">头像</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              id="edit-avatar"
            />
            <button
              type="button"
              onClick={() => document.getElementById('edit-avatar')?.click()}
              disabled={uploading}
              className={buttonClassName({ variant: 'secondary' })}
            >
              <Upload className="w-4 h-4" />
              {uploading ? '上传中...' : '上传头像'}
            </button>
            {formData.avatar && (
              <div className="mt-2 flex items-center gap-2">
                <img src={formData.avatar} alt="预览" className="w-16 h-16 rounded-full object-cover" />
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                  className={buttonClassName({ variant: 'danger', size: 'sm' })}
                >
                  <X className="w-4 h-4" />
                  删除
                </button>
              </div>
            )}
          </div>
          <div>
            <Checkbox
              checked={formData.isActive}
              onChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            >
              启用
            </Checkbox>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setShowEditModal(false)}
              className={buttonClassName({ variant: 'ghost' })}
            >
              取消
            </button>
            <button onClick={handleEdit} className={buttonClassName({ variant: 'primary' })}>
              确定
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
