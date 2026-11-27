
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

// Layouts

import AppLayout from './layouts/AppLayout'

// Páginas

import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Rooms from './pages/Rooms'
import Room from './pages/Room'
import RoomForm from './pages/RoomForm'
import Help from './pages/Help'
import NotFound from './pages/NotFound'
import ElegirUsuario from './pages/ElegirUsuario'

// Componentes
import PageTitle from './components/PageTitle'
import ProtectedRoute from './components/ProtectedRoute'

// Contexto
import { useAuth } from './context/AuthContext'

// Protege la pantalla de completar perfil.
// No exige tener un perfil completo.
function RutaElegirUsuario() {
  const {
    user,
    cargando,
    errorPerfil,
  } = useAuth()

  if (cargando) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        aria-busy="true"
        aria-live="polite"
      >
        Verificando tu sesión...
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // La propia pantalla ElegirUsuario muestra
  // el error de API y permite cerrar sesión.
  // No redirigimos a dashboard sin verificar el perfil.
  if (errorPerfil) {
    return <ElegirUsuario />
  }

  return <ElegirUsuario />
}

function App() {
  return (
    <BrowserRouter>
      <PageTitle />

      <Routes>
        {/* Autenticación */}
        <Route
          path="/"
          element={<Navigate to="/register" replace />}
        />

        <Route
          path="/register"
          element={<AuthPage />}
        />

        <Route
          path="/login"
          element={<AuthPage />}
        />

  {/* Redirigir la antigua página de inicio al registro */}
  <Route
  path="/inicio"
  element={<Navigate to="/register" replace />}
/>

        {/* Completar perfil: requiere sesión,
            pero no perfil completo */}
        <Route
          path="/elegir-usuario"
          element={<RutaElegirUsuario />}
        />

        {/* Páginas privadas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/rooms"
              element={<Rooms />}
            />

            <Route
              path="/rooms/create"
              element={<RoomForm />}
            />

            <Route
              path="/rooms/edit/:id"
              element={<Navigate to="/rooms" replace />}
            />

            <Route
              path="/room/:id"
              element={<Room />}
            />

            <Route
              path="/help"
              element={<Help />}
            />
          </Route>
        </Route>

        {/* Página no encontrada */}
        <Route
          path="/404"
          element={<NotFound />}
        />

        <Route
          path="*"
          element={<Navigate to="/404" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
