import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DirectorioSimpatizantes } from '../../components/simpatizantes/DirectorioSimpatizantes';

interface FiltroNavegacion {
  idsFiltro?: string[];
  motivo?: string;
}

export function DirectorioSimpatizanteTab() {
  const location = useLocation();
  const navigate = useNavigate();
  const filtroInicial = location.state as FiltroNavegacion | null;
  const [filtroNavegacion, setFiltroNavegacion] = useState<FiltroNavegacion | null>(filtroInicial);

  function quitarFiltroNavegacion() {
    setFiltroNavegacion(null);
    navigate(location.pathname, { replace: true });
  }

  return (
    <DirectorioSimpatizantes
      idsFiltro={filtroNavegacion?.idsFiltro}
      bannerFiltro={filtroNavegacion ? { texto: filtroNavegacion.motivo ?? 'Vista filtrada', onQuitar: quitarFiltroNavegacion } : undefined}
    />
  );
}
