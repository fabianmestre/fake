import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { RequireAuth } from './components/layout/RequireAuth';
import { RestringirPorRol } from './components/layout/RestringirPorRol';
import { LoginPage } from './pages/LoginPage';
import { DashboardGlobalPage } from './pages/DashboardGlobalPage';
import { PerfilPage } from './pages/PerfilPage';
import { PaginaProximamente } from './pages/PaginaProximamente';
import { RegistrarSimpatizantePage } from './pages/RegistrarSimpatizantePage';
import { MisRegistrosLiderPage } from './pages/MisRegistrosLiderPage';
import { MisAsignacionesGestorPage } from './pages/MisAsignacionesGestorPage';
import { SimpatizantePage } from './pages/roles/SimpatizantePage';
import { LiderPage } from './pages/roles/LiderPage';
import { DashboardLiderTab } from './pages/roles/DashboardLiderTab';
import { DirectorioLiderTab } from './pages/roles/DirectorioLiderTab';
import { DigitadorPage } from './pages/roles/DigitadorPage';
import { PadrinoPage } from './pages/roles/PadrinoPage';
import { GestorPage } from './pages/roles/GestorPage';
import { DashboardSimpatizante } from './components/simpatizantes/DashboardSimpatizante';
import { DirectorioSimpatizanteTab } from './pages/roles/DirectorioSimpatizanteTab';
import { ComunicacionesPage } from './pages/ComunicacionesPage';
import { GestionesPage } from './pages/GestionesPage';
import { DiaEPage } from './pages/DiaEPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route element={<RestringirPorRol />}>
          <Route path="/" element={<Navigate to="/roles/simpatizante" replace />} />
          <Route path="/dashboard" element={<DashboardGlobalPage />} />

          <Route path="/roles" element={<Navigate to="/roles/simpatizante" replace />} />
          <Route path="/roles/padrino" element={<PadrinoPage />} />
          <Route path="/roles/lider" element={<LiderPage />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardLiderTab />} />
            <Route path="directorio" element={<DirectorioLiderTab />} />
          </Route>
          <Route path="/roles/simpatizante" element={<SimpatizantePage />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardSimpatizante />} />
            <Route path="directorio" element={<DirectorioSimpatizanteTab />} />
          </Route>
          <Route path="/roles/gestor" element={<GestorPage />} />
          <Route path="/roles/digitador" element={<DigitadorPage />} />

          <Route path="/gestiones" element={<GestionesPage />} />
          <Route path="/comunicaciones" element={<ComunicacionesPage />} />
          <Route path="/dia-e" element={<DiaEPage />} />
          <Route path="/mapa-talento" element={<PaginaProximamente titulo="Mapa de Talento" descripcion="Se detallará próximamente." />} />
        </Route>

        <Route path="/digitador/registrar" element={<RegistrarSimpatizantePage variante="digitador" />} />
        <Route path="/lider/registrar" element={<RegistrarSimpatizantePage variante="lider" />} />
        <Route path="/lider/mis-registros" element={<MisRegistrosLiderPage />} />
        <Route path="/gestor/mis-asignaciones" element={<MisAsignacionesGestorPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
