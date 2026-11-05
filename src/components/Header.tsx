
import { Link } from 'react-router-dom'
import Navbar from './Navbar'

function Header() {
  return (
    <header className="bg-[#073B43] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight"
          aria-label="AulaPro, ir al inicio"
        >
          Aula<span className="text-[#70DCCB]">Pro</span>
        </Link>

        <Navbar />
      </div>
    </header>
  )
}

export default Header
