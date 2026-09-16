import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PALETA = ['#2563eb', '#7c3aed', '#0d9488', '#f59e0b', '#dc2626', '#059669', '#db2777', '#4f46e5', '#65a30d', '#0891b2'];

interface CardShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

function CardShell({ title, subtitle, children, className, controles }: CardShellProps & { controles?: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className ?? ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        {controles}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

interface DatoSimple {
  nombre: string;
  valor: number;
}

export function DonutChartCard({
  title,
  subtitle,
  datos,
  controles,
}: {
  title: string;
  subtitle?: string;
  datos: DatoSimple[];
  controles?: React.ReactNode;
}) {
  const total = datos.reduce((s, d) => s + d.valor, 0);
  return (
    <CardShell title={title} subtitle={subtitle} controles={controles}>
      <div className="flex items-center gap-4">
        <div className="h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {datos.map((_, i) => (
                  <Cell key={i} fill={PALETA[i % PALETA.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}`, 'Registros']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 space-y-1.5 text-sm">
          {datos.map((d, i) => (
            <li key={d.nombre} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETA[i % PALETA.length] }} />
                {d.nombre}
              </span>
              <span className="font-medium text-gray-900">
                {d.valor} <span className="text-gray-400">({total ? Math.round((d.valor / total) * 100) : 0}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </CardShell>
  );
}

export function BarChartCard({
  title,
  subtitle,
  datos,
  horizontal = false,
  className,
  controles,
}: {
  title: string;
  subtitle?: string;
  datos: DatoSimple[];
  horizontal?: boolean;
  className?: string;
  controles?: React.ReactNode;
}) {
  return (
    <CardShell title={title} subtitle={subtitle} className={className} controles={controles}>
      <div style={{ height: Math.max(180, horizontal ? datos.length * 32 : 220) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: horizontal ? 24 : 0 }}>
            {horizontal ? (
              <>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nombre" width={140} tick={{ fontSize: 12 }} />
              </>
            ) : (
              <>
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              </>
            )}
            <Tooltip />
            <Bar dataKey="valor" radius={[4, 4, 4, 4]}>
              {datos.map((_, i) => (
                <Cell key={i} fill={PALETA[i % PALETA.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}

export function RankingCard({ title, subtitle, datos }: { title: string; subtitle?: string; datos: DatoSimple[] }) {
  const max = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <CardShell title={title} subtitle={subtitle}>
      <ol className="space-y-2">
        {datos.map((d, i) => (
          <li key={d.nombre} className="flex items-center gap-3 text-sm">
            <span className="w-5 shrink-0 text-gray-400">{i + 1}.</span>
            <span className="w-28 shrink-0 truncate text-gray-700">{d.nombre}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${(d.valor / max) * 100}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right font-medium text-gray-900">{d.valor}</span>
          </li>
        ))}
      </ol>
    </CardShell>
  );
}

interface DatoComparativo {
  categoria: string;
  [serie: string]: string | number;
}

export function ComparativaBarChartCard({
  title,
  subtitle,
  datos,
  series,
  controles,
  onCategoriaClick,
}: {
  title: string;
  subtitle?: string;
  datos: DatoComparativo[];
  series: { key: string; nombre: string; color: string }[];
  controles?: React.ReactNode;
  onCategoriaClick?: (categoria: string) => void;
}) {
  return (
    <CardShell title={title} subtitle={subtitle} controles={controles}>
      {onCategoriaClick && <p className="mb-1 text-[11px] text-gray-400">Haz clic en una barra para ver el detalle.</p>}
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ left: 0 }}>
            <XAxis dataKey="categoria" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.nombre}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                cursor={onCategoriaClick ? 'pointer' : undefined}
                onClick={(data) => onCategoriaClick?.((data as unknown as DatoComparativo).categoria)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}
