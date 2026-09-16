import { NavLink } from 'react-router-dom';

interface Tab {
  path: string;
  label: string;
}

interface RoleTabsProps {
  base: string;
  titulo: string;
  subtitulo: string;
  tabs?: Tab[];
}

const TABS_DEFECTO: Tab[] = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'directorio', label: 'Directorio' },
];

export function RoleTabs({ base, titulo, subtitulo, tabs = TABS_DEFECTO }: RoleTabsProps) {
  const tabClase = ({ isActive }: { isActive: boolean }) =>
    `border-b-2 px-1 pb-3 text-sm font-medium ${
      isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-gray-900">{titulo}</h1>
      <p className="text-sm text-gray-500">{subtitulo}</p>
      <div className="mt-4 flex gap-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <NavLink key={tab.path} to={`${base}/${tab.path}`} className={tabClase}>
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
