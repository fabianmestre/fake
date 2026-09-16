import type { ReactNode } from 'react';
import { IconArrowRight } from '../layout/icons';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: 'default' | 'warning' | 'danger' | 'success' | 'dark';
  icon?: ReactNode;
  onClickValue?: () => void;
}

const TONE_VALUE: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-gray-900',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  success: 'text-emerald-600',
  dark: 'text-gray-900',
};

const TONE_BADGE: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-blue-50 text-blue-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  success: 'bg-emerald-50 text-emerald-600',
  dark: 'bg-slate-900 text-white',
};

function Badge({ tone, icon }: { tone: NonNullable<StatCardProps['tone']>; icon: ReactNode }) {
  return <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_BADGE[tone]}`}>{icon}</span>;
}

export function StatCard({ label, value, sublabel, tone = 'default', icon, onClickValue }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        {icon && <Badge tone={tone} icon={icon} />}
      </div>
      {onClickValue ? (
        <button
          type="button"
          onClick={onClickValue}
          className={`mt-2 text-2xl font-semibold underline decoration-dotted underline-offset-4 hover:decoration-solid ${TONE_VALUE[tone]}`}
        >
          {value}
        </button>
      ) : (
        <p className={`mt-2 text-2xl font-semibold ${TONE_VALUE[tone]}`}>{value}</p>
      )}
      {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
    </div>
  );
}

export function AlertaCard({
  label,
  tone = 'default',
  icon,
  onClick,
}: {
  label: string;
  tone?: StatCardProps['tone'];
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        {icon && <Badge tone={tone ?? 'default'} icon={icon} />}
      </div>
      <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-blue-700">
        Ver detalle
        <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </p>
    </button>
  );
}
