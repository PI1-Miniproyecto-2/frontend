
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
  refrescarPerfil: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null)

  const refrescarPerfil = async () => {
    try {
      const resultado = await consultarPerfil()
      setPerfil(resultado)
      setErrorPerfil(null)
    } catch (error) {
      const status = (error as Error & { status?: number }).status

      if (status === 404) {
        setPerfil(null)
        setErrorPerfil(null)
        return
      }

      setErrorPerfil('No fue posible verificar tu perfil.')
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setPerfil(null)
      setErrorPerfil(null)

      if (!firebaseUser) {
        setCargando(false)
        return
      }

      setCargando(true)

      try {
        await refrescarPerfil()
      } catch {
        // Se mantiene bloqueado el acceso privado si falla la API.
      } finally {
        setCargando(false)
      }
    })

    return unsubscribe
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
