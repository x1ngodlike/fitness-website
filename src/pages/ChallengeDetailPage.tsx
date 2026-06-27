import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Trophy, X, DollarSign, User, Lock, Flame } from 'lucide-react';
import { useChallengeStore } from '../store/challengeStore';
import { Challenge } from '../types';

export function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const challenge = useChallengeStore((state) => state.getChallengeById(id || ''));
  const joinChallenge = useChallengeStore((state) => state.joinChallenge);
  const setChallengeResult = useChallengeStore((state) => state.setChallengeResult);
  const isAdminAuthenticated = useChallengeStore((state) => state.isAdminAuthenticated);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [myStakeInput, setMyStakeInput] = useState('100');
  const [selectedSide, setSelectedSide] = useState<'support' | 'oppose' | null>(null);
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  if (!challenge) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">挑战不存在</h2>
          <button onClick={() => navigate('/')} className="text-orange-500 hover:underline">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const hostChar = challenge.hostName.charAt(challenge.hostName.length - 1);
  const supportLabel = `${hostChar}白`;
  const opposeLabel = `${hostChar}黑`;

  const MIN_PARTICIPANT_STAKE = 100;

  const myStake = parseInt(myStakeInput, 10) || 0;

  const handleJoin = async () => {
    if (!participantName || myStake < MIN_PARTICIPANT_STAKE || !selectedSide) {
      setJoinError(`参与金额不能低于${MIN_PARTICIPANT_STAKE}元`);
      return;
    }
    if (joining) return;
    
    setJoining(true);
    
    const savedName = participantName;
    const savedStake = myStakeInput;
    const savedSide = selectedSide;
    
    setShowJoinModal(false);
    setParticipantName('');
    setMyStakeInput('100');
    setSelectedSide(null);
    setJoinError('');
    
    setTimeout(async () => {
      try {
        const ok = await joinChallenge(challenge.id, savedName, myStake, savedSide);
        if (!ok) {
          throw new Error('挑战已封档或已结束，无法参与');
        }
      } catch (e) {
        console.error('Join challenge failed:', e);
        setShowJoinModal(true);
        setParticipantName(savedName);
        setMyStakeInput(savedStake);
        setSelectedSide(savedSide);
        setJoinError((e as Error).message || '参与失败，请重试');
      } finally {
        setJoining(false);
      }
    }, 0);
  };

  const getStatusColor = (status: Challenge['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'completed':
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  const getStatusText = (status: Challenge['status']) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'pending':
        return '待确认';
      case 'completed':
        return '已结束';
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'win':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'lose':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  const isExpired = () => {
    const endDate = new Date(challenge.endDate).getTime();
    return Date.now() > endDate;
  };

  const effectiveStatus: Challenge['status'] =
    challenge.status === 'active' && isExpired() ? 'pending' : challenge.status;

  const totalCount = challenge.participants.length;
  const supportCount = challenge.participants.filter(p => p.side === 'support').length;
  const opposeCount = challenge.participants.filter(p => p.side === 'oppose').length;
  const supportStakes = challenge.participants.filter(p => p.side === 'support').reduce((sum, p) => sum + p.stake, 0);
  const opposeStakes = challenge.participants.filter(p => p.side === 'oppose').reduce((sum, p) => sum + p.stake, 0);

  // 奖池计算
  const calculatePayout = () => {
    if (challenge.status !== 'completed') return null;

    const winners = challenge.participants.filter(p => p.result === 'win');
    const losers = challenge.participants.filter(p => p.result === 'lose');
    const winnerCount = winners.length;

    if (winnerCount === 0) {
      return {
        hostSuccess: false,
        totalLoserStakes: 0,
        hostPayout: 0,
        totalPayout: 0,
        winnerCount: 0,
        winnerAmounts: {} as Record<string, number>,
      };
    }

    const totalWinnerStakes = winners.reduce((sum, p) => sum + p.stake, 0);
    const totalLoserStakes = losers.reduce((sum, p) => sum + p.stake, 0);

    const hostSuccess = winners.some(p => p.side === 'support');

    let totalPayout = 0;
    let hostPayout = 0;

    if (hostSuccess) {
      totalPayout = totalLoserStakes;
      hostPayout = 0;
    } else {
      const needed = totalWinnerStakes - totalLoserStakes;

      if (needed > 0) {
        const neededCapped = Math.min(needed, challenge.maxPayout);
        hostPayout = Math.max(neededCapped, challenge.minStake);
      } else {
        hostPayout = challenge.minStake;
      }

      totalPayout = totalLoserStakes + hostPayout;
    }

    const winnerAmounts: Record<string, number> = {};
    winners.forEach((w) => {
      const ratio = totalWinnerStakes > 0 ? w.stake / totalWinnerStakes : 0;
      winnerAmounts[w.id] = Math.floor(totalPayout * ratio);
    });

    return {
      hostSuccess,
      totalLoserStakes,
      hostPayout,
      totalPayout,
      winnerCount,
      winnerAmounts,
    };
  };

  const payout = calculatePayout();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
  };

  const getParticipantJoinTime = (participant: { joinTime?: string; createdAt: number }) => {
    if (participant.joinTime) {
      const [, month, day] = participant.joinTime.split('-');
      return `${parseInt(month)}月${parseInt(day)}日`;
    }
    return formatTime(participant.createdAt);
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="relative aspect-[4/1] overflow-hidden">
            <img
              src={challenge.coverImage}
              alt={challenge.theme}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="absolute top-4 right-4 flex flex-wrap gap-2 justify-end">
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(effectiveStatus)} inline-flex items-center gap-1`}>
                {getStatusText(effectiveStatus)}
              </span>
              {challenge.status === 'active' && challenge.isBlocked && (
                <span className="px-3 py-1 text-sm font-medium rounded-full border bg-red-500/10 text-red-400 border-red-500/20 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  已封档
                </span>
              )}
            </div>
          </div>

          <div className="p-6 border-b border-neutral-800">
            <h1 className="text-xl font-bold text-white mb-2">{challenge.theme}</h1>
            <p className="text-neutral-400 text-sm mb-2">{challenge.goal}</p>

            <div className="flex items-center gap-2 text-orange-500 font-medium text-sm mb-2">
              <span>发起人：{challenge.hostName}</span>
            </div>

            <div className="flex items-center gap-4 text-neutral-500 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{challenge.startDate} ~ {challenge.endDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{challenge.participants.length}人</span>
              </div>
            </div>

            {challenge.status === 'active' && !isExpired() && (
              <div className="mt-4 p-3 bg-neutral-800/50 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">剩余时间</span>
                  <span className="text-white font-bold">
                    {Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} 天
                  </span>
                </div>
              </div>
            )}

            {effectiveStatus === 'pending' && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-400 text-sm font-medium">⏳ 挑战时间已到，等待确认结果...</p>
              </div>
            )}

            {/* 资金池统计 */}
            <div className="mt-4">
              <h3 className="text-base font-bold text-white mb-3">资金池统计</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-800/50 rounded-xl">
                  <p className="text-sm text-neutral-500 mb-2">挑战者资金</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 text-sm">最高赔付</span>
                      <span className="text-white font-bold">{challenge.maxPayout}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 text-sm">最低赔付</span>
                      <span className="text-white font-bold">{challenge.minStake}</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-xl">
                  <p className="text-sm text-neutral-500 mb-2">参与者资金</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 text-sm">{supportLabel}</span>
                      <span className="text-white font-bold">{supportStakes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-400 text-sm">{opposeLabel}</span>
                      <span className="text-white font-bold">{opposeStakes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 结算信息 */}
          {payout && (
            <div className="p-5 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white mb-3">🏆 奖金结算</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-neutral-800/50 rounded-xl p-3">
                  <p className="text-xs text-neutral-500 mb-1">挑战者</p>
                  <p className={`text-lg font-bold ${payout.hostSuccess ? 'text-green-400' : 'text-red-400'}`}>
                    {payout.hostSuccess ? '✓ 成功' : '✗ 失败'}
                  </p>
                </div>
                <div className="bg-neutral-800/50 rounded-xl p-3">
                  <p className="text-xs text-neutral-500 mb-1">赢家人数</p>
                  <p className="text-lg font-bold text-green-400">{payout.winnerCount}人</p>
                </div>
                <div className="bg-neutral-800/50 rounded-xl p-3">
                  <p className="text-xs text-neutral-500 mb-1">奖池总额</p>
                  <p className="text-lg font-bold text-white">{payout.totalPayout}</p>
                </div>
                <div className="bg-neutral-800/50 rounded-xl p-3">
                  <p className="text-xs text-neutral-500 mb-1">挑战者付出</p>
                  <p className={`text-lg font-bold ${payout.hostPayout > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                    {payout.hostPayout}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 参与者列表 */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                  <Users className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  参与者列表
                  {totalCount > 0 && (
                    <span className="text-sm font-normal text-neutral-500">
                      {supportLabel}{supportCount} {opposeLabel}{opposeCount}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  {challenge.status === 'active' && !challenge.isBlocked && !isExpired() && (
                    <button
                      onClick={() => {
                        setShowJoinModal(true);
                        setJoinError('');
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all"
                    >
                      立即参与
                    </button>
                  )}
                  {challenge.isBlocked && challenge.status === 'active' && (
                    <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
                      <Lock className="w-4 h-4" />
                      <span>已封档，暂停参与</span>
                    </div>
                  )}
                </div>
              </div>

            {/* 管理员设置挑战结果 */}
            {isAdminAuthenticated && effectiveStatus === 'pending' && (
              <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <h3 className="text-orange-400 text-sm font-medium mb-2">管理员：确认挑战结果</h3>
                <p className="text-neutral-400 text-xs mb-2">挑战时间已到，请确认挑战者是否成功：</p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => { await setChallengeResult(challenge.id, 'success'); }}
                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-medium transition-all"
                  >
                    ✓ 成功
                  </button>
                  <button
                    onClick={async () => { await setChallengeResult(challenge.id, 'failed'); }}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-all"
                  >
                    ✗ 失败
                  </button>
                </div>
              </div>
            )}

            {challenge.participants.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-3xl mb-2 block">🏋️</span>
                <p className="text-neutral-500 text-sm">还没有人参与，成为第一个参与者吧！</p>
              </div>
            ) : (
              <div className="space-y-2">
                {challenge.participants.map((participant) => {
                  const isWinner = participant.result === 'win';
                  const amountWon = payout?.winnerAmounts[participant.id] || 0;
                  const amountLost = participant.result === 'lose' ? participant.stake : 0;

                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {participant.participantName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{participant.participantName}</p>
                          <p className="text-xs text-neutral-500">
                            {getParticipantJoinTime(participant)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {challenge.status === 'completed' && (
                          <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${getResultBadge(participant.result)}`}>
                            {isWinner ? (
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" /> +{amountWon}
                              </span>
                            ) : participant.result === 'lose' ? (
                              <span className="flex items-center gap-1">
                                <X className="w-3 h-3" /> -{amountLost}
                              </span>
                            ) : (
                              '待定'
                            )}
                          </span>
                        )}
                        <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                          participant.side === 'support'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {participant.side === 'support' ? supportLabel : opposeLabel}
                        </span>
                        <span className="px-3 py-1 text-xs font-bold text-orange-400 bg-orange-500/10 rounded-lg border border-orange-500/20">
                          {participant.stake}元
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 参与挑战模态框 */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">参与挑战</h3>
            <p className="text-neutral-400 mb-6">
              填写信息并选择你的态度
            </p>

            {joinError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {joinError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-white font-medium mb-3">
                <User className="w-4 h-4 inline mr-2 text-orange-500" />
                你的姓名
              </label>
              <input
                type="text"
                placeholder="输入你的姓名..."
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                <Flame className="w-4 h-4 inline mr-2 text-orange-500" />
                你的押金 <span className="text-neutral-500 text-sm">(最低{MIN_PARTICIPANT_STAKE})</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[100, 200, 500, 1000, 2000].filter((v,i,a) => v >= MIN_PARTICIPANT_STAKE && a.indexOf(v) === i).map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setMyStakeInput(String(amount))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      myStakeInput === String(amount)
                        ? 'bg-orange-500 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {amount}
                  </button>
                ))}
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="自定义"
                  value={myStakeInput}
                  onChange={(e) => setMyStakeInput(e.target.value)}
                  className="flex-1 min-w-24 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* 态度选择 */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">选择你的态度</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedSide('support')}
                  className={`p-4 rounded-xl border-2 border-solid transition-all ${
                    selectedSide === 'support'
                      ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500/30'
                      : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  <span className={`block text-base font-bold mb-1 ${selectedSide === 'support' ? 'text-green-400' : 'text-neutral-400'}`}>
                    {supportLabel}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    认为 {challenge.hostName} 能成功
                  </span>
                </button>
                <button
                  onClick={() => setSelectedSide('oppose')}
                  className={`p-4 rounded-xl border-2 border-solid transition-all ${
                    selectedSide === 'oppose'
                      ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/30'
                      : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  <span className={`block text-base font-bold mb-1 ${selectedSide === 'oppose' ? 'text-red-400' : 'text-neutral-400'}`}>
                    {opposeLabel}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    认为 {challenge.hostName} 会失败
                  </span>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinError('');
                }}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleJoin}
                disabled={!participantName || myStake < MIN_PARTICIPANT_STAKE || !selectedSide}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  participantName && myStake >= MIN_PARTICIPANT_STAKE && selectedSide
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                }`}
              >
                确认参与
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
