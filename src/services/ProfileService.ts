
import { obtenerToken } from './AuthService'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/$/, '')

export interface Perfil {
  firstName: string | null
  lastName: string | null
  username: string | null
  usernameNormalized: string | null
  email: string
  avatarId: 'avatar_book' | 'avatar_owl' | 'avatar_lamp'
  authProvider: 'password' | 'google.com'
  profileCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface DatosPerfil {
  firstName?: string
  lastName?: string
  username?: string
  avatarId?: 'avatar_book' | 'avatar_owl' | 'avatar_lamp'
}

async function peticionPerfil(
  method: string,
  datos?: DatosPerfil
): Promise<Perfil | null> {
  const token = await obtenerToken()

  const response = await fetch(`${API_URL}/api/v1/users/me`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(datos ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(datos ? { body: JSON.stringify(datos) } : {}),
  })

  if (response.status === 204) return null

  const resultado = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(
      resultado.message || resultado.error || 'Error al procesar el perfil.'
    ) as Error & { status?: number }

    error.status = response.status
    throw error
  }

  return resultado as Perfil
}

export async function consultarPerfil() {
  return peticionPerfil('GET')
}

export async function crearPerfil(datos: DatosPerfil) {
  return peticionPerfil('POST', datos)
}

export async function actualizarPerfil(datos: DatosPerfil) {
  return peticionPerfil('PATCH', datos)
}

export async function eliminarPerfil() {
  return peticionPerfil('DELETE')
}
