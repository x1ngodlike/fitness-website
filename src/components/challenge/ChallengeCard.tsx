import { Link } from 'react-router-dom';
import { Users, Lock, Calendar, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Challenge, Essay } from '../../types';
import { FALLBACK_COVER } from '../../data/placeholderImages';
import { Badge, StatusPill, getEffectiveStatus } from '../../components/ui';

interface ChallengeCardProps {
  challenge: Challenge;
  essays: Essay[];
  onEssayClick: () => void;
}

export function ChallengeCard({ challenge, essays, onEssayClick }: ChallengeCardProps) {
  const effectiveStatus = getEffectiveStatus(challenge);

  const daysLeft = () => {
    const end = new Date(challenge.endDate).getTime();
    return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));
  };

  const progressPercent = () => {
    const start = new Date(challenge.startDate).getTime();
    const end = new Date(challenge.endDate).getTime();
    const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, (Date.now() - start) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  };

  const latestEssay = essays[0];

  return (
    <Link
      to={`/challenge/${challenge.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-line)] hover:shadow-[var(--shadow-lg)]"
    >
      {/* 封面 */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={challenge.coverImage}
          alt={challenge.theme}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_COVER;
            e.currentTarget.onerror = null;
          }}
        />
        {/* 文字可读性遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        {/* 顶部高光 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        {/* 底部融入卡片本体的渐变 */}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--surface)] to-transparent" />

        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
          <Users className="h-3.5 w-3.5" />
          {challenge.participants.length} 人参与
        </div>

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

      {/* 内容 */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1.5 line-clamp-2 text-lg font-bold leading-snug text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">
          {challenge.theme}
        </h3>

        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold text-[var(--accent)]">@{challenge.hostName}</span>
          <span className="text-[var(--faint)]">发起</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Calendar className="h-3.5 w-3.5 text-[var(--faint)]" />
          <span>
            {challenge.startDate} ~ {challenge.endDate}
          </span>
        </div>

        {challenge.status === 'active' && new Date(challenge.endDate).getTime() > Date.now() && (
          <div className="mt-4 rounded-xl bg-[var(--surface-2)] p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
                <Clock className="h-3.5 w-3.5" />
                剩余时间
              </span>
              <span className="font-semibold text-[var(--text)]">{daysLeft()} 天</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] transition-all duration-500"
                style={{ width: `${progressPercent()}%` }}
              />
            </div>
          </div>
        )}

        {/* 最新小作文 — 去掉左侧图标，改为标签置顶 */}
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEssayClick();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onEssayClick();
            }
          }}
          className="mt-4 flex cursor-pointer flex-col gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5 text-left transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--hover)]"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--faint)]">
            最新小作文
          </span>
          {latestEssay ? (
            <div className="flex items-center gap-2">
              <Badge variant={latestEssay.sentiment === 'bullish' ? 'support' : 'oppose'} size="sm">
                {latestEssay.sentiment === 'bullish' ? (
                  <span className="flex items-center gap-0.5">
                    <ThumbsUp className="h-2.5 w-2.5" /> 利多
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5">
                    <ThumbsDown className="h-2.5 w-2.5" /> 利空
                  </span>
                )}
              </Badge>
              <p className="line-clamp-1 flex-1 text-xs text-[var(--text)]">{latestEssay.content}</p>
            </div>
          ) : (
            <span className="text-xs text-[var(--faint)]">暂无小作文</span>
          )}
        </div>
      </div>
    </Link>
  );
}
