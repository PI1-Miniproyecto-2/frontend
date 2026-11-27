import {
  codigoRealtime, compararMensajes, esDeSala, esMensaje, esObjeto,
  type ChatHistoryPage, type CodigoRealtime, type Message,
} from '../types/realtime'

export const TAMANO_PAGINA = 20
const PAGINAS_POR_CICLO = 4

type Fase = 'esperando' | 'inicial' | 'listo' | 'anteriores' | 'recuperando' |
  'interrumpido' | 'errorInicial' | 'errorAnteriores' | 'incompleto'

export interface EstadoHistorial {
  fase: Fase
  hayAnteriores: boolean
  anuncio: string
}

export const historialInicial: EstadoHistorial = { fase: 'esperando', hayAnteriores: false, anuncio: '' }

export function validarPagina(valor: unknown, roomId: string, before?: string): ChatHistoryPage | null {
  if (!esDeSala(valor, roomId) || !Array.isArray(valor.messages) ||
      valor.messages.length > TAMANO_PAGINA || typeof valor.hasMore !== 'boolean' ||
      !valor.messages.every((mensaje: unknown): mensaje is Message => esMensaje(mensaje, roomId))) return null

  if (valor.messages.some((mensaje, indice, mensajes) =>
    indice > 0 && Date.parse(mensajes[indice - 1].createdAt) > Date.parse(mensaje.createdAt))) return null

  const ids = new Set(valor.messages.map(mensaje => mensaje.id))
  if (ids.size !== valor.messages.length || (before !== undefined && ids.has(before))) return null

  if (valor.hasMore) {
    if (valor.messages.length !== TAMANO_PAGINA || typeof valor.nextCursor !== 'string' ||
        !/^[A-Za-z0-9_-]{1,128}$/.test(valor.nextCursor) || valor.nextCursor !== valor.messages[0].id) return null
  } else if (valor.nextCursor !== null) return null

  return { roomId, messages: valor.messages, hasMore: valor.hasMore, nextCursor: valor.nextCursor }
}

export function incorporarMensajes(destino: Map<string, Message>, mensajes: Iterable<Message>) {
  const nuevos: Message[] = []
  for (const mensaje of mensajes) {
    if (destino.has(mensaje.id)) continue
    destino.set(mensaje.id, mensaje)
    nuevos.push(mensaje)
  }
  return nuevos
}

type Dependencias = {
  consultar: (before?: string) => Promise<unknown>
  publicar: (estado: EstadoHistorial) => void
  incorporar: (mensajes: Message[]) => number
  resolverError: (codigo: CodigoRealtime) => void
  vigente: () => boolean
}

export function crearHistorialSala(roomId: string, { consultar, publicar, incorporar, resolverError, vigente }: Dependencias) {
  let generacion = 0
  let conectado = false
  let fase: Fase = 'esperando'
  let cursorAnteriores: string | null = null
  const cursoresAnteriores = new Set<string>()
  // Solo una consulta completada puede establecer un punto de continuidad.
  let puntoContinuidad: string | undefined
  let recuperacion: {
    cursor?: string
    ultimo?: string
    cursores: Set<string>
    incorporados: number
  } | undefined
  let requiereRecuperacion = false

  function mostrar(siguiente: Fase, anuncio = '') {
    fase = siguiente
    publicar({ fase, hayAnteriores: cursorAnteriores !== null, anuncio })
  }

  async function pedir(intento: number, cursores: Set<string>, before?: string) {
    try {
      const respuesta = await consultar(before)
      if (!vigente() || !conectado || intento !== generacion) return null
      if (esObjeto(respuesta) && respuesta.ok === false) {
        resolverError(codigoRealtime(respuesta.error))
        return null
      }
      if (!esObjeto(respuesta) || respuesta.ok !== true) return null
      const pagina = validarPagina(respuesta.data, roomId, before)
      if (!pagina || (pagina.nextCursor && cursores.has(pagina.nextCursor))) return null
      return pagina
    } catch {
      return null
    }
  }

  async function cargar(anteriores: boolean) {
    const intento = generacion
    const before = anteriores ? cursorAnteriores ?? undefined : undefined
    const cursores = anteriores ? cursoresAnteriores : new Set<string>()
    mostrar(anteriores ? 'anteriores' : 'inicial')
    const pagina = await pedir(intento, cursores, before)
    if (!vigente() || !conectado || intento !== generacion) return
    if (!pagina) return mostrar(anteriores ? 'errorAnteriores' : 'errorInicial')

    const cantidad = incorporar(pagina.messages)
    cursorAnteriores = pagina.nextCursor
    if (cursorAnteriores) cursoresAnteriores.add(cursorAnteriores)
    if (!anteriores) puntoContinuidad = pagina.messages.at(-1)?.id
    mostrar('listo', anteriores
      ? `Mensajes anteriores añadidos: ${cantidad}.`
      : `Historial cargado. Mensajes añadidos: ${cantidad}.`)
  }

  async function recuperar() {
    const ciclo = recuperacion
    if (!ciclo) return
    const intento = generacion
    mostrar('recuperando')
    for (let indice = 0; indice < PAGINAS_POR_CICLO; indice++) {
      const pagina = await pedir(intento, ciclo.cursores, ciclo.cursor)
      if (!vigente() || !conectado || intento !== generacion) return
      if (!pagina) return mostrar('incompleto')

      if (ciclo.cursor === undefined) ciclo.ultimo = pagina.messages.at(-1)?.id
      ciclo.incorporados += incorporar(pagina.messages)
      if (!pagina.hasMore || pagina.messages.some(mensaje => mensaje.id === puntoContinuidad)) {
        if (!pagina.hasMore) cursorAnteriores = null
        puntoContinuidad = ciclo.ultimo ?? puntoContinuidad
        recuperacion = undefined
        requiereRecuperacion = false
        mostrar('listo', `Sincronización completada. Mensajes añadidos: ${ciclo.incorporados}.`)
        return
      }

      if (pagina.nextCursor) {
        ciclo.cursor = pagina.nextCursor
        ciclo.cursores.add(pagina.nextCursor)
      }
    }
    mostrar('incompleto')
  }

  return {
    ingresar() {
      if (!vigente() || conectado) return
      conectado = true
      if (requiereRecuperacion) {
        // Reiniciar desde la última página cubre también la nueva interrupción.
        recuperacion = { cursores: new Set(), incorporados: 0 }
        void recuperar()
      } else {
        void cargar(false)
      }
    },
    interrumpir() {
      if (!conectado) return
      generacion++
      conectado = false
      requiereRecuperacion = true
      mostrar('interrumpido')
    },
    cargarAnteriores() {
      if (vigente() && conectado && cursorAnteriores && (fase === 'listo' || fase === 'errorAnteriores')) void cargar(true)
    },
    reintentar() {
      if (!vigente() || !conectado) return
      if (fase === 'errorInicial') void cargar(false)
      if (fase === 'incompleto') void recuperar()
    },
    cerrar() {
      generacion++
      conectado = false
      recuperacion = undefined
      cursorAnteriores = null
      puntoContinuidad = undefined
      cursoresAnteriores.clear()
    },
  }
}

export function ordenarMensajes(mensajes: Iterable<Message>) {
  return [...mensajes].sort(compararMensajes)
}
