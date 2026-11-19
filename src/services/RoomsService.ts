
import { obtenerToken } from './AuthService'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/$/, '')

export type PrivacidadSala = 'private' | 'public'

export interface CrearSalaDatos {
  name: string
  description: string
  privacy: PrivacidadSala
}

export interface Sala {
  id: string
  name: string
  description: string
  privacy: PrivacidadSala
  ownerId: string
  createdAt: string | null
  updatedAt: string | null
}

async function peticionSalas<T>(
  method: 'GET' | 'POST',
  datos?: CrearSalaDatos
): Promise<T> {
  const token = await obtenerToken()

  const response = await fetch(`${API_URL}/api/v1/rooms`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(datos ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(datos ? { body: JSON.stringify(datos) } : {}),
  })

  const resultado = await response.json().catch(() => null)

  if (!response.ok) {
    const mensaje =
      resultado?.message ||
      resultado?.error ||
      `Error del servidor (${response.status}).`

    throw new Error(mensaje)
  }

  return resultado as T
}

export async function crearSala(datos: CrearSalaDatos): Promise<Sala> {
  return peticionSalas<Sala>('POST', datos)
}

export async function obtenerMisSalas(): Promise<Sala[]> {
  return peticionSalas<Sala[]>('GET')
}
