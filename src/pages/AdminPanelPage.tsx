import { useState, useMemo, useEffect } from 'react';
import { Shield, Edit2, CheckCircle, X, Lock, Unlock, Users, Save, Trash2, UserX, Download, Upload, AlertTriangle, Menu, ChevronDown, ChevronRight, Settings, Trophy, Globe, MoreVertical, Dumbbell, Plus, LogOut, FlaskConical, Rocket } from 'lucide-react';
import { useChallengeStore, loadToken } from '../store/challengeStore';
import { Challenge, Participant } from '../types';

type EffectiveStatus = 'active' | 'pending' | 'completed';
type TabType = 'challenges' | 'settings';

function getEffectiveStatus(challenge: Challenge): EffectiveStatus {
  if (challenge.status === 'completed') return 'completed';
  const endDate = new Date(challenge.endDate).getTime();
  if (challenge.status === 'active' && Date.now() > endDate) return 'pending';
  return 'active';
}

export function AdminPanelPage() {
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

  const getStatusColor = (status: EffectiveStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'completed':
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
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

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* 侧边栏 */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-neutral-900 border-r border-neutral-800 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ WebkitTapHighlightColor: 'transparent' }}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-orange-500" />
              <h1 className="text-lg font-bold text-white">管理面板</h1>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-neutral-800 rounded-lg"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
          
          <nav className="flex-1 p-3 space-y-1">
            <button
              onClick={() => { setActiveTab('challenges'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                activeTab === 'challenges' 
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white border border-transparent'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="font-medium">挑战信息</span>
            </button>
            
            <button
              onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                activeTab === 'settings' 
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white border border-transparent'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">系统设置</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* 遮罩层 */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" style={{ WebkitTapHighlightColor: 'transparent' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* 主内容区 */}
      <main className="flex-1 min-h-screen">
        {/* 移动端顶部导航 */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800">
          <div className="px-4 h-16 flex items-center justify-between">
            {/* 左侧：Logo 返回首页 */}
            <button 
              onClick={() => window.location.href = '/'} 
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">健康</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">星球</span>
              </span>
            </button>
            
            {/* 右侧：菜单按钮 */}
            <button
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setSidebarOpen(false); }}
              className="p-2 text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* 移动端菜单 */}
          {mobileMenuOpen && (
            <div className="bg-neutral-900 border-t border-neutral-800">
              <div className="px-4 py-4 space-y-3">
                {/* 环境切换 */}
                <div className="flex items-center gap-2 px-1 py-1 bg-neutral-800 rounded-lg">
                  <button
                    onClick={() => setEnvMode('test')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      envMode === 'test'
                        ? 'bg-green-500/20 text-green-400'
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    <FlaskConical className="w-4 h-4" />
                    测试
                  </button>
                  <button
                    onClick={() => setEnvMode('production')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      envMode === 'production'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    <Rocket className="w-4 h-4" />
                    正式
                  </button>
                </div>

                <button
                  onClick={() => { setMobileMenuOpen(false); window.location.href = '/create'; }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all"
                >
                  <Plus className="w-5 h-5" />
                  创建挑战
                </button>

                <button
                  onClick={() => { setMobileMenuOpen(false); setActiveTab('challenges'); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-all"
                >
                  <Trophy className="w-5 h-5" />
                  挑战管理
                </button>

                <button
                  onClick={() => { setMobileMenuOpen(false); setActiveTab('settings'); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-all"
                >
                  <Settings className="w-5 h-5" />
                  系统设置
                </button>

                <button
                  onClick={() => { 
                    logoutAdmin();
                    setMobileMenuOpen(false);
                    window.location.href = '/';
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-all border border-red-500/20"
                >
                  <LogOut className="w-5 h-5" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </header>

        {/* 内容区域 */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8 pt-20 lg:pt-0">
          {/* 挑战信息 */}
          {activeTab === 'challenges' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">挑战管理</h2>
                  <p className="text-neutral-500 text-sm mt-1">共 {filteredChallenges.length} 个挑战</p>
                </div>
              </div>

              {/* 筛选栏 */}
              <div className="flex flex-wrap gap-2 p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
                {statusTabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === tab.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 挑战列表 */}
              <div className="space-y-3">
                {filteredChallenges.map((challenge) => {
                  const effectiveStatus = getEffectiveStatus(challenge);
                  const isExpanded = expandedChallenges.has(challenge.id);

                  return (
                    <div key={challenge.id} className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                      {/* 挑战头部 */}
                      <button
                        onClick={() => toggleChallenge(challenge.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-neutral-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-bold text-white truncate">{challenge.theme}</h3>
                              <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(effectiveStatus)}`}>
                                {getStatusText(effectiveStatus)}
                              </span>
                              {challenge.isBlocked && challenge.status === 'active' && (
                                <span className="px-2.5 py-1 text-xs font-medium rounded-full border bg-red-500/10 text-red-400 border-red-500/20">
                                  已封档
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1 flex-wrap">
                              <span className="text-orange-400">{challenge.hostName}</span>
                              <span>{challenge.startDate} ~ {challenge.endDate}</span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {challenge.participants.length}人参与
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* 展开内容 */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4 border-t border-neutral-800">
                          {editingChallenge === challenge.id ? (
                            <div className="space-y-4 pt-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">编辑挑战</h3>
                                <button
                                  onClick={() => setEditingChallenge(null)}
                                  className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                                >
                                  <X className="w-5 h-5 text-neutral-400" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm text-neutral-400 mb-1 block">挑战主题</label>
                                  <input
                                    type="text"
                                    value={editFormData.theme}
                                    onChange={(e) => setEditFormData({ ...editFormData, theme: e.target.value })}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-neutral-400 mb-1 block">挑战者姓名</label>
                                  <input
                                    type="text"
                                    value={editFormData.hostName}
                                    onChange={(e) => setEditFormData({ ...editFormData, hostName: e.target.value })}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="text-sm text-neutral-400 mb-1 block">挑战目标</label>
                                  <textarea
                                    value={editFormData.goal}
                                    onChange={(e) => setEditFormData({ ...editFormData, goal: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500 resize-none"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="text-sm text-neutral-400 mb-1 block">封面图片</label>
                                  <input
                                    type="text"
                                    value={editFormData.coverImage}
                                    onChange={(e) => setEditFormData({ ...editFormData, coverImage: e.target.value })}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500 mb-2"
                                    placeholder="图片URL或点击下方按钮上传"
                                  />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-neutral-400 mb-1 block">开始日期</label>
                                  <input
                                    type="date"
                                    value={editFormData.startDate}
                                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-neutral-400 mb-1 block">结束日期</label>
                                  <input
                                    type="date"
                                    value={editFormData.endDate}
                                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-neutral-400 mb-1 block">通赔金额</label>
                                  <input
                                    type="number"
                                    value={editFormData.maxPayout}
                                    onChange={(e) => setEditFormData({ ...editFormData, maxPayout: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-neutral-400 mb-1 block">底仓金额</label>
                                  <input
                                    type="number"
                                    min="200"
                                    value={editFormData.minStake}
                                    onChange={(e) => setEditFormData({ ...editFormData, minStake: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                              </div>

                              <button
                                onClick={saveEdit}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all"
                              >
                                保存修改
                              </button>
                            </div>
                          ) : (
                            <div className="pt-4 space-y-4">
                              <p className="text-neutral-400 text-sm">{challenge.goal}</p>

                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-neutral-400">
                                  通赔：<span className="text-white font-medium">{challenge.maxPayout}</span>
                                </span>
                                <span className="text-neutral-400">
                                  底仓：<span className="text-white font-medium">{challenge.minStake}</span>
                                </span>
                              </div>

                              {challenge.participants.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-neutral-400 mb-3">参与者列表</h4>
                                  <div className="space-y-2">
                                    {challenge.participants.map((participant) => {
                                      const isEditing =
                                        editingParticipant?.challengeId === challenge.id &&
                                        editingParticipant?.participant.id === participant.id;
                                      return (
                                        <div key={participant.id} className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg gap-2">
                                          {isEditing ? (
                                            <div className="flex items-center gap-2 flex-wrap flex-1">
                                              <input
                                                type="text"
                                                value={editParticipantData.participantName}
                                                onChange={(e) => setEditParticipantData({ ...editParticipantData, participantName: e.target.value })}
                                                className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                                                placeholder="姓名"
                                              />
                                              <input
                                                type="number"
                                                min="100"
                                                value={editParticipantData.stake}
                                                onChange={(e) => setEditParticipantData({ ...editParticipantData, stake: Number(e.target.value) })}
                                                className="w-24 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                                                placeholder="金额"
                                              />
                                              <select
                                                value={editParticipantData.side}
                                                onChange={(e) => setEditParticipantData({ ...editParticipantData, side: e.target.value as 'support' | 'oppose' })}
                                                className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                                              >
                                                <option value="support">白（支持）</option>
                                                <option value="oppose">黑（反对）</option>
                                              </select>
                                              <input
                                                type="date"
                                                value={editParticipantData.joinTime}
                                                onChange={(e) => setEditParticipantData({ ...editParticipantData, joinTime: e.target.value })}
                                                className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                                              />
                                              <button
                                                onClick={saveParticipantEdit}
                                                className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                                              >
                                                <Save className="w-4 h-4" />
                                              </button>
                                              <button
                                                onClick={() => setEditingParticipant(null)}
                                                className="p-2 hover:bg-neutral-700 text-neutral-400 rounded-lg transition-colors"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-between gap-2 flex-1">
                                              <div className="flex items-center gap-3 flex-wrap">
                                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                  {participant.participantName.charAt(0)}
                                                </div>
                                                <span className="text-white text-sm">{participant.participantName}</span>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                                                  participant.side === 'support'
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                }`}>
                                                  {challenge.hostName.charAt(challenge.hostName.length - 1)}
                                                  {participant.side === 'support' ? '白' : '黑'}
                                                </span>
                                                <span className="text-xs text-neutral-500">{participant.stake} 元</span>
                                                {participant.joinTime && (
                                                  <span className="text-xs text-neutral-500">| {participant.joinTime}</span>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <button
                                                  onClick={() => startEditParticipant(challenge.id, participant)}
                                                  className="p-2 hover:bg-neutral-700 text-neutral-400 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                  <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={async () => {
                                                    if (confirm(`确定要删除参与者「${participant.participantName}」吗？此操作不可撤销。`)) {
                                                      await deleteParticipant(challenge.id, participant.id);
                                                    }
                                                  }}
                                                  className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                  <UserX className="w-4 h-4" />
                                                </button>
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
                                <button
                                  onClick={() => startEdit(challenge)}
                                  className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  编辑
                                </button>
                                {challenge.status !== 'completed' && (
                                  <button
                                    onClick={async () => { await toggleBlock(challenge.id); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                                      challenge.isBlocked
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                    }`}
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
                                  </button>
                                )}
                                {(effectiveStatus === 'active' || effectiveStatus === 'pending') && (
                                  <>
                                    <button
                                      onClick={async () => { await setChallengeResult(challenge.id, 'success'); }}
                                      className="flex items-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm font-medium transition-all border border-green-500/20"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      标记挑战者成功
                                    </button>
                                    <button
                                      onClick={async () => { await setChallengeResult(challenge.id, 'failed'); }}
                                      className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-all border border-red-500/20"
                                    >
                                      <X className="w-4 h-4" />
                                      标记挑战者失败
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={async () => {
                                    if (confirm(`确定要删除挑战「${challenge.theme}」吗？此操作不可撤销。`)) {
                                      await deleteChallenge(challenge.id);
                                    }
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  删除挑战
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredChallenges.length === 0 && (
                  <div className="text-center py-12 bg-neutral-900/50 rounded-xl border border-neutral-800">
                    <p className="text-neutral-500">暂无挑战数据</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 系统设置 */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">系统设置</h2>
                <p className="text-neutral-500 text-sm mt-1">管理网站配置和数据备份</p>
              </div>

              {backupMessage && (
                <div className={`p-4 rounded-xl text-sm ${
                  backupMessage.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {backupMessage.text}
                </div>
              )}

              {/* 官网地址 */}
              <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-white">官网地址设置</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-neutral-400 mb-1 block">官网地址</label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={saveSettings}
                    className={`self-end px-6 py-2.5 rounded-lg font-medium transition-all ${
                      settingsSaved
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {settingsSaved ? '已保存' : '保存地址'}
                  </button>
                </div>
                <p className="text-neutral-500 text-sm mt-3">设置后将在每日简报中显示此地址</p>
              </div>

              {/* 数据备份 */}
              <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
                <h3 className="font-bold text-white mb-4">数据备份与恢复</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 本地备份 */}
                  <div className="p-4 bg-neutral-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-neutral-400 mb-3">本地操作</h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleBackup}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all"
                      >
                        <Download className="w-4 h-4" />
                        下载备份到本地
                      </button>
                      <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all cursor-pointer">
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

                  {/* 服务器备份 */}
                  <div className="p-4 bg-neutral-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-neutral-400 mb-3">服务器操作</h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={createServerBackup}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all"
                      >
                        <Download className="w-4 h-4" />
                        创建服务器备份
                      </button>
                      <button
                        onClick={() => { setShowServerBackups(true); loadServerBackups(); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        从服务器备份恢复
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>自动备份：每天凌晨2点自动创建，保留最近7天</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 服务器备份列表弹窗 */}
      {showServerBackups && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-500" />
                服务器备份管理
              </h3>
              <button
                onClick={() => setShowServerBackups(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>自动备份：每天凌晨2点创建，保留最近7天</span>
              </p>
              <p className="text-blue-400 text-sm mt-1">
                <span>手动备份：需手动创建，不会被自动清理</span>
              </p>
            </div>

            {isLoadingBackups ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : serverBackups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">暂无服务器备份</p>
                <button
                  onClick={createServerBackup}
                  className="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium"
                >
                  创建第一个备份
                </button>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1">
                {serverBackups.map((backup) => {
                  const date = new Date(backup.createdAt);
                  const dateStr = date.toLocaleString('zh-CN');
                  const sizeStr = backup.size < 1024 
                    ? `${backup.size} B` 
                    : `${(backup.size / 1024).toFixed(1)} KB`;
                  
                  const isAuto = backup.filename.startsWith('backup-auto-');

                  return (
                    <div key={backup.filename} className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">{backup.filename}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            isAuto 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {isAuto ? '自动' : '手动'}
                          </span>
                        </div>
                        <p className="text-neutral-500 text-xs">{dateStr} | {sizeStr}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadServerBackup(backup.filename)}
                          className="p-2 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors"
                          title="下载"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => restoreFromServerBackup(backup.filename)}
                          className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                          title="恢复"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteServerBackup(backup.filename)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}