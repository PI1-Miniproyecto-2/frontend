
import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

function ProtectedRoute() {
  const {
    user,
    perfil,
    cargando,
    errorPerfil,
  } = useAuth()

  const location = useLocation()

  // Esperar a que Firebase determine la sesión
  // y termine la consulta inicial del perfil.
  if (cargando) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        aria-live="polite"
        aria-busy="true"
      >
        <p>Verificando tu sesión...</p>
      </main>
    )
  }

  // Sin sesión: enviar al inicio de sesión.
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  // Si la API falla, no permitir acceso privado.
  if (errorPerfil) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div role="alert" className="text-center">
          <p className="font-semibold text-red-700">
            {errorPerfil}
          </p>

          <p className="mt-2">
            No fue posible verificar tu perfil.
            Comprueba tu conexión e inténtalo nuevamente.
          </p>
        </div>
      </main>
    )
  }

  // El perfil debe estar completo y tener username.
  const perfilCompleto =
    perfil?.profileCompleted === true &&
    Boolean(perfil.username?.trim())

  if (!perfilCompleto) {
    return (
      <Navigate
        to="/elegir-usuario"
        replace
      />
    )
  }

  // Acceso permitido a las rutas privadas.
  return <Outlet />
}

export default ProtectedRoute
