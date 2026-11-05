import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import MainLayout from './Layouts/MainLayout' // Tu layout público original (Header + Navbar + Footer)
import AppLayout from './Layouts/AppLayout'   // El layout privado (Sidebar lateral estilo Figma)

// Páginas
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Rooms from './pages/Rooms'
import Room from './pages/Room'
import RoomForm from './pages/RoomForm'
import Help from './pages/Help'
import NotFound from './pages/NotFound'
import PageTitle from './components/PageTitle'

function App() {
  return (
    <BrowserRouter>
      {/* Mantiene el título dinámico por accesibilidad WCAG */}
      <PageTitle />
      
      <Routes>
        {/* RUTAS PÚBLICAS: Usan tu MainLayout (Header superior + Navbar horizontal + Footer) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* RUTAS PRIVADAS: Usan AppLayout (Sidebar verde lateral estilo Figma) */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/create" element={<RoomForm />} />
          <Route path="/rooms/edit/:id" element={<RoomForm />} />
          <Route path="/room/:id" element={<Room />} />
          <Route path="/help" element={<Help />} />
        </Route>

        {/* RUTA 404 Y REDIRECCIONES */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App