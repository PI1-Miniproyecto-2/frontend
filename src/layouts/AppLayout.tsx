import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#F5F8F8]">
      <a
        href="#main-content"
        className="absolute left-4 top-4 z-50 -translate-y-20 rounded-lg bg-white px-4 py-3 font-semibold text-[#073B43] focus:translate-y-0 focus:outline focus:outline-2 focus:outline-[#18B6A4]"
      >
        Saltar al contenido principal
      </a>

      {/* Sidebar lateral */}
      <Sidebar />

      {/* Contenido dinámico */}
      <main id="main-content" tabIndex={-1} className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout