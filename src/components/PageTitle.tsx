
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, string> = {
  '/': 'Inicio',
  '/login': 'Iniciar sesión',
  '/register': 'Registro',
  '/dashboard': 'Panel',
  '/profile': 'Mi perfil',
  '/rooms': 'Salas de estudio',
  '/rooms/create': 'Crear sala',
  '/help': 'Ayuda',
}

function PageTitle() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    const title =
      pageTitles[path] ||
      (path.startsWith('/rooms/edit/') ? 'Editar sala' :
      path.startsWith('/room/') ? 'Sala de estudio' : 'Página no encontrada')

    document.title = `${title} | AulaPro`
  }, [location.pathname])

  return null
}

export default PageTitle
