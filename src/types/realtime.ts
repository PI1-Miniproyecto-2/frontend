export interface Message {
  id: string
  roomId: string
  authorUid: string
  content: string
  createdAt: string
}

export const LIMITE_MENSAJE = 2000

export const erroresRealtime = {
  INVALID_ROOM: 'La sala ya no está disponible.',
  FORBIDDEN: 'Ya no tienes acceso a esta sala.',
  NOT_JOINED: 'Se interrumpió tu ingreso a la sala.',
  INVALID_MESSAGE: 'Escribe un mensaje de 1 a 2000 unidades de texto.',
  INTERNAL_ERROR: 'No pudimos completar la operación en la sala.',
  PERSISTENCE_ERROR: 'No pudimos guardar tu mensaje. Inténtalo nuevamente.',
  UNAUTHENTICATED: 'No pudimos verificar tu sesión. Vuelve a iniciar sesión.',
}

export type CodigoRealtime = keyof typeof erroresRealtime
type SalaPayload = { roomId: string }
type Respuesta = (resultado: unknown) => void

export interface EventosCliente {
  'room:join': (payload: SalaPayload, ack: Respuesta) => void
  'room:leave': (payload: SalaPayload, ack: Respuesta) => void
  'chat:send': (payload: SalaPayload & { content: string }, ack: Respuesta) => void
}

export interface EventosServidor {
  'room:users': (payload: unknown) => void
  'chat:message': (payload: unknown) => void
  'room:error': (payload: unknown) => void
  'room:updated': (payload: unknown) => void
  'room:deleted': (payload: unknown) => void
}

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null
}

export function esDeSala(valor: unknown, roomId: string): valor is Record<string, unknown> {
  return esObjeto(valor) && valor.roomId === roomId
}

export function esMensaje(valor: unknown, roomId: string): valor is Message {
  return esDeSala(valor, roomId) &&
    typeof valor.id === 'string' && Boolean(valor.id.trim()) &&
    typeof valor.authorUid === 'string' && Boolean(valor.authorUid.trim()) &&
    typeof valor.content === 'string' && Boolean(valor.content.trim()) &&
    valor.content.length <= LIMITE_MENSAJE &&
    typeof valor.createdAt === 'string' && Number.isFinite(Date.parse(valor.createdAt))
}

export function codigoRealtime(valor: unknown): CodigoRealtime {
  if (esObjeto(valor) && typeof valor.code === 'string' && Object.hasOwn(erroresRealtime, valor.code)) {
    return valor.code as CodigoRealtime
  }

  return 'INTERNAL_ERROR'
}
