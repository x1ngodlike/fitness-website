import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Check, X, Upload, User, GripVertical } from 'lucide-react';
import { useChallengeStore, loadToken } from '../store/challengeStore';
import { ParticipantItem } from '../types';
import { buttonClassName, Modal, Input, Checkbox, useToast } from '../components/ui';

export default function ParticipantManagementPage() {
  const { toast } = useToast();
  const { participants, addParticipantItem, updateParticipantItem, deleteParticipantItem, reorderParticipants } = useChallengeStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ParticipantItem | null>(null);

  // 拖拽状态
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // 排序：order 升序，缺省时按 createdAt 升序
  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      const ao = a.order ?? Number.MAX_SAFE_INTEGER;
      const bo = b.order ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.createdAt - b.createdAt;
    });
  }, [participants]);

  // 拖拽处理：被拖到某行上后，将 dragId 插入到 dragOverId 之前
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragId && dragId !== id) setDragOverId(id);
  };
  const handleDragLeave = (id: string) => {
    if (dragOverId === id) setDragOverId(null);
  };
  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };
  const handleDrop = async (e: React.DragEvent<HTMLTableRowElement>, dropId: string) => {
    e.preventDefault();
    const sourceId = dragId || e.dataTransfer.getData('text/plain');
    setDragId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === dropId) return;

    const ids = sortedParticipants.map((p) => p.id);
    const fromIdx = ids.indexOf(sourceId);
    const toIdx = ids.indexOf(dropId);
    if (fromIdx === -1 || toIdx === -1) return;

    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, sourceId);
    setSavingOrder(true);
    const ok = await reorderParticipants(ids);
    setSavingOrder(false);
    if (ok) toast('排序已保存', 'success');
    else toast('排序保存失败，请重试', 'error');
  };

  // 新增表单：name + 已创建后获得的 participantId（用于上传头像）
  const [addForm, setAddForm] = useState({ name: '', avatar: '', createdId: '' as string });
  const [addUploading, setAddUploading] = useState(false);

  // 编辑表单
  const [editForm, setEditForm] = useState({ name: '', avatar: '', isActive: true });
  const [editUploading, setEditUploading] = useState(false);

  // 上传头像到指定 id
  const uploadAvatar = async (id: string, file: File): Promise<string | null> => {
    const token = loadToken();
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`/api/participants/${id}/avatar`, {
      method: 'POST',
      headers: token ? { 'x-api-token': token } : {},
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.url || null;
  };

  // 新增弹窗内上传：若还没有 id 则先创建一条空记录以拿到 id，再上传头像
  const handleAddUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const name = addForm.name.trim();
    if (!name) {
      toast('请先填写姓名', 'error');
      return;
    }

    setAddUploading(true);
    try {
      let pid = addForm.createdId;
      if (!pid) {
        const created = await addParticipantItem(name);
        if (!created) {
          toast('创建参与者失败，请重试', 'error');
          return;
        }
        pid = created.id;
        setAddForm((prev) => ({ ...prev, createdId: pid }));
      }
      const url = await uploadAvatar(pid, file);
      if (url) {
        setAddForm((prev) => ({ ...prev, avatar: url }));
        toast('头像上传成功', 'success');
      } else {
        toast('头像上传失败：未返回地址', 'error');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast(`头像上传失败：${err?.message || '未知错误'}`, 'error');
    } finally {
      setAddUploading(false);
    }
  };

  const handleAdd = async () => {
    const name = addForm.name.trim();
    if (!name) {
      toast('请填写姓名', 'error');
      return;
    }
    if (addForm.createdId) {
      const ok = await updateParticipantItem(addForm.createdId, { name, avatar: addForm.avatar || undefined });
      if (ok) {
        toast('新增成功', 'success');
        setShowAddModal(false);
        setAddForm({ name: '', avatar: '', createdId: '' });
      } else {
        toast('新增失败，请重试', 'error');
      }
    } else {
      const created = await addParticipantItem(name, addForm.avatar || undefined);
      if (created) {
        toast('新增成功', 'success');
        setShowAddModal(false);
        setAddForm({ name: '', avatar: '', createdId: '' });
      } else {
        toast('新增失败，请重试', 'error');
      }
    }
  };

  // 编辑弹窗内上传
  const handleEditUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    e.target.value = '';
    setEditUploading(true);
    try {
      const url = await uploadAvatar(editingItem.id, file);
      if (url) {
        setEditForm((prev) => ({ ...prev, avatar: url }));
        await updateParticipantItem(editingItem.id, { avatar: url });
        toast('头像上传成功', 'success');
      } else {
        toast('头像上传失败：未返回地址', 'error');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast(`头像上传失败：${err?.message || '未知错误'}`, 'error');
    } finally {
      setEditUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    if (!editForm.name.trim()) {
      toast('请填写姓名', 'error');
      return;
    }
    const ok = await updateParticipantItem(editingItem.id, {
      name: editForm.name.trim(),
      avatar: editForm.avatar || undefined,
      isActive: editForm.isActive,
    });
    if (ok) {
      toast('保存成功', 'success');
      setShowEditModal(false);
      setEditingItem(null);
    } else {
      toast('保存失败，请重试', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个参与者吗？已参与的挑战记录将被标记为"已删除"。')) return;
    const ok = await deleteParticipantItem(id);
    if (ok) toast('删除成功', 'success');
    else toast('删除失败，请重试', 'error');
  };

  const openEdit = (item: ParticipantItem) => {
    setEditingItem(item);
    setEditForm({ name: item.name, avatar: item.avatar || '', isActive: item.isActive });
    setShowEditModal(true);
  };

  const closeAdd = () => {
    setShowAddModal(false);
    setAddForm({ name: '', avatar: '', createdId: '' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">参与者管理</h2>
          <p className="text-[var(--faint)] text-sm mt-1">
            共 {participants.length} 人 · 可拖拽行调整顺序（影响参与挑战弹窗的展示顺序）
          </p>
        </div>
        <button
          onClick={() => {
            setAddForm({ name: '', avatar: '', createdId: '' });
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
              <th className="w-10 px-2 py-3"></th>
              <th className="px-6 py-3 text-left text-sm font-medium text-[var(--muted)]">头像</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-[var(--muted)]">姓名</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-[var(--muted)]">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-[var(--muted)]">创建时间</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-[var(--muted)]">操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedParticipants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[var(--faint)]">
                  暂无参与者，请点击上方按钮添加
                </td>
              </tr>
            ) : (
              sortedParticipants.map((item) => {
                const isDragging = dragId === item.id;
                const isDragOver = dragOverId === item.id;
                return (
                  <tr
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={(e) => handleDragOver(e, item.id)}
                    onDragLeave={() => handleDragLeave(item.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, item.id)}
                    className={`border-t border-[var(--line)] transition-colors ${
                      isDragging ? 'opacity-50' : 'hover:bg-[var(--hover)]'
                    } ${isDragOver ? 'bg-[var(--accent-soft)]' : ''} ${savingOrder ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    <td className="px-2 py-4 text-[var(--faint)]">
                      <GripVertical className="w-4 h-4" />
                    </td>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showAddModal} onClose={closeAdd} title="新增参与者">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">姓名 *</label>
            <Input
              value={addForm.name}
              onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="请输入姓名（建议1-3个字）"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">头像</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAddUpload}
              className="hidden"
              id="add-avatar"
              disabled={addUploading}
            />
            <button
              type="button"
              onClick={() => document.getElementById('add-avatar')?.click()}
              disabled={addUploading}
              className={buttonClassName({ variant: 'secondary' })}
            >
              <Upload className="w-4 h-4" />
              {addUploading ? '上传中…' : addForm.avatar ? '重新上传' : '上传头像'}
            </button>
            {addUploading && (
              <span className="ml-2 text-xs text-[var(--muted)]">正在压缩并上传…</span>
            )}
            {addForm.avatar && !addUploading && (
              <div className="mt-2 flex items-center gap-2">
                <img src={addForm.avatar} alt="预览" className="w-16 h-16 rounded-full object-cover border border-[var(--line)]" />
                <span className="text-xs text-[var(--ok)]">已上传</span>
              </div>
            )}
            {!addForm.avatar && !addUploading && addForm.createdId && (
              <p className="mt-2 text-xs text-[var(--muted)]">头像可选，保存后仍可编辑补充</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--line)]">
            <button onClick={closeAdd} className={buttonClassName({ variant: 'ghost' })}>
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
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">姓名 *</label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">头像</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleEditUpload}
              className="hidden"
              id="edit-avatar"
              disabled={editUploading}
            />
            <button
              type="button"
              onClick={() => document.getElementById('edit-avatar')?.click()}
              disabled={editUploading}
              className={buttonClassName({ variant: 'secondary' })}
            >
              <Upload className="w-4 h-4" />
              {editUploading ? '上传中…' : '重新上传'}
            </button>
            {editUploading && (
              <span className="ml-2 text-xs text-[var(--muted)]">正在压缩并上传…</span>
            )}
            {editForm.avatar && (
              <div className="mt-2 flex items-center gap-2">
                <img src={editForm.avatar} alt="预览" className="w-16 h-16 rounded-full object-cover border border-[var(--line)]" />
                <button
                  onClick={async () => {
                    if (!editingItem) return;
                    const ok = await updateParticipantItem(editingItem.id, { avatar: '' });
                    if (ok) {
                      setEditForm((prev) => ({ ...prev, avatar: '' }));
                      toast('头像已移除', 'success');
                    }
                  }}
                  className={buttonClassName({ variant: 'danger', size: 'sm' })}
                >
                  <X className="w-4 h-4" />
                  移除
                </button>
              </div>
            )}
          </div>
          <div>
            <Checkbox
              checked={editForm.isActive}
              onChange={(checked) => setEditForm((prev) => ({ ...prev, isActive: checked }))}
            >
              启用
            </Checkbox>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--line)]">
            <button onClick={() => setShowEditModal(false)} className={buttonClassName({ variant: 'ghost' })}>
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
