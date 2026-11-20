
import { obtenerToken } from './AuthService'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/$/, '')

export type PrivacidadSala = 'private' | 'public'

export interface CrearSalaDatos {
  name: string
}

export interface Sala {
  roomId: string
  name: string
  ownerUid: string
  participantUids: string[]
  createdAt: string | null
  status?: string
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
