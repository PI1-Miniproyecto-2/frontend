
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

export const PATRON_CODIGO_SALA = /^[A-Za-z0-9]{20}$/

type TipoErrorSala = 'autenticacion' | 'conexion' | 'http' | 'respuesta'

export class ErrorSala extends Error {
  readonly tipo: TipoErrorSala
  readonly status?: number

  constructor(tipo: TipoErrorSala, status?: number) {
    super('No se pudo completar la operación de sala.')
    this.name = 'ErrorSala'
    this.tipo = tipo
    this.status = status
  }
}

export function mensajeErrorSala(error: unknown, accion: 'ingresar' | 'abrir') {
  if (error instanceof ErrorSala) {
    if (error.tipo === 'conexion') {
      return 'No pudimos conectarnos. Comprueba tu conexión e inténtalo nuevamente'
    }
    if (error.tipo === 'autenticacion' || error.status === 401) {
      return 'No pudimos verificar tu sesión. Vuelve a iniciar sesión e inténtalo nuevamente.'
    }
    if (error.status === 403) {
      return 'No tienes permiso para ingresar a esta sala'
    }
    if (error.status === 404) {
      return 'No encontramos una sala disponible con ese código. Verifica el identificador e inténtalo nuevamente.'
    }
  }

  return `No pudimos ${accion === 'ingresar' ? 'ingresar a' : 'abrir'} la sala. Inténtalo nuevamente.`
}

async function peticionSalas(
  method: 'GET' | 'POST',
  ruta = '',
  datos?: CrearSalaDatos,
  signal?: AbortSignal
): Promise<unknown> {
  const token = await obtenerToken().catch(() => {
    throw new ErrorSala('autenticacion')
  })
  signal?.throwIfAborted()

  const response = await fetch(`${API_URL}/api/v1/rooms${ruta}`, {
    method,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(datos ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(datos ? { body: JSON.stringify(datos) } : {}),
    signal,
  }).catch(() => {
    throw new ErrorSala('conexion')
  })

  if (!response.ok) throw new ErrorSala('http', response.status)

  return response.json().catch(() => {
    throw new ErrorSala('respuesta')
  })
}

function esSala(valor: unknown): valor is Sala {
  return typeof valor === 'object' && valor !== null &&
    'roomId' in valor && typeof valor.roomId === 'string' &&
    PATRON_CODIGO_SALA.test(valor.roomId) &&
    'name' in valor && typeof valor.name === 'string' && Boolean(valor.name.trim()) &&
    'ownerUid' in valor && typeof valor.ownerUid === 'string' &&
    'participantUids' in valor && Array.isArray(valor.participantUids) &&
    valor.participantUids.every((uid: unknown) => typeof uid === 'string') &&
    'createdAt' in valor && (valor.createdAt === null ||
      (typeof valor.createdAt === 'string' && Number.isFinite(Date.parse(valor.createdAt)))) &&
    (!('status' in valor) || typeof valor.status === 'string')
}

function validarSala(valor: unknown, roomId?: string): Sala {
  if (!esSala(valor)) throw new ErrorSala('respuesta')
  if (roomId && (valor.roomId !== roomId || valor.createdAt === null)) {
    throw new ErrorSala('respuesta')
  }
  if (roomId && valor.status !== 'active') throw new ErrorSala('http', 404)
  return valor
}

export async function crearSala(datos: CrearSalaDatos): Promise<Sala> {
  return validarSala(await peticionSalas('POST', '', datos))
}

export async function obtenerMisSalas(): Promise<Sala[]> {
  const resultado = await peticionSalas('GET')
  if (typeof resultado !== 'object' || resultado === null ||
    !('rooms' in resultado) || !Array.isArray(resultado.rooms) ||
    !resultado.rooms.every(esSala)) {
    throw new ErrorSala('respuesta')
  }

  return resultado.rooms
}

export async function obtenerSala(roomId: string, signal?: AbortSignal): Promise<Sala> {
  return validarSala(
    await peticionSalas('GET', `/${encodeURIComponent(roomId)}`, undefined, signal),
    roomId
  )
}

export async function unirseSala(roomId: string, signal?: AbortSignal): Promise<Sala> {
  return validarSala(
    await peticionSalas('POST', `/${encodeURIComponent(roomId)}/join`, undefined, signal),
    roomId
  )
}
