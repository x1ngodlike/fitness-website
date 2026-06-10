import { Link } from 'react-router-dom';
import { Calendar, Users, Lock } from 'lucide-react';
import { Challenge } from '../../types';

interface ChallengeCardProps {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
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
        <div className="absolute top-4 right-4 flex flex-wrap gap-2 justify-end">
          {challenge.status === 'active' && challenge.isBlocked && (
            <span className="px-3 py-1 text-xs font-medium rounded-full border bg-red-500/10 text-red-400 border-red-500/20 inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              封档
            </span>
          )}
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(effectiveStatus)}`}>
            {getStatusText(effectiveStatus)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">
          {challenge.theme}
        </h3>

        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
          <span className="text-orange-500 font-medium">发起人：{challenge.hostName}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{challenge.startDate} ~ {challenge.endDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{challenge.participants.length}人</span>
          </div>
        </div>

        {challenge.status === 'active' && !isExpired() && (
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between text-sm">
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
      </div>
    </Link>
  );
}
