import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, CheckCircle, X, Lock, Unlock, Users, Save, Trash2, UserX, Download, Upload, AlertTriangle, ChevronDown, ChevronRight, Settings, Trophy, Globe, MoreVertical, Plus, LogOut, FlaskConical, Rocket, Activity, Wallet, Database } from 'lucide-react';
import { useChallengeStore, loadToken } from '../store/challengeStore';
import { Challenge, Participant } from '../types';
import { Button, IconButton, Input, Textarea, Select, Tabs, Card, Modal, Badge, buttonClassName } from '../components/ui';

type EffectiveStatus = 'active' | 'pending' | 'completed';
type TabType = 'challenges' | 'settings' | 'backup';

function getEffectiveStatus(challenge: Challenge): EffectiveStatus {
  if (challenge.status === 'completed') return 'completed';
  const endDate = new Date(challenge.endDate).getTime();
  if (challenge.status === 'active' && Date.now() > endDate) return 'pending';
  return 'active';
}

export function AdminPanelPage() {
  const navigate = useNavigate();
  const isAdminAuthenticated = useChallengeStore((state) => state.isAdminAuthenticated);
  const challenges = useChallengeStore((state) => state.challenges);
  const updateChallenge = useChallengeStore((state) => state.updateChallenge);
  const toggleBlock = useChallengeStore((state) => state.toggleBlock);
  const setChallengeResult = useChallengeStore((state) => state.setChallengeResult);
  const updateParticipant = useChallengeStore((state) => state.updateParticipant);
  const deleteParticipant = useChallengeStore((state) => state.deleteParticipant);
  const deleteChallenge = useChallengeStore((state) => state.deleteChallenge);

  const [activeTab, setActiveTab] = useState<TabType>('challenges');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<EffectiveStatus | 'all'>('all');
  const [expandedChallenges, setExpandedChallenges] = useState<Set<string>>(new Set());
  const envMode = useChallengeStore((state) => state.envMode);
  const setEnvMode = useChallengeStore((state) => state.setEnvMode);
  const logoutAdmin = useChallengeStore((state) => state.logoutAdmin);
  const [editingChallenge, setEditingChallenge] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    theme: '',
    goal: '',
    hostName: '',
    coverImage: '',
    startDate: '',
    endDate: '',
    maxPayout: 0,
    minStake: 0,
  });

  const [editingParticipant, setEditingParticipant] = useState<{ challengeId: string; participant: Participant } | null>(null);
  const [editParticipantData, setEditParticipantData] = useState({
    participantName: '',
    stake: 0,
    side: 'support' as 'support' | 'oppose',
    joinTime: '',
  });

  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showServerBackups, setShowServerBackups] = useState(false);
  const [serverBackups, setServerBackups] = useState<Array<{ filename: string; size: number; createdAt: string }>>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const init = useChallengeStore((state) => state.init);

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.websiteUrl) setWebsiteUrl(data.websiteUrl);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const saveSettings = async () => {
    const token = localStorage.getItem('challenge-api-token');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': token || '',
        },
        body: JSON.stringify({ websiteUrl }),
      });
      const result = await res.json();
      if (result.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadSettings();
    }
  }, [isAdminAuthenticated]);

  const loadServerBackups = async () => {
    const token = localStorage.getItem('challenge-api-token');
    setIsLoadingBackups(true);
    try {
      const res = await fetch('/api/server-backups', {
        headers: { 'x-api-token': token || '' },
      });
      const backups = await res.json();
      setServerBackups(backups);
    } catch (e) {
      console.error('Failed to load server backups:', e);
    }
    setIsLoadingBackups(false);
  };

  const createServerBackup = async () => {
    const token = localStorage.getItem('challenge-api-token');
    try {
      const res = await fetch('/api/server-backup', {
        method: 'POST',
        headers: { 'x-api-token': token || '' },
      });
      const result = await res.json();
      if (result.ok) {
        setBackupMessage({ type: 'success', text: `服务器备份创建成功: ${result.file}` });
        await loadServerBackups();
      } else {
        setBackupMessage({ type: 'error', text: result.error || '备份失败' });
      }
    } catch (e) {
      setBackupMessage({ type: 'error', text: '备份失败，请重试' });
    }
    setTimeout(() => setBackupMessage(null), 3000);
  };

  const restoreFromServerBackup = async (filename: string) => {
    if (!confirm(`⚠️ 确定要从备份 "${filename}" 恢复吗？这将覆盖当前所有数据！`)) {
      return;
    }

    const token = localStorage.getItem('challenge-api-token');
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/server-restore/${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'x-api-token': token || '' },
      });
      const result = await res.json();
      if (result.ok) {
        await init();
        setBackupMessage({ type: 'success', text: `从服务器备份恢复成功！共 ${result.count} 条数据` });
      } else {
        setBackupMessage({ type: 'error', text: result.error || '恢复失败' });
      }
    } catch (e) {
      setBackupMessage({ type: 'error', text: '恢复失败，请重试' });
    }
    setIsRestoring(false);
    setTimeout(() => setBackupMessage(null), 3000);
  };

  const deleteServerBackup = async (filename: string) => {
    if (!confirm(`确定要删除备份 "${filename}" 吗？`)) {
      return;
    }

    const token = localStorage.getItem('challenge-api-token');
    try {
      const res = await fetch(`/api/server-backup/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { 'x-api-token': token || '' },
      });
      const result = await res.json();
      if (result.ok) {
        setBackupMessage({ type: 'success', text: '备份已删除' });
        await loadServerBackups();
      } else {
        setBackupMessage({ type: 'error', text: result.error || '删除失败' });
      }
    } catch (e) {
      setBackupMessage({ type: 'error', text: '删除失败，请重试' });
    }
    setTimeout(() => setBackupMessage(null), 3000);
  };

  const downloadServerBackup = async (filename: string) => {
    const token = localStorage.getItem('challenge-api-token');
    try {
      const res = await fetch(`/api/backup/download/${encodeURIComponent(filename)}`, {
        headers: { 'x-api-token': token || '' },
      });
      if (!res.ok) {
        throw new Error('下载失败');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setBackupMessage({ type: 'error', text: '下载失败，请重试' });
      setTimeout(() => setBackupMessage(null), 3000);
    }
  };

  const handleBackup = async () => {
    const token = localStorage.getItem('challenge-api-token');
    try {
      const res = await fetch('/api/backup', {
        headers: { 'x-api-token': token || '' },
      });
      if (!res.ok) {
        throw new Error('备份失败');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setBackupMessage({ type: 'success', text: '备份成功！文件已下载' });
    } catch (e) {
      setBackupMessage({ type: 'error', text: '备份失败，请重试' });
    }
    setTimeout(() => setBackupMessage(null), 3000);
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('⚠️ 恢复数据将覆盖当前所有数据，确定继续吗？')) {
      return;
    }

    setIsRestoring(true);
    const token = localStorage.getItem('challenge-api-token');

    try {
      const content = await file.text();
      const backupData = JSON.parse(content);

      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': token || '',
        },
        body: JSON.stringify(backupData),
      });

      if (!res.ok) {
        throw new Error('恢复失败');
      }

      const result = await res.json();
      if (result.ok) {
        await init();
        setBackupMessage({ type: 'success', text: `恢复成功！共 ${result.count} 条挑战数据` });
      } else {
        setBackupMessage({ type: 'error', text: result.error || '恢复失败' });
      }
    } catch (e) {
      setBackupMessage({ type: 'error', text: '恢复失败，请检查文件格式' });
    }

    setIsRestoring(false);
    event.target.value = '';
    setTimeout(() => setBackupMessage(null), 3000);
  };

  const toggleChallenge = (challengeId: string) => {
    setExpandedChallenges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(challengeId)) {
        newSet.delete(challengeId);
      } else {
        newSet.add(challengeId);
      }
      return newSet;
    });
  };

  const filteredChallenges = useMemo(() => {
    return challenges.filter(challenge => {
      if (statusFilter === 'all') return true;
      return getEffectiveStatus(challenge) === statusFilter;
    }).sort((a, b) => {
      const statusA = getEffectiveStatus(a);
      const statusB = getEffectiveStatus(b);
      const order: Record<EffectiveStatus, number> = { pending: 0, active: 1, completed: 2 };
      if (order[statusA] !== order[statusB]) return order[statusA] - order[statusB];
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [challenges, statusFilter]);

  const stats = useMemo(() => {
    let active = 0, participants = 0, stake = 0;
    for (const c of challenges) {
      if (getEffectiveStatus(c) === 'active') active++;
      participants += c.participants.length;
      stake += c.participants.reduce((s, p) => s + (p.stake || 0), 0);
    }
    return { total: challenges.length, active, participants, stake };
  }, [challenges]);

  const startEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge.id);
    setEditFormData({
      theme: challenge.theme,
      goal: challenge.goal,
      hostName: challenge.hostName,
      coverImage: challenge.coverImage,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      maxPayout: challenge.maxPayout,
      minStake: challenge.minStake,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/admin-upload', {
        method: 'POST',
        headers: { 'x-api-token': loadToken() || '' },
        body: formData,
      });
      const result = await response.json();
      if (result.url) {
        setEditFormData((prev) => ({ ...prev, coverImage: result.url }));
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  };

  const saveEdit = async () => {
    if (editingChallenge) {
      await updateChallenge(editingChallenge, {
        theme: editFormData.theme,
        goal: editFormData.goal,
        hostName: editFormData.hostName,
        coverImage: editFormData.coverImage,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        maxPayout: editFormData.maxPayout,
        minStake: editFormData.minStake,
      });
      setEditingChallenge(null);
    }
  };

  const startEditParticipant = (challengeId: string, participant: Participant) => {
    setEditingParticipant({ challengeId, participant });
    setEditParticipantData({
      participantName: participant.participantName,
      stake: participant.stake,
      side: participant.side,
      joinTime: participant.joinTime || '',
    });
  };

  const saveParticipantEdit = async () => {
    if (editingParticipant) {
      await updateParticipant(editingParticipant.challengeId, editingParticipant.participant.id, {
        participantName: editParticipantData.participantName,
        stake: editParticipantData.stake,
        side: editParticipantData.side,
        joinTime: editParticipantData.joinTime,
      });
      setEditingParticipant(null);
    }
  };

  const getStatusText = (status: EffectiveStatus) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'pending':
        return '待确认';
      case 'completed':
        return '已结束';
    }
  };

  const statusTabs: { label: string; value: EffectiveStatus | 'all' }[] = [
    { label: '全部', value: 'all' },
    { label: '进行中', value: 'active' },
    { label: '待确认', value: 'pending' },
    { label: '已结束', value: 'completed' },
  ];

  const navItemClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${
      active
        ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-line)]'
        : 'text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] border border-transparent'
    }`;

  const EnvSwitch = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex items-center gap-1 p-1 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl ${compact ? 'w-full' : ''}`}>
      <button
        onClick={() => setEnvMode('test')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          envMode === 'test' ? 'bg-[var(--ok-soft)] text-[var(--ok)]' : 'text-[var(--faint)] hover:text-[var(--text)]'
        }`}
      >
        <FlaskConical className="w-4 h-4" />
        测试
      </button>
      <button
        onClick={() => setEnvMode('production')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          envMode === 'production' ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--faint)] hover:text-[var(--text)]'
        }`}
      >
        <Rocket className="w-4 h-4" />
        正式
      </button>
    </div>
  );

  const statCards = [
    { icon: Trophy, label: '挑战总数', value: String(stats.total) },
    { icon: Activity, label: '进行中', value: String(stats.active) },
    { icon: Users, label: '参与者', value: String(stats.participants) },
    { icon: Wallet, label: '总押注', value: `¥${stats.stake.toLocaleString()}` },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] lg:flex">
      {/* —— 桌面端侧边栏 —— */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[264px] bg-[var(--surface)] border-r border-[var(--line)] flex-col z-40">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[var(--line)]">
          <img src="/logo.png" alt="野兽俱乐部" className="h-9 w-9 rounded-xl object-contain" />
          <div className="leading-tight">
            <div className="font-display font-bold tracking-tight">野兽俱乐部</div>
            <div className="text-[11px] text-[var(--faint)]">管理控制台</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => setActiveTab('challenges')} className={navItemClass(activeTab === 'challenges')}>
            <Trophy className="w-5 h-5" />
            <span className="font-medium">挑战管理</span>
          </button>
          <button onClick={() => setActiveTab('backup')} className={navItemClass(activeTab === 'backup')}>
            <Database className="w-5 h-5" />
            <span className="font-medium">备份恢复</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={navItemClass(activeTab === 'settings')}>
            <Settings className="w-5 h-5" />
            <span className="font-medium">系统设置</span>
          </button>
        </nav>

        <div className="p-3 border-t border-[var(--line)] space-y-3">
          <EnvSwitch />
          <Button variant="danger" size="md" fullWidth onClick={() => { logoutAdmin(); navigate('/'); }}>
            <LogOut className="w-4 h-4" />
            退出登录
          </Button>
        </div>
      </aside>

      {/* —— 主区域 —— */}
      <div className="lg:pl-[264px] flex-1 min-h-screen flex flex-col">
        {/* 桌面顶栏 */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between px-8 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--line)]">
          <h1 className="font-display text-lg font-bold">
            {activeTab === 'challenges' ? '挑战管理' : activeTab === 'settings' ? '系统设置' : '备份恢复'}
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>返回首页</Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/create')}>
              <Plus className="w-4 h-4" />
              创建挑战
            </Button>
          </div>
        </header>

        {/* 移动端顶栏 */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-[var(--bg-90)] backdrop-blur-xl border-b border-[var(--line)]">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="野兽俱乐部" className="h-9 w-9 rounded-xl object-contain" />
            <span className="font-display font-bold tracking-tight">野兽俱乐部</span>
          </Button>
          <IconButton label="菜单" variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <MoreVertical className="w-6 h-6" />
          </IconButton>
        </header>

        {/* 移动端下拉菜单 */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-[var(--surface)] border-b border-[var(--line)] p-4 space-y-3">
            <EnvSwitch compact />
            <Button variant="primary" size="lg" fullWidth onClick={() => { setMobileMenuOpen(false); navigate('/create'); }}>
              <Plus className="w-5 h-5" />
              创建挑战
            </Button>
            <Button variant="danger" size="lg" fullWidth onClick={() => { logoutAdmin(); navigate('/'); }}>
              <LogOut className="w-5 h-5" />
              退出登录
            </Button>
          </div>
        )}

        {/* 内容 */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-28 lg:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {/* 指标条 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              {statCards.map(({ icon: Icon, label, value }) => (
                <Card key={label} padding="sm">
                  <div className="flex items-center gap-2 text-[var(--faint)] text-xs font-medium">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  <div className="font-display text-2xl font-bold mt-2 tabular-nums tracking-tight">{value}</div>
                </Card>
              ))}
            </div>

            {/* 挑战管理 */}
            {activeTab === 'challenges' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold">挑战管理</h2>
                    <p className="text-[var(--faint)] text-sm mt-1">共 {filteredChallenges.length} 个挑战</p>
                  </div>
                  <Tabs
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v)}
                    options={statusTabs}
                  />
                </div>

                {/* 列表 */}
                <div className="space-y-3">
                  {filteredChallenges.map((challenge) => {
                    const effectiveStatus = getEffectiveStatus(challenge);
                    const isExpanded = expandedChallenges.has(challenge.id);

                    return (
                      <Card key={challenge.id} padding="none" className="overflow-hidden">
                        <button
                          onClick={() => toggleChallenge(challenge.id)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-[var(--hover)] transition-colors text-left"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-[var(--faint)] flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-[var(--faint)] flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base lg:text-lg font-bold truncate">{challenge.theme}</h3>
                              <Badge variant={effectiveStatus === 'active' ? 'success' : effectiveStatus === 'pending' ? 'warning' : 'neutral'} size="sm">
                                {getStatusText(effectiveStatus)}
                              </Badge>
                              {challenge.isBlocked && challenge.status === 'active' && (
                                <Badge variant="danger" size="sm">
                                  <Lock className="w-3 h-3" />
                                  已封档
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 lg:gap-4 text-xs lg:text-sm text-[var(--faint)] mt-1.5 flex-wrap">
                              <span className="text-[var(--accent)]">{challenge.hostName}</span>
                              <span>{challenge.startDate} ~ {challenge.endDate}</span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {challenge.participants.length}人
                              </span>
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-4 border-t border-[var(--line)]">
                            {editingChallenge === challenge.id ? (
                              <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-bold">编辑挑战</h3>
                                  <IconButton label="关闭" variant="ghost" size="sm" onClick={() => setEditingChallenge(null)}>
                                    <X className="w-5 h-5" />
                                  </IconButton>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-[var(--muted)] mb-1.5 block">挑战主题</label>
                                    <Input
                                      type="text"
                                      value={editFormData.theme}
                                      onChange={(e) => setEditFormData({ ...editFormData, theme: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-[var(--muted)] mb-1.5 block">挑战者姓名</label>
                                    <Input
                                      type="text"
                                      value={editFormData.hostName}
                                      onChange={(e) => setEditFormData({ ...editFormData, hostName: e.target.value })}
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="text-sm text-[var(--muted)] mb-1.5 block">挑战目标</label>
                                    <Textarea
                                      rows={2}
                                      value={editFormData.goal}
                                      onChange={(e) => setEditFormData({ ...editFormData, goal: e.target.value })}
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="text-sm text-[var(--muted)] mb-1.5 block">封面图片</label>
                                    <Input
                                      type="text"
                                      value={editFormData.coverImage}
                                      onChange={(e) => setEditFormData({ ...editFormData, coverImage: e.target.value })}
                                      placeholder="图片URL或点击下方按钮上传"
                                      className="mb-2"
                                    />
                                    <label className={`${buttonClassName({ variant: 'primary', size: 'md' })} cursor-pointer`}>
                                      <Upload className="w-4 h-4" />
                                      上传图片
                                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                  </div>
                                  <div>
                                    <label className="text-sm text-[var(--muted)] mb-1.5 block">开始日期</label>
                                    <Input
                                      type="date"
                                      value={editFormData.startDate}
                                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-[var(--muted)] mb-1.5 block">结束日期</label>
                                    <Input
                                      type="date"
                                      value={editFormData.endDate}
                                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-[var(--muted)] mb-1.5 block">通赔金额</label>
                                    <Input
                                      type="number"
                                      value={editFormData.maxPayout}
                                      onChange={(e) => setEditFormData({ ...editFormData, maxPayout: Number(e.target.value) })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-[var(--muted)] mb-1.5 block">底仓金额</label>
                                    <Input
                                      type="number"
                                      min="200"
                                      value={editFormData.minStake}
                                      onChange={(e) => setEditFormData({ ...editFormData, minStake: Number(e.target.value) })}
                                    />
                                  </div>
                                </div>

                                <Button variant="primary" size="md" fullWidth onClick={saveEdit}>
                                  保存修改
                                </Button>
                              </div>
                            ) : (
                              <div className="pt-4 space-y-4">
                                <p className="text-[var(--muted)] text-sm">{challenge.goal}</p>

                                <div className="flex items-center gap-5 text-sm">
                                  <span className="text-[var(--muted)]">
                                    通赔：<span className="text-[var(--text)] font-semibold">{challenge.maxPayout}</span>
                                  </span>
                                  <span className="text-[var(--muted)]">
                                    底仓：<span className="text-[var(--text)] font-semibold">{challenge.minStake}</span>
                                  </span>
                                </div>

                                {challenge.participants.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium text-[var(--muted)] mb-3">参与者列表</h4>
                                    <div className="space-y-2">
                                      {challenge.participants.map((participant) => {
                                        const isEditing =
                                          editingParticipant?.challengeId === challenge.id &&
                                          editingParticipant?.participant.id === participant.id;
                                        return (
                                          <div key={participant.id} className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-xl gap-2">
                                            {isEditing ? (
                                              <div className="flex items-center gap-2 flex-wrap flex-1">
                                                <Input
                                                  type="text"
                                                  value={editParticipantData.participantName}
                                                  onChange={(e) => setEditParticipantData({ ...editParticipantData, participantName: e.target.value })}
                                                  placeholder="姓名"
                                                  className="flex-1 min-w-[120px]"
                                                />
                                                <Input
                                                  type="number"
                                                  min="100"
                                                  value={editParticipantData.stake}
                                                  onChange={(e) => setEditParticipantData({ ...editParticipantData, stake: Number(e.target.value) })}
                                                  placeholder="金额"
                                                  className="w-24"
                                                />
                                                <Select
                                                  value={editParticipantData.side}
                                                  onChange={(e) => setEditParticipantData({ ...editParticipantData, side: e.target.value as 'support' | 'oppose' })}
                                                  className="w-auto"
                                                >
                                                  <option value="support">白（支持）</option>
                                                  <option value="oppose">黑（反对）</option>
                                                </Select>
                                                <Input
                                                  type="date"
                                                  value={editParticipantData.joinTime}
                                                  onChange={(e) => setEditParticipantData({ ...editParticipantData, joinTime: e.target.value })}
                                                  className="w-auto"
                                                />
                                                <IconButton label="保存" variant="success" size="sm" onClick={saveParticipantEdit}>
                                                  <Save className="w-4 h-4" />
                                                </IconButton>
                                                <IconButton label="取消" variant="ghost" size="sm" onClick={() => setEditingParticipant(null)}>
                                                  <X className="w-4 h-4" />
                                                </IconButton>
                                              </div>
                                            ) : (
                                              <div className="flex items-center justify-between gap-2 flex-1">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                  <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                    {participant.participantName.charAt(0)}
                                                  </div>
                                                  <span className="text-white text-sm">{participant.participantName}</span>
                                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                                                    participant.side === 'support'
                                                      ? 'bg-[var(--side-support)] text-[var(--side-support-text)] border-[var(--side-support-line)]'
                                                      : 'bg-[var(--side-oppose)] text-[var(--side-oppose-text)] border-[var(--side-oppose-line)]'
                                                  }`}>
                                                    {participant.side === 'support' ? '白方' : '黑方'}
                                                  </span>
                                                  <span className="text-xs text-[var(--faint)]">{participant.stake} 元</span>
                                                  {participant.joinTime && (
                                                    <span className="text-xs text-[var(--faint)]">| {participant.joinTime}</span>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                  <IconButton label="编辑参与者" variant="ghost" size="sm" onClick={() => startEditParticipant(challenge.id, participant)}>
                                                    <Edit2 className="w-4 h-4" />
                                                  </IconButton>
                                                  <IconButton
                                                    label="删除参与者"
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={async () => {
                                                      if (confirm(`确定要删除参与者「${participant.participantName}」吗？此操作不可撤销。`)) {
                                                        await deleteParticipant(challenge.id, participant.id);
                                                      }
                                                    }}
                                                  >
                                                    <UserX className="w-4 h-4" />
                                                  </IconButton>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                  <Button variant="secondary" size="sm" onClick={() => startEdit(challenge)}>
                                    <Edit2 className="w-4 h-4" />
                                    编辑
                                  </Button>
                                  {challenge.status !== 'completed' && (
                                    <Button
                                      variant={challenge.isBlocked ? 'success' : 'danger'}
                                      size="sm"
                                      onClick={async () => { await toggleBlock(challenge.id); }}
                                    >
                                      {challenge.isBlocked ? (
                                        <>
                                          <Unlock className="w-4 h-4" />
                                          解除封档
                                        </>
                                      ) : (
                                        <>
                                          <Lock className="w-4 h-4" />
                                          封档（禁止参与）
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  {(effectiveStatus === 'active' || effectiveStatus === 'pending') && (
                                    <>
                                      <Button variant="success" size="sm" onClick={async () => { await setChallengeResult(challenge.id, 'success'); }}>
                                        <CheckCircle className="w-4 h-4" />
                                        标记挑战者成功
                                      </Button>
                                      <Button variant="danger" size="sm" onClick={async () => { await setChallengeResult(challenge.id, 'failed'); }}>
                                        <X className="w-4 h-4" />
                                        标记挑战者失败
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={async () => {
                                      if (confirm(`确定要删除挑战「${challenge.theme}」吗？此操作不可撤销。`)) {
                                        await deleteChallenge(challenge.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    删除挑战
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}

                  {filteredChallenges.length === 0 && (
                    <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--line)]">
                      <p className="text-[var(--faint)]">暂无挑战数据</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 系统设置 */}
            {activeTab === 'settings' && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-xl font-bold">系统设置</h2>
                  <p className="text-[var(--faint)] text-sm mt-1">管理网站基础配置</p>
                </div>

                {/* 官网地址 */}
                <Card padding="md">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="font-bold">官网地址设置</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="text-sm text-[var(--muted)] mb-1.5 block">官网地址</label>
                      <Input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                    <Button
                      variant={settingsSaved ? 'success' : 'primary'}
                      size="md"
                      onClick={saveSettings}
                      className="self-stretch sm:self-end whitespace-nowrap"
                    >
                      {settingsSaved ? '已保存' : '保存地址'}
                    </Button>
                  </div>
                  <p className="text-[var(--faint)] text-sm mt-3">设置后将在每日简报中显示此地址</p>
                </Card>
              </div>
            )}

            {/* 备份恢复（一级菜单） */}
            {activeTab === 'backup' && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-xl font-bold">备份恢复</h2>
                  <p className="text-[var(--faint)] text-sm mt-1">管理数据备份与恢复</p>
                </div>

                {backupMessage && (
                  <div className={`p-4 rounded-xl text-sm border ${
                    backupMessage.type === 'success'
                      ? 'bg-[var(--ok-soft)] border-[var(--ok-line)] text-[var(--ok)]'
                      : 'bg-[var(--bad-soft)] border-[var(--bad-line)] text-[var(--bad)]'
                  }`}>
                    {backupMessage.text}
                  </div>
                )}

                {/* 数据备份与恢复 */}
                <Card padding="md">
                  <div className="flex items-center gap-3 mb-5">
                    <Database className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="font-bold">数据备份与恢复</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl">
                      <h4 className="text-sm font-medium text-[var(--muted)] mb-3">本地操作</h4>
                      <div className="flex flex-col gap-2">
                        <Button variant="info" size="md" fullWidth onClick={handleBackup}>
                          <Download className="w-4 h-4" />
                          下载备份到本地
                        </Button>
                        <label className={`${buttonClassName({ variant: 'purple', size: 'md' })} cursor-pointer`}>
                          <Upload className="w-4 h-4" />
                          从本地文件恢复
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleRestore}
                            disabled={isRestoring}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="p-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl">
                      <h4 className="text-sm font-medium text-[var(--muted)] mb-3">服务器操作</h4>
                      <div className="flex flex-col gap-2">
                        <Button variant="info" size="md" fullWidth onClick={createServerBackup}>
                          <Download className="w-4 h-4" />
                          创建服务器备份
                        </Button>
                        <Button
                          variant="secondary"
                          size="md"
                          fullWidth
                          onClick={() => { setShowServerBackups(true); loadServerBackups(); }}
                        >
                          <Upload className="w-4 h-4" />
                          从服务器备份恢复
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-[var(--accent-soft)] border border-[var(--accent-line)] rounded-xl">
                    <p className="text-[var(--accent)] text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>自动备份：每天凌晨2点自动创建，保留最近7天</span>
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 移动端底部 Tab 栏 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-[var(--surface-95)] backdrop-blur-xl border-t border-[var(--line)]">
        <button
          onClick={() => { setActiveTab('challenges'); setMobileMenuOpen(false); }}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
            activeTab === 'challenges' ? 'text-[var(--accent)]' : 'text-[var(--faint)]'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-xs font-medium">挑战</span>
        </button>
        <button
          onClick={() => { setActiveTab('backup'); setMobileMenuOpen(false); }}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
            activeTab === 'backup' ? 'text-[var(--accent)]' : 'text-[var(--faint)]'
          }`}
        >
          <Database className="w-5 h-5" />
          <span className="text-xs font-medium">备份</span>
        </button>
        <button
          onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
            activeTab === 'settings' ? 'text-[var(--accent)]' : 'text-[var(--faint)]'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs font-medium">设置</span>
        </button>
      </nav>

      {/* 服务器备份列表弹窗 */}
      <Modal
        open={showServerBackups}
        onClose={() => setShowServerBackups(false)}
        size="lg"
        title="服务器备份管理"
      >
        <div className="mb-4 p-3 bg-[var(--accent-soft)] border border-[var(--accent-line)] rounded-xl">
          <p className="text-[var(--accent)] text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>自动备份：每天凌晨2点创建，保留最近7天</span>
          </p>
          <p className="text-[var(--accent)] text-sm mt-1">手动备份：需手动创建，不会被自动清理</p>
        </div>

        {isLoadingBackups ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : serverBackups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--faint)]">暂无服务器备份</p>
            <Button variant="info" size="sm" className="mt-4" onClick={createServerBackup}>
              创建第一个备份
            </Button>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1 scroll-slim">
            {serverBackups.map((backup) => {
              const date = new Date(backup.createdAt);
              const dateStr = date.toLocaleString('zh-CN');
              const sizeStr = backup.size < 1024
                ? `${backup.size} B`
                : `${(backup.size / 1024).toFixed(1)} KB`;

              const isAuto = backup.filename.startsWith('backup-auto-');

              return (
                <div key={backup.filename} className="flex items-center justify-between p-3 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{backup.filename}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                        isAuto
                          ? 'bg-[var(--side-support)] text-[var(--side-support-text)] border-[var(--side-support-line)]'
                          : 'bg-[var(--side-oppose)] text-[var(--side-oppose-text)] border-[var(--side-oppose-line)]'
                      }`}>
                        {isAuto ? '自动' : '手动'}
                      </span>
                    </div>
                    <p className="text-[var(--faint)] text-xs mt-1">{dateStr} | {sizeStr}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <IconButton label="下载" variant="ghost" size="sm" onClick={() => downloadServerBackup(backup.filename)}>
                      <Download className="w-4 h-4" />
                    </IconButton>
                    <IconButton label="恢复" variant="success" size="sm" onClick={() => restoreFromServerBackup(backup.filename)}>
                      <CheckCircle className="w-4 h-4" />
                    </IconButton>
                    <IconButton label="删除" variant="danger" size="sm" onClick={() => deleteServerBackup(backup.filename)}>
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
