import { ErrorSala, obtenerMiembrosSala, type RoomMember } from './RoomsService'
import { ESPERA_ACK } from './RealtimeService'
import type { CodigoRealtime } from '../types/realtime'

export type Directorio = {
  miembros: ReadonlyMap<string, RoomMember>
  pendientes: ReadonlySet<string>
  error: boolean
  puedeReintentar: boolean
}
export const directorioVacio: Directorio = { miembros: new Map(), pendientes: new Set(), error: false, puedeReintentar: false }

export function nombreMiembro(directorio: Directorio, uid: string) {
  const nombre = directorio.miembros.get(uid)?.displayName.trim()
  if (nombre && nombre !== uid && !nombre.includes('@')) return nombre
  return directorio.pendientes.has(uid) ? 'Identificando participante…' : 'Usuario no disponible'
}

export function crearDirectorioSala(
  roomId: string,
  vigente: () => boolean,
  publicar: (directorio: Directorio) => void,
  denegar: (codigo: CodigoRealtime) => void,
) {
  let solicitud: AbortController | undefined
  const perfiles = new Map<string, RoomMember>()
  const pendientes = new Map<string, number>()
  const agotados = new Set<string>()
  let inicial = true
  let enConsulta = false
  let fallosMiembros = 0
  let siguienteConsulta = 0
  let consultaProgramada: ReturnType<typeof setTimeout> | undefined
  let errorDirectorio = false

  function publicarDirectorio() {
    publicar({
      miembros: new Map(perfiles),
      pendientes: new Set(pendientes.keys()),
      error: errorDirectorio,
      puedeReintentar: fallosMiembros >= 2,
    })
  }

  function programarConsulta() {
    if (!vigente() || enConsulta || consultaProgramada !== undefined ||
        fallosMiembros >= 2 || (!inicial && !pendientes.size)) return
    consultaProgramada = setTimeout(() => {
      consultaProgramada = undefined
      enConsulta = true
      void consultarMiembros()
    }, Math.max(150, siguienteConsulta - Date.now()))
  }

  async function consultarMiembros() {
    if (!vigente()) return
    const lote = [...pendientes]
    const controlador = new AbortController()
    solicitud = controlador
    const limite = setTimeout(() => controlador.abort(), ESPERA_ACK)
    try {
      const respuesta = await obtenerMiembrosSala(roomId, controlador.signal)
      if (!vigente()) return
      inicial = false
      fallosMiembros = 0
      errorDirectorio = false
      for (const miembro of respuesta.members) {
        perfiles.set(miembro.uid, miembro)
        pendientes.delete(miembro.uid)
        agotados.delete(miembro.uid)
      }
      for (const [uid, intentos] of lote) {
        if (!pendientes.has(uid)) continue
        if (intentos === 1) {
          pendientes.delete(uid)
          agotados.add(uid)
        } else {
          pendientes.set(uid, intentos + 1)
        }
      }
    } catch (error) {
      if (!vigente()) return
      if (error instanceof ErrorSala) {
        if (error.status === 404 || error.status === 403) return denegar('FORBIDDEN')
        if (error.status === 401) return denegar('UNAUTHENTICATED')
      }
      errorDirectorio = true
      if (++fallosMiembros >= 2) pendientes.clear()
    } finally {
      clearTimeout(limite)
      solicitud = undefined
      enConsulta = false
      siguienteConsulta = Date.now() + 2_000
      if (vigente()) {
        publicarDirectorio()
        programarConsulta()
      }
    }
  }

  function resolver(uids: string[]) {
    let cambio = false
    for (const uid of uids) {
      if (fallosMiembros >= 2 || perfiles.has(uid) || pendientes.has(uid) || agotados.has(uid)) continue
      pendientes.set(uid, 0)
      cambio = true
    }
    if (cambio) {
      publicarDirectorio()
      programarConsulta()
    }
  }

  return {
    iniciar: programarConsulta,
    resolver,
    reintentar(uids: string[]) {
      if (fallosMiembros < 2) return
      inicial = true
      fallosMiembros = 0
      resolver(uids)
      publicarDirectorio()
      programarConsulta()
    },
    cerrar() {
      solicitud?.abort()
      clearTimeout(consultaProgramada)
      perfiles.clear()
      pendientes.clear()
      agotados.clear()
    },
  }
}
