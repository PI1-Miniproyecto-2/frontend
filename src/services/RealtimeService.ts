import { io, type Socket } from 'socket.io-client'
import type { EventosCliente, EventosServidor } from '../types/realtime'

export type SocketSala = Socket<EventosServidor, EventosCliente>
export const ESPERA_ACK = 10_000
export const ESPERA_SALIDA = 1_500

function leerUrlRealtime() {
  const url = import.meta.env.VITE_REALTIME_URL?.trim()
  if (!url) return undefined
  try {
    if (['https:', 'http:'].includes(new URL(url).protocol)) return url
  } catch {
    return undefined
  }
}

export const urlRealtime = leerUrlRealtime()

export function crearSocketSala(
  url: string,
  auth: (enviar: (credenciales: { token: string }) => void) => void,
): SocketSala {
  return io(url, {
    autoConnect: false,
    forceNew: true,
    auth,
    timeout: 15_000,
    reconnectionAttempts: 5,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 5_000,
  })
}
