
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth'

import { auth } from '../services/Firebase'
import {
  consultarPerfil,
  type Perfil,
} from '../services/ProfileService'

interface AuthContextType {
  user: User | null
  perfil: Perfil | null
  cargando: boolean
  errorPerfil: string | null
  refrescarPerfil: () => Promise<Perfil | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null)

  async function cargarPerfil(vigente: () => boolean): Promise<Perfil | null> {
    try {
      const resultado = await consultarPerfil()
      if (!vigente()) return null
      setPerfil(resultado)
      setErrorPerfil(null)
      return resultado
    } catch (error) {
      if (!vigente()) return null
      const status = (error as Error & { status?: number }).status

      if (status === 404) {
        setPerfil(null)
        setErrorPerfil(null)
        return null
      }

      setErrorPerfil('No fue posible verificar tu perfil.')
      throw error
    }
  }

  function refrescarPerfil() {
    const usuario = auth.currentUser
    return cargarPerfil(() => auth.currentUser === usuario)
  }

  useEffect(() => {
    const ciclo = new AbortController()

    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      const vigente = () => !ciclo.signal.aborted && auth.currentUser === firebaseUser
      if (!vigente()) return

      setUser(firebaseUser)
      setPerfil(null)
      setErrorPerfil(null)
      setCargando(Boolean(firebaseUser))
      if (!firebaseUser) return

      try {
        await cargarPerfil(vigente)
      } catch {
        // Se mantiene bloqueado el acceso privado si falla la API.
      } finally {
        if (vigente()) setCargando(false)
      }
    })

    return () => {
      ciclo.abort()
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        cargando,
        errorPerfil,
        refrescarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }

  return context
}
