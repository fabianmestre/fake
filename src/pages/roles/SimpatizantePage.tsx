import { Outlet } from 'react-router-dom';
import { RoleTabs } from '../../components/layout/RoleTabs';

export function SimpatizantePage() {
  return (
    <div>
      <RoleTabs base="/roles/simpatizante" titulo="Simpatizante" subtitulo="Directorio y dashboard analítico de simpatizantes" />
      <Outlet />
    </div>
  );
}
