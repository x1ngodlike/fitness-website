import React from 'react';

export type StatusPillStatus = 'active' | 'pending' | 'completed';

const STATUS_CONFIG: Record<StatusPillStatus, { text: string; color: string; pulse: boolean }> = {
  // 进行中 = 绿（与红涨绿跌的涨跌色区分，避免误读）
  active: { text: '进行中', color: 'var(--ok)', pulse: true },
  // 待确认 = 琥珀
  pending: { text: '待确认', color: 'var(--warn)', pulse: false },
  // 已结束 = 中性灰
  completed: { text: '已结束', color: 'var(--muted)', pulse: false },
};

/**
 * 玻璃拟态状态药丸 —— 封面场景统一使用（首页卡片 / 弹窗英雄区）。
 * 全站「进行中 / 待确认 / 已结束」只有这一处实现，保证视觉一致。
 */
export function StatusPill({ status, className = '' }: { status: StatusPillStatus; className?: string }) {
  const meta = STATUS_CONFIG[status];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1',
        'text-xs font-medium text-white shadow-[var(--shadow-xs)] backdrop-blur-md',
        className,
      ].join(' ')}
    >
      <span className="relative flex h-1.5 w-1.5">
        {meta.pulse && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: meta.color }}
          />
        )}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: meta.color }}
        />
      </span>
      {meta.text}
    </span>
  );
}

/** 计算有效状态：进行中但已过期 → 待确认。卡片与弹窗共用，避免逻辑漂移。 */
export function getEffectiveStatus(challenge: {
  status: StatusPillStatus;
  endDate: string;
}): StatusPillStatus {
  if (challenge.status === 'active' && new Date(challenge.endDate).getTime() < Date.now()) {
    return 'pending';
  }
  return challenge.status;
}
