import { useState } from 'react';
import { ChevronDown, ChevronUp, User } from 'lucide-react';
import { ParticipantItem } from '../../types';

interface ParticipantGridProps {
  participants: ParticipantItem[];
  selectedId?: string;
  onSelect: (id: string, name: string) => void;
  disabledIds?: string[];
}

export function ParticipantGrid({ participants, selectedId, onSelect, disabledIds = [] }: ParticipantGridProps) {
  const [expanded, setExpanded] = useState(false);

  // 按 order 升序、createdAt 升序排序
  const sorted = [...participants].sort((a, b) => {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.createdAt - b.createdAt;
  });
  const activeParticipants = sorted.filter((p) => p.isActive);
  // 1 行 6 个，前 2 行 = 12 个默认显示
  const DEFAULT_VISIBLE = 12;
  const shownCount = expanded ? activeParticipants.length : Math.min(DEFAULT_VISIBLE, activeParticipants.length);
  const shownParticipants = activeParticipants.slice(0, shownCount);
  const hasMore = activeParticipants.length > DEFAULT_VISIBLE;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-[240px] overflow-y-auto scroll-slim p-2">
        {shownParticipants.map((p) => {
          const isSelected = selectedId === p.id;
          const isDisabled = disabledIds.includes(p.id);

          return (
            <button
              key={p.id}
              onClick={() => !isDisabled && onSelect(p.id, p.name)}
              disabled={isDisabled}
              className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-200 min-h-[66px] ${
                isDisabled
                  ? 'cursor-not-allowed'
                  :                 isSelected
                  ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)] z-10'
                  : 'bg-[var(--surface-2)] hover:bg-[var(--hover)]'
              }`}
            >
              <div className={`flex flex-col items-center gap-1.5 ${isDisabled ? 'opacity-40' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-[var(--bg)] flex items-center justify-center overflow-hidden ring-1 ring-[var(--line)]">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-[var(--muted)]" />
                  )}
                </div>
                <span className="text-xs text-[var(--text)] w-full text-center leading-tight break-words line-clamp-2">
                  {p.name}
                </span>
              </div>
              {isDisabled && (
                <span className="absolute top-1 right-1 px-1 py-0.5 rounded bg-[var(--bad-soft)] text-[var(--bad)] text-[9px] font-medium leading-none">
                  已参与
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              收起
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              展开更多（共 {activeParticipants.length} 人）
            </>
          )}
        </button>
      )}

      {activeParticipants.length === 0 && (
        <div className="text-center py-8 text-[var(--faint)]">
          暂无可用参与者，请联系管理员添加
        </div>
      )}
    </div>
  );
}
