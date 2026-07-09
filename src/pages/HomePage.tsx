import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { useChallengeStore } from '../store/challengeStore';
import { ChallengeCard } from '../components/challenge/ChallengeCard';
import { EssayDetailModal } from '../components/essay/EssayDetailModal';
import { Input, Tabs } from '../components/ui';
import { ChallengeStatus, Challenge } from '../types';

type EffectiveStatus = 'active' | 'pending' | 'completed';

function getEffectiveStatus(challenge: Challenge): EffectiveStatus {
  if (challenge.status === 'completed') return 'completed';
  const endDate = new Date(challenge.endDate).getTime();
  if (challenge.status === 'active' && Date.now() > endDate) return 'pending';
  return 'active';
}

const groupAccent: Record<string, string> = {
  active: 'var(--ok)',
  pending: 'var(--warn)',
  completed: 'var(--muted)',
};

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
    .sort((a) => new Date(a.endDate).getTime() - new Date(a.endDate).getTime());
  const pendingChallenges = filteredChallenges
    .filter((c) => c.effectiveStatus === 'pending')
    .sort((a) => new Date(a.endDate).getTime() - new Date(a.endDate).getTime());
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
    key: string,
    list: (Challenge & { effectiveStatus: EffectiveStatus })[]
  ) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="h-6 w-1 rounded-full" style={{ background: groupAccent[key] }} />
          <h2 className="text-lg font-bold text-[var(--text)]">{title}</h2>
          <span className="text-sm text-[var(--faint)]">{list.length} 个挑战</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((challenge, index) => (
              <div
                key={challenge.id}
                className="h-full animate-fade-in-up"
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
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="text-center mb-8">
          <h1 className="mb-3">
            <img src="/title.png" alt="群健康挑战赛" className="mx-auto max-w-full h-auto sm:h-14 md:h-16 object-contain" />
          </h1>
          <p className="text-[var(--muted)] text-sm sm:text-base max-w-2xl mx-auto px-4">
            🏃‍♂️ 一起运动 · 一起健康 · 一起成长 💪
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
          <Input
            leftIcon={<Search className="w-5 h-5" />}
            placeholder="搜索挑战主题、目标或发起人..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:flex-1 min-w-0"
            wrapperClassName="w-full sm:flex-1 min-w-0"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[var(--faint)] flex-shrink-0" />
            <Tabs
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              options={statusTabs}
              fullWidth
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {filteredChallenges.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-[var(--surface)] rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🎯</span>
            </div>
            <h3 className="text-xl font-medium text-[var(--text)] mb-2">暂无挑战赛</h3>
            <p className="text-[var(--faint)]">成为第一个发起挑战赛的人吧！</p>
          </div>
        ) : statusFilter === 'all' ? (
          <div>
            {renderGroup('进行中', 'active', activeChallenges)}
            {renderGroup('待确认', 'pending', pendingChallenges)}
            {renderGroup('已结束', 'completed', completedChallenges)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges
              .sort((a, b) => {
                if (a.effectiveStatus === 'completed') {
                  return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
                }
                return new Date(a.endDate).getTime() - new Date(a.endDate).getTime();
              })
              .map((challenge, index) => (
                <div
                  key={challenge.id}
                  className="h-full animate-fade-in-up"
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
        <EssayDetailModal challenge={selectedChallenge} onClose={() => setSelectedChallenge(null)} />
      )}
    </div>
  );
}
