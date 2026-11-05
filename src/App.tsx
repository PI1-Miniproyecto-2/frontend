import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'

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
      <PageTitle />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/create" element={<RoomForm />} />
          <Route path="/rooms/edit/:id" element={<RoomForm />} />
          <Route path="/room/:id" element={<Room />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App