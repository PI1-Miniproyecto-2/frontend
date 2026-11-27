
import { obtenerToken } from './AuthService'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/$/, '')

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
  method: 'GET' | 'POST' | 'PATCH',
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

export const MAX_NOMBRE_SALA = 100

export function validarNombreSala(nombre: string): string {
  const longitud = nombre.trim().length
  if (longitud === 0) return 'Escribe un nombre para la sala.'
  if (longitud > MAX_NOMBRE_SALA) return 'El nombre debe tener entre 1 y 100 unidades de texto.'
  return ''
}

export async function editarSala(roomId: string, name: string, signal?: AbortSignal): Promise<Sala> {
  if (!PATRON_CODIGO_SALA.test(roomId) || validarNombreSala(name)) throw new ErrorSala('http', 400)
  return validarSala(await peticionSalas('PATCH', `/${encodeURIComponent(roomId)}`, { name: name.trim() }, signal), roomId)
}

function edicionIncierta(error: unknown) {
  return error instanceof ErrorSala && (
    error.tipo === 'conexion' || error.tipo === 'respuesta' ||
    (error.status !== undefined && error.status >= 500)
  )
}

async function conPlazo<T>(signal: AbortSignal, ms: number, ejecutar: (signal: AbortSignal) => Promise<T>) {
  signal.throwIfAborted()
  const solicitud = new AbortController()
  const cancelar = () => solicitud.abort()
  signal.addEventListener('abort', cancelar, { once: true })
  const plazo = setTimeout(cancelar, ms)
  try {
    return await ejecutar(solicitud.signal)
  } catch (error) {
    if (solicitud.signal.aborted && !signal.aborted) throw new ErrorSala('conexion')
    throw error
  } finally {
    clearTimeout(plazo)
    signal.removeEventListener('abort', cancelar)
  }
}

export function consultarSalaConPlazo(roomId: string, signal: AbortSignal) {
  return conPlazo(signal, 8_000, consulta => obtenerSala(roomId, consulta))
}

export async function guardarNombreSala(roomId: string, name: string, signal: AbortSignal) {
  try {
    const sala = await conPlazo(signal, 12_000, peticion => editarSala(roomId, name, peticion))
    return { sala, confirmado: true }
  } catch (error) {
    signal.throwIfAborted()
    if (!edicionIncierta(error)) throw error

    // Una respuesta perdida puede corresponder a una escritura exitosa.
    const sala = await consultarSalaConPlazo(roomId, signal)
      .catch((errorConsulta: unknown) => {
        if (errorConsulta instanceof ErrorSala && [401, 403, 404].includes(errorConsulta.status ?? 0)) throw errorConsulta
        throw error
      })
    return { sala, confirmado: sala.name === name.trim() }
  }
}

export function mensajeErrorEdicion(error: unknown) {
  if (edicionIncierta(error)) {
    return 'No pudimos confirmar el cambio. Comprueba el nombre actual antes de volver a guardar.'
  }
  if (error instanceof ErrorSala) {
    if (error.status === 400) return 'Revisa el nombre de la sala. Debe tener entre 1 y 100 unidades de texto.'
    if (error.status === 401 || error.tipo === 'autenticacion') return 'No pudimos verificar tu sesión. Vuelve a iniciar sesión.'
    if (error.status === 403) return 'No tienes permiso para editar esta sala.'
    if (error.status === 404) return 'La sala ya no está disponible.'
    if (error.status === 429) return 'Hay demasiadas solicitudes. Espera un momento antes de volver a guardar.'
  }
  return 'No pudimos guardar los cambios. Inténtalo nuevamente.'
}

export async function obtenerMisSalas(signal?: AbortSignal): Promise<Sala[]> {
  const resultado = await peticionSalas('GET', '', undefined, signal)
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

export interface RoomMember {
  uid: string
  displayName: string
  username: string | null
  avatarId: string
}

export interface RoomMembersResponse {
  members: RoomMember[]
}

function esMiembro(valor: unknown): valor is RoomMember {
  return typeof valor === 'object' && valor !== null &&
    'uid' in valor && typeof valor.uid === 'string' && Boolean(valor.uid.trim()) &&
    'displayName' in valor && typeof valor.displayName === 'string' &&
    'username' in valor && (valor.username === null || typeof valor.username === 'string') &&
    'avatarId' in valor && typeof valor.avatarId === 'string'
}

export async function obtenerMiembrosSala(
  roomId: string,
  signal?: AbortSignal,
): Promise<RoomMembersResponse> {
  const resultado = await peticionSalas('GET', `/${encodeURIComponent(roomId)}/members`, undefined, signal)
  if (typeof resultado !== 'object' || resultado === null ||
    !('members' in resultado) || !Array.isArray(resultado.members) ||
    !resultado.members.every(esMiembro)) {
    throw new ErrorSala('respuesta')
  }

  return { members: resultado.members }
}
