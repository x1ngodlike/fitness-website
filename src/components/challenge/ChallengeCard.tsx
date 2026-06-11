import { Link } from 'react-router-dom';
import { Calendar, Users, Lock, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Challenge, Essay } from '../../types';

interface ChallengeCardProps {
  challenge: Challenge;
  essays: Essay[];
  onEssayClick: () => void;
}

export function ChallengeCard({ challenge, essays, onEssayClick }: ChallengeCardProps) {
  const isExpired = () => {
    const end = new Date(challenge.endDate).getTime();
    return Date.now() > end;
  };

  // 有效状态： active → 若 active 且未过期 → 进行中
  // active 且 已过期 → 待确认
  // completed → 已结束
  const effectiveStatus: 'active' | 'pending' | 'completed' =
    challenge.status === 'active' && isExpired() ? 'pending' : challenge.status;

  const getStatusColor = (status: 'active' | 'pending' | 'completed') => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white border-green-500';
      case 'pending':
        return 'bg-yellow-500 text-white border-yellow-500';
      case 'completed':
        return 'bg-neutral-600 text-white border-neutral-600';
    }
  };

  const getStatusText = (status: 'active' | 'pending' | 'completed') => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'pending':
        return '待确认';
      case 'completed':
        return '已结束';
    }
  };

  const daysLeft = () => {
    const end = new Date(challenge.endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const progressPercent = () => {
    const start = new Date(challenge.startDate).getTime();
    const end = new Date(challenge.endDate).getTime();
    const now = Date.now();
    const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, (now - start) / (1000 * 60 * 60 * 24));
    const percent = (elapsedDays / totalDays) * 100;
    return Math.min(100, Math.max(0, percent));
  };

  return (
    <Link
      to={`/challenge/${challenge.id}`}
      className="group block bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={challenge.coverImage}
          alt={challenge.theme}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex flex-wrap gap-1.5 sm:gap-2 justify-end">
          {challenge.status === 'active' && challenge.isBlocked && (
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs font-medium rounded-full border bg-red-500/10 text-red-400 border-red-500/20 inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              封档
            </span>
          )}
          <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs font-medium rounded-full border ${getStatusColor(effectiveStatus)}`}>
            {getStatusText(effectiveStatus)}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-1 group-hover:text-orange-400 transition-colors line-clamp-2">
          {challenge.theme}
        </h3>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 mb-1.5 sm:mb-2">
          <span className="text-orange-500 font-medium">发起人：{challenge.hostName}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="hidden sm:inline">{challenge.startDate} ~ </span>
            <span>{challenge.endDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{challenge.participants.length}人</span>
          </div>
        </div>

        {challenge.status === 'active' && !isExpired() && (
          <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-neutral-500">剩余时间</span>
              <span className="text-white font-medium">{daysLeft()} 天</span>
            </div>
            <div className="mt-1.5 h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                style={{ width: `${progressPercent()}%` }}
              />
            </div>
          </div>
        )}

        <div
          className="mt-2 pt-2 border-t border-neutral-800 cursor-pointer hover:bg-neutral-800/50 -mx-3 sm:-mx-4 px-3 sm:px-4 py-1.5 transition-colors min-h-[56px]"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEssayClick();
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-3 h-3 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-neutral-500 mb-0.5">最新小作文</div>
              {essays.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.25 text-xs font-bold rounded-full flex-shrink-0 ${
                    essays[0].sentiment === 'bullish'
                      ? 'bg-red-500/10 text-red-400'  // 利多 - 红色
                      : 'bg-green-500/10 text-green-400'  // 利空 - 绿色
                  }`}>
                    {essays[0].sentiment === 'bullish' ? (
                      <span className="flex items-center gap-0.5">
                        <ThumbsUp className="w-2.5 h-2.5" /> 利多
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <ThumbsDown className="w-2.5 h-2.5" /> 利空
                      </span>
                    )}
                  </span>
                  <p className="text-xs text-white line-clamp-1 flex-1">
                    {essays[0].content}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">暂无小作文</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
