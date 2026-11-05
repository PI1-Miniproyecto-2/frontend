import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, User, HelpCircle, LogOut } from 'lucide-react'

function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-[#0A3C3E] text-white flex flex-col justify-between h-screen sticky top-0 p-4">
      <div>
        <div className="flex items-center gap-2 px-2 py-4 mb-6">
          <BookOpen className="w-7 h-7 text-[#10B981]" />
          <h1 className="text-xl font-bold text-white tracking-tight">AulaPro</h1>
        </div>

        <nav aria-label="Navegación del panel" className="space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-[#10B981] text-white' : 'text-gray-300 hover:bg-[#0E4B4E] hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            Panel principal
          </NavLink>

          <NavLink
            to="/rooms"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-[#10B981] text-white' : 'text-gray-300 hover:bg-[#0E4B4E] hover:text-white'
              }`
            }
          >
            <BookOpen className="w-5 h-5" />
            Mis salas
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-[#10B981] text-white' : 'text-gray-300 hover:bg-[#0E4B4E] hover:text-white'
              }`
            }
          >
            <User className="w-5 h-5" />
            Mi perfil
          </NavLink>

          <NavLink
            to="/help"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-[#10B981] text-white' : 'text-gray-300 hover:bg-[#0E4B4E] hover:text-white'
              }`
            }
          >
            <HelpCircle className="w-5 h-5" />
            Ayuda
          </NavLink>
        </nav>
      </div>

      <div className="bg-[#0E4B4E] rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-sm">
            EC
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">Emilio Castro</p>
            <p className="text-xs text-gray-300">@emilio.c</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="text-gray-300 hover:text-white p-1.5 hover:bg-[#0A3C3E] rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar