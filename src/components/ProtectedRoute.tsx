
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute() {
  const { user, perfil, cargando, errorPerfil } = useAuth()
  const location = useLocation()

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

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (errorPerfil) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div role="alert" className="text-center">
          <p>{errorPerfil}</p>
          <p>Comprueba tu conexión e inténtalo nuevamente.</p>
        </div>
      </main>
    )
  }

  if (!perfil?.profileCompleted) {
    return <Navigate to="/elegir-usuario" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
