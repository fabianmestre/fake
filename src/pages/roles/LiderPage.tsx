import { Outlet } from 'react-router-dom';
import { RoleTabs } from '../../components/layout/RoleTabs';

const TABS = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'directorio', label: 'Directorio' },
];

export function LiderPage() {
  return (
    <div>
      <RoleTabs base="/roles/lider" titulo="Líder" subtitulo="Dashboard y directorio — promueve o quita el rol desde la tabla" tabs={TABS} />
      <Outlet />
    </div>
  );
}
