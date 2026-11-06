
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/dashboard', label: 'Panel', end: true },
  { to: '/rooms', label: 'Salas de estudio', end: false },
  { to: '/help', label: 'Ayuda', end: true },
  { to: '/login', label: 'Iniciar sesión', end: true },
]

export default function Navbar() {
  return (
    <nav aria-label="Navegación principal">
      <ul className="flex flex-wrap items-center gap-2 md:gap-5">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#70DCCB] ${
                  isActive
                    ? 'bg-[#0B4F55] text-[#70DCCB]'
                    : 'text-white hover:bg-[#0B4F55]'
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
