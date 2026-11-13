
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import MainLayout from './layouts/MainLayout' // Tu layout público original (Header + Navbar + Footer)
import AppLayout from './layouts/AppLayout'   // El layout privado (Sidebar lateral estilo Figma)

import Home from './pages/Home'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Rooms from './pages/Rooms'
import Room from './pages/Room'
import RoomForm from './pages/RoomForm'
import Help from './pages/Help'
import NotFound from './pages/NotFound'
import PageTitle from './components/PageTitle'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <PageTitle />

      <Routes>
        {/* Autenticación: un solo componente para ambas pantallas */}
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />

        {/* Página pública */}
        <Route element={<MainLayout />}>
          <Route path="/inicio" element={<Home />} />
        </Route>

{/* Páginas privadas protegidas */}
<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/rooms" element={<Rooms />} />
    <Route path="/rooms/create" element={<RoomForm />} />
    <Route path="/rooms/edit/:id" element={<RoomForm />} />
    <Route path="/room/:id" element={<Room />} />
    <Route path="/help" element={<Help />} />
  </Route>
</Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
