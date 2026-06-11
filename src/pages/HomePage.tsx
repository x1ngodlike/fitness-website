import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { useChallengeStore } from '../store/challengeStore';
import { ChallengeCard } from '../components/challenge/ChallengeCard';
import { EssayDetailModal } from '../components/essay/EssayDetailModal';
import { ChallengeStatus, Challenge } from '../types';

type EffectiveStatus = 'active' | 'pending' | 'completed';

function getEffectiveStatus(challenge: Challenge): EffectiveStatus {
  if (challenge.status === 'completed') return 'completed';
  const endDate = new Date(challenge.endDate).getTime();
  if (challenge.status === 'active' && Date.now() > endDate) return 'pending';
  return 'active';
}

export function HomePage() {
  const challenges = useChallengeStore((state) => state.challenges);
  const essays = useChallengeStore((state) => state.essays);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChallengeStatus>('all');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const withEffectiveStatus = useMemo(
    () => challenges.map((c) => ({ ...c, effectiveStatus: getEffectiveStatus(c) })),
    [challenges]
  );

  const filteredChallenges = withEffectiveStatus.filter((challenge) => {
    const matchesSearch =
      challenge.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.hostName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || challenge.effectiveStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeChallenges = filteredChallenges
    .filter((c) => c.effectiveStatus === 'active')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  const pendingChallenges = filteredChallenges
    .filter((c) => c.effectiveStatus === 'pending')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  const completedChallenges = filteredChallenges
    .filter((c) => c.effectiveStatus === 'completed')
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  const statusTabs: { label: string; value: ChallengeStatus }[] = [
    { label: '全部', value: 'all' },
    { label: '进行中', value: 'active' },
    { label: '待确认', value: 'pending' },
    { label: '已结束', value: 'completed' },
  ];

  const getChallengeEssays = (challengeId: string) => {
    return essays
      .filter((e) => e.challengeId === challengeId)
      .sort((a, b) => b.createdAt - a.createdAt);
  };

  const renderGroup = (
    title: string,
    accent: string,
    list: (Challenge & { effectiveStatus: EffectiveStatus })[]
  ) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={`h-6 w-1 rounded-full ${accent}`} />
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <span className="text-sm text-neutral-500">{list.length} 个挑战</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((challenge, index) => (
            <div
              key={challenge.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ChallengeCard
                challenge={challenge}
                essays={getChallengeEssays(challenge.id)}
                onEssayClick={() => setSelectedChallenge(challenge)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
            <span className="text-white">群健康</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">挑战赛</span>
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto px-4">
            🏃‍♂️ 一起运动 · 一起健康 · 一起成长 💪
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
          <div className="relative w-full sm:flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="搜索挑战主题、目标或发起人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-neutral-900 rounded-xl border border-neutral-800 flex-shrink-0 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-4 h-4 text-neutral-500 ml-2 flex-shrink-0" />
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'bg-orange-500 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredChallenges.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-neutral-900 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🎯</span>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">暂无挑战赛</h3>
            <p className="text-neutral-500">成为第一个发起挑战赛的人吧！</p>
          </div>
        ) : statusFilter === 'all' ? (
          <div>
            {renderGroup('进行中', 'bg-green-500', activeChallenges)}
            {renderGroup('待确认', 'bg-yellow-500', pendingChallenges)}
            {renderGroup('已结束', 'bg-neutral-500', completedChallenges)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges
              .sort((a, b) => {
                if (a.effectiveStatus === 'completed') {
                  return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
                }
                return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
              })
              .map((challenge, index) => (
                <div
                  key={challenge.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ChallengeCard
                    challenge={challenge}
                    essays={getChallengeEssays(challenge.id)}
                    onEssayClick={() => setSelectedChallenge(challenge)}
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      {selectedChallenge && (
        <EssayDetailModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
        />
      )}
    </div>
  );
}
