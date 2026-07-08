import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Trophy, X, User, Lock, Flame, Info } from 'lucide-react';
import { useChallengeStore } from '../store/challengeStore';
import { Challenge } from '../types';
import { FALLBACK_COVER } from '../data/placeholderImages';
import { Button, Input, Badge, Modal, StatusPill, getEffectiveStatus } from '../components/ui';

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
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2">挑战不存在</h2>
          <Button variant="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const hostChar = challenge.hostName.charAt(challenge.hostName.length - 1);
  const supportLabel = `${hostChar}白`;
  const opposeLabel = `${hostChar}黑`;

  const MIN_PARTICIPANT_STAKE = 100;

  const myStake = parseInt(myStakeInput, 10) || 0;
  const canJoin = !!participantName && myStake >= MIN_PARTICIPANT_STAKE && !!selectedSide;

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

  const effectiveStatus = getEffectiveStatus(challenge);

  const isExpired = () => {
    const endDate = new Date(challenge.endDate).getTime();
    return Date.now() > endDate;
  };

  const totalCount = challenge.participants.length;
  const supportCount = challenge.participants.filter((p) => p.side === 'support').length;
  const opposeCount = challenge.participants.filter((p) => p.side === 'oppose').length;
  const supportStakes = challenge.participants
    .filter((p) => p.side === 'support')
    .reduce((sum, p) => sum + p.stake, 0);
  const opposeStakes = challenge.participants
    .filter((p) => p.side === 'oppose')
    .reduce((sum, p) => sum + p.stake, 0);

  const totalStakes = supportStakes + opposeStakes;
  const hasStakes = totalStakes > 0;
  const supportPct = hasStakes ? Math.round((supportStakes / totalStakes) * 100) : 0;
  const opposePct = hasStakes ? 100 - supportPct : 0;

  // 奖池计算
  const calculatePayout = () => {
    if (challenge.status !== 'completed') return null;

    const winners = challenge.participants.filter((p) => p.result === 'win');
    const losers = challenge.participants.filter((p) => p.result === 'lose');
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

    const hostSuccess = winners.some((p) => p.side === 'support');

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
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 -ml-2">
          <ArrowLeft className="w-5 h-5" />
          返回
        </Button>

        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
          {/* 英雄封面 — 与首页卡片 / 小作文弹窗同源 */}
          <div className="relative aspect-[21/9] overflow-hidden">
            <img
              src={challenge.coverImage}
              alt={challenge.theme}
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_COVER;
                e.currentTarget.onerror = null;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-black/25 to-black/15" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
              {challenge.status === 'active' && challenge.isBlocked && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                  <Lock className="h-3 w-3" />
                  封档
                </span>
              )}
              <StatusPill status={effectiveStatus} />
            </div>
          </div>

          {/* 内容区 — 全新语义层级 */}
          <div className="space-y-7 p-5 sm:p-6">
            {/* 标题区 · 挑战目标 */}
            <div>
              <h1 className="font-display text-2xl font-bold leading-snug text-[var(--text)]">
                {challenge.theme}
              </h1>
              <p className="mt-1.5 text-xs text-[var(--accent)]">由 @{challenge.hostName} 发起</p>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--text)]">{challenge.goal}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[var(--faint)]" />
                  {challenge.startDate} ~ {challenge.endDate}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[var(--faint)]" />
                  {totalCount} 人参与
                </span>
              </div>

              {challenge.status === 'active' && !isExpired() && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)]">
                    <Calendar className="h-4 w-4" />
                    剩余时间
                  </span>
                  <span className="text-sm font-bold text-[var(--text)]">
                    {Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} 天
                  </span>
                </div>
              )}

              {effectiveStatus === 'pending' && (
                <div className="mt-4 rounded-xl border border-[var(--warn-line)] bg-[var(--warn-soft)] px-4 py-3 text-sm font-medium text-[var(--warn)]">
                  ⏳ 挑战时间已到，等待确认结果...
                </div>
              )}
            </div>

            {/* 挑战者保障 */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--text)]">
                <span className="h-4 w-1 rounded-full bg-[var(--accent)]" />
                挑战者保障
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--surface-2)] p-4">
                  <p className="mb-2 text-xs text-[var(--faint)]">挑战的最高赔付</p>
                  <p className="text-xl font-bold text-[var(--text)]">{challenge.maxPayout}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-4">
                  <p className="mb-2 text-xs text-[var(--faint)]">挑战的最低赔付</p>
                  <p className="text-xl font-bold text-[var(--text)]">{challenge.minStake}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-[var(--info-line)] bg-[var(--info-soft)] p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--info)]">
                  <Info className="h-4 w-4" />
                  挑战者规则
                </p>
                <div className="space-y-2 text-xs leading-relaxed text-[var(--muted)]">
                  <p>
                    <span className="font-semibold text-[var(--text)]">挑战成功：</span>
                    白粉与挑战者按比例瓜分黑粉押金池（挑战者享有最低 200 份额保底）。
                  </p>
                  <p>
                    <span className="font-semibold text-[var(--text)]">挑战失败：</span>
                    黑粉按比例瓜分白粉押金池。
                  </p>
                  <p className="pl-3">
                    · 若白粉池 ≤ 黑粉池：挑战者补齐差额（上限为最高赔付额）；
                  </p>
                  <p className="pl-3">
                    · 若白粉池 ≥ 黑粉池：挑战者向白粉池补充最低赔付额。
                  </p>
                </div>
              </div>
            </section>

            {/* 多空对决 — 核心张力可视化 */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--text)]">
                <span className="h-4 w-1 rounded-full bg-[var(--up)]" />
                多空对决
              </h2>

              {hasStakes ? (
                <>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div className="h-full bg-[var(--up)] transition-all duration-500" style={{ width: `${supportPct}%` }} />
                    <div className="h-full bg-[var(--down)] transition-all duration-500" style={{ width: `${opposePct}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs font-medium text-[var(--muted)]">
                    <span className="text-[var(--up)]">{supportLabel} {supportPct}%</span>
                    <span className="text-[var(--down)]">{opposeLabel} {opposePct}%</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[var(--up-line)] bg-[var(--up-soft)] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[var(--up)]" />
                        <span className="text-sm font-semibold text-[var(--up)]">{supportLabel}</span>
                      </div>
                      <p className="text-2xl font-bold leading-none text-[var(--text)]">{supportStakes}</p>
                      <p className="mt-1 text-xs text-[var(--faint)]">押注额 · {supportCount} 人</p>
                    </div>
                    <div className="rounded-xl border border-[var(--down-line)] bg-[var(--down-soft)] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[var(--down)]" />
                        <span className="text-sm font-semibold text-[var(--down)]">{opposeLabel}</span>
                      </div>
                      <p className="text-2xl font-bold leading-none text-[var(--text)]">{opposeStakes}</p>
                      <p className="mt-1 text-xs text-[var(--faint)]">押注额 · {opposeCount} 人</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] px-4 py-8 text-center text-sm text-[var(--faint)]">
                  还没有人押注，成为第一个下注的人吧
                </div>
              )}
            </section>

            {/* 结算信息（红涨绿跌） */}
            {payout && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--text)]">
                  <span className="h-4 w-1 rounded-full bg-[var(--accent)]" />
                  🏆 奖金结算
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl bg-[var(--surface-2)] p-3">
                    <p className="mb-1 text-xs text-[var(--faint)]">挑战者</p>
                    <p className={`text-lg font-bold ${payout.hostSuccess ? 'text-[var(--up)]' : 'text-[var(--down)]'}`}>
                      {payout.hostSuccess ? '✓ 成功' : '✗ 失败'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--surface-2)] p-3">
                    <p className="mb-1 text-xs text-[var(--faint)]">赢家人数</p>
                    <p className="text-lg font-bold text-[var(--text)]">{payout.winnerCount}人</p>
                  </div>
                  <div className="rounded-xl bg-[var(--surface-2)] p-3">
                    <p className="mb-1 text-xs text-[var(--faint)]">奖池总额</p>
                    <p className="text-lg font-bold text-[var(--text)]">{payout.totalPayout}</p>
                  </div>
                  <div className="rounded-xl bg-[var(--surface-2)] p-3">
                    <p className="mb-1 text-xs text-[var(--faint)]">挑战者付出</p>
                    <p className={`text-lg font-bold ${payout.hostPayout > 0 ? 'text-[var(--down)]' : 'text-[var(--up)]'}`}>
                      {payout.hostPayout}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* 参与者列表 */}
          <div className="border-t border-[var(--line)] p-5 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text)]">
                <span className="h-5 w-1 rounded-full bg-[var(--accent)]" />
                <span className="flex items-center gap-2">
                  参与者列表
                  {totalCount > 0 && (
                    <span className="text-sm font-normal text-[var(--faint)]">
                      {supportLabel}
                      {supportCount} {opposeLabel}
                      {opposeCount}
                    </span>
                  )}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                {challenge.status === 'active' && !challenge.isBlocked && !isExpired() && (
                  <Button variant="primary" onClick={() => { setShowJoinModal(true); setJoinError(''); }}>
                    立即参与
                  </Button>
                )}
                {challenge.isBlocked && challenge.status === 'active' && (
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--bad-line)] bg-[var(--bad-soft)] px-4 py-2 text-sm text-[var(--bad)]">
                    <Lock className="h-4 w-4" />
                    <span>已封档，暂停参与</span>
                  </div>
                )}
              </div>
            </div>

            {isAdminAuthenticated && effectiveStatus === 'pending' && (
              <div className="mb-4 rounded-xl border border-[var(--accent-line)] bg-[var(--accent-soft)] p-3">
                <h3 className="mb-2 text-sm font-medium text-[var(--accent)]">管理员：确认挑战结果</h3>
                <p className="mb-2 text-xs text-[var(--muted)]">挑战时间已到，请确认挑战者是否成功：</p>
                <div className="flex gap-2">
                  <Button variant="success" size="sm" onClick={async () => { await setChallengeResult(challenge.id, 'success'); }}>
                    ✓ 成功
                  </Button>
                  <Button variant="danger" size="sm" onClick={async () => { await setChallengeResult(challenge.id, 'failed'); }}>
                    ✗ 失败
                  </Button>
                </div>
              </div>
            )}

            {challenge.participants.length === 0 ? (
              <div className="py-6 text-center">
                <span className="mb-2 block text-3xl">🏋️</span>
                <p className="text-sm text-[var(--faint)]">还没有人参与，成为第一个参与者吧！</p>
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
                      className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] font-bold text-sm text-white">
                          {participant.participantName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text)]">{participant.participantName}</p>
                          <p className="text-xs text-[var(--faint)]">{getParticipantJoinTime(participant)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {challenge.status === 'completed' && (
                          <Badge
                            variant={
                              participant.result === 'win'
                                ? 'success'
                                : participant.result === 'lose'
                                ? 'danger'
                                : 'neutral'
                            }
                            size="sm"
                          >
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
                          </Badge>
                        )}
                        <Badge variant={participant.side === 'support' ? 'support' : 'oppose'} size="sm">
                          {participant.side === 'support' ? supportLabel : opposeLabel}
                        </Badge>
                        <Badge variant="accent" size="sm">
                          {participant.stake}元
                        </Badge>
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
      <Modal
        open={showJoinModal}
        onClose={() => { setShowJoinModal(false); setJoinError(''); }}
        title="参与挑战"
        footer={
          <>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => { setShowJoinModal(false); setJoinError(''); }}
            >
              取消
            </Button>
            <Button variant="primary" fullWidth disabled={!canJoin} onClick={handleJoin}>
              确认参与
            </Button>
          </>
        }
      >
        <p className="mb-6 text-sm text-[var(--muted)]">填写信息并选择你的态度</p>

        {joinError && (
          <div className="mb-4 rounded-xl border border-[var(--bad-line)] bg-[var(--bad-soft)] p-3 text-sm text-[var(--bad)]">
            {joinError}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-3 block font-medium text-[var(--text)]">
            <User className="mr-2 inline h-4 w-4 text-[var(--accent)]" />
            你的姓名
          </label>
          <Input
            type="text"
            placeholder="输入你的姓名..."
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="mb-3 block font-medium text-[var(--text)]">
            <Flame className="mr-2 inline h-4 w-4 text-[var(--accent)]" />
            你的押金 <span className="text-sm text-[var(--faint)]">(最低{MIN_PARTICIPANT_STAKE})</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[100, 200, 500, 1000, 2000]
              .filter((v, i, a) => v >= MIN_PARTICIPANT_STAKE && a.indexOf(v) === i)
              .map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={myStakeInput === String(amount) ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setMyStakeInput(String(amount))}
                >
                  {amount}
                </Button>
              ))}
            <Input
              type="text"
              inputMode="numeric"
              placeholder="自定义"
              value={myStakeInput}
              onChange={(e) => setMyStakeInput(e.target.value)}
              className="min-w-0 flex-1"
            />
          </div>
        </div>

        {/* 态度选择 */}
        <div className="mb-2">
          <label className="mb-3 block font-medium text-[var(--text)]">选择你的态度</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedSide('support')}
              className={`rounded-xl border-2 border-solid p-4 transition-all ${
                selectedSide === 'support'
                  ? 'border-[var(--side-support-line)] bg-[var(--side-support)] text-[var(--side-support-text)] ring-2 ring-[var(--side-support-line)]'
                  : 'border-[var(--line-strong)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--line)]'
              }`}
            >
              <span className="mb-1 block text-base font-bold">{supportLabel}</span>
              <span className="block text-xs text-[var(--faint)]">认为 {challenge.hostName} 能成功</span>
            </button>
            <button
              onClick={() => setSelectedSide('oppose')}
              className={`rounded-xl border-2 border-solid p-4 transition-all ${
                selectedSide === 'oppose'
                  ? 'border-[var(--side-oppose-line)] bg-[var(--side-oppose)] text-[var(--side-oppose-text)] ring-2 ring-[var(--side-oppose-line)]'
                  : 'border-[var(--line-strong)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--line)]'
              }`}
            >
              <span className="mb-1 block text-base font-bold">{opposeLabel}</span>
              <span className="block text-xs text-[var(--faint)]">认为 {challenge.hostName} 会失败</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
