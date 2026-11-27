import { useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, User, HelpCircle, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cerrarSesionFirebase } from '../services/AuthService'

const enlaces = [
  { ruta: '/dashboard', texto: 'Panel principal', Icono: LayoutDashboard },
  { ruta: '/rooms', texto: 'Mis salas', Icono: BookOpen },
  { ruta: '/profile', texto: 'Mi perfil', Icono: User },
  { ruta: '/help', texto: 'Ayuda', Icono: HelpCircle },
]

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70DCCB]'

function Sidebar() {
  const navigate = useNavigate()
  const { perfil, user } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [errorSesion, setErrorSesion] = useState('')
  const botonMenu = useRef<HTMLButtonElement>(null)
  const cierreEnCurso = useRef(false)

  const nombre = perfil?.firstName?.trim() || user?.displayName?.split(' ')[0] || 'Estudiante'
  const apellido = perfil?.lastName?.trim() || ''
  const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ')
  const username = perfil?.username || user?.email?.split('@')[0] || 'usuario'
  const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()

  function cerrarMenu() {
    setMenuAbierto(false)
    botonMenu.current?.focus()
  }

  async function handleLogout() {
    if (cierreEnCurso.current) return

    cierreEnCurso.current = true
    setCerrandoSesion(true)
    setErrorSesion('')

    try {
      await cerrarSesionFirebase()
      navigate('/login', { replace: true })
    } catch {
      setErrorSesion('No pudimos cerrar tu sesión. Inténtalo nuevamente.')
    } finally {
      cierreEnCurso.current = false
      setCerrandoSesion(false)
    }
  }

  return (
    <aside
      className="flex w-full flex-col bg-[#0A3C3E] p-3 text-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto md:p-4"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && menuAbierto && botonMenu.current?.offsetParent) {
          event.preventDefault()
          cerrarMenu()
        }
      }}
    >
      <div className="flex items-center justify-between gap-3 px-2 md:mb-6 md:py-4">
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <BookOpen className="size-7 text-[#10B981]" aria-hidden="true" />
          AulaPro
        </span>
        <button
          ref={botonMenu}
          type="button"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
          aria-controls="navegacion-panel"
          onClick={() => menuAbierto ? cerrarMenu() : setMenuAbierto(true)}
          className={`grid size-10 place-items-center rounded-lg hover:bg-[#0E4B4E] md:hidden ${foco}`}
        >
          {menuAbierto ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      <div
        id="navegacion-panel"
        className={`${menuAbierto ? 'flex' : 'hidden'} flex-1 flex-col justify-between gap-3 pt-3 md:flex md:pt-0`}
      >
        <nav aria-label="Navegación del panel" className="grid gap-1">
          {enlaces.map(({ ruta, texto, Icono }) => (
            <NavLink
              key={ruta}
              to={ruta}
              onClick={() => {
                if (menuAbierto) cerrarMenu()
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${foco} ${
                  isActive ? 'bg-[#70DCCB] text-[#073B43]' : 'text-gray-300 hover:bg-[#0E4B4E] hover:text-white'
                }`
              }
            >
              <Icono className="size-5 shrink-0" aria-hidden="true" />
              {texto}
            </NavLink>
          ))}
        </nav>

        <div className="rounded-2xl bg-[#0E4B4E] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#70DCCB] font-bold text-[#073B43]" aria-hidden="true">
                {iniciales}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">{nombreCompleto}</p>
                <p className="truncate text-xs text-gray-300">@{username}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              aria-label="Cerrar sesión"
              aria-disabled={cerrandoSesion}
              title="Cerrar sesión"
              className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-2 text-gray-300 hover:bg-[#0A3C3E] hover:text-white aria-disabled:cursor-wait ${foco}`}
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="text-xs md:hidden">Cerrar sesión</span>
            </button>
          </div>
          <p role="status" className="text-sm text-teal-100">{cerrandoSesion && 'Cerrando sesión...'}</p>
          <p role="alert" className="text-sm text-red-200">{errorSesion}</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
