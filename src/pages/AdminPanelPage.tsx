import { useState, useMemo } from 'react';
import { Shield, Edit2, CheckCircle, X, Lock, Unlock, Users, Save, Trash2, UserX } from 'lucide-react';
import { useChallengeStore } from '../store/challengeStore';
import { Challenge, Participant } from '../types';

type EffectiveStatus = 'active' | 'pending' | 'completed';

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

  const sortedChallenges = useMemo(() => {
    return [...challenges].sort((a, b) => {
      const statusA = getEffectiveStatus(a);
      const statusB = getEffectiveStatus(b);
      const order: Record<EffectiveStatus, number> = { pending: 0, active: 1, completed: 2 };
      if (order[statusA] !== order[statusB]) return order[statusA] - order[statusB];
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
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
      const response = await fetch('/api/upload', {
        method: 'POST',
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

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">管理面板</h1>
          </div>
          <p className="text-neutral-500">管理所有挑战：编辑内容、封档参与、确认结果、修改参与者信息</p>
        </div>

        <div className="space-y-4">
          {sortedChallenges.map((challenge) => {
            const effectiveStatus = getEffectiveStatus(challenge);

            return (
              <div key={challenge.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                {editingChallenge === challenge.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
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
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-bold text-white">{challenge.theme}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(effectiveStatus)}`}>
                            {getStatusText(effectiveStatus)}
                          </span>
                          {challenge.isBlocked && challenge.status === 'active' && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full border bg-red-500/10 text-red-400 border-red-500/20 inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              已封档
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-500 text-sm">{challenge.goal}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-neutral-500 mb-2 flex-wrap">
                      <span className="text-orange-500 font-medium">发起人：{challenge.hostName}</span>
                      <span>{challenge.startDate} ~ {challenge.endDate}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {challenge.participants.length} 人参与
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-4">
                      <span className="text-neutral-400">
                        通赔：<span className="text-white font-medium">{challenge.maxPayout}</span>
                      </span>
                      <span className="text-neutral-400">
                        底仓：<span className="text-white font-medium">{challenge.minStake}</span>
                      </span>
                    </div>

                    {challenge.participants.length > 0 && (
                      <div className="mb-4">
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
                                  <>
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
                                  </>
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
