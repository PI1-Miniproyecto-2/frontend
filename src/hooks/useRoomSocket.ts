import { useEffect, useRef, useState } from 'react'
import { onIdTokenChanged, type User } from 'firebase/auth'
import { auth } from '../services/Firebase'
import { consultarSalaConPlazo, ErrorSala, guardarNombreSala } from '../services/RoomsService'
import { crearSocketSala, urlRealtime, ESPERA_ACK, ESPERA_SALIDA } from '../services/RealtimeService'
import {
  crearHistorialSala, historialInicial, incorporarMensajes, ordenarMensajes, TAMANO_PAGINA,
  type EstadoHistorial,
} from '../services/RoomHistory'
import { crearDirectorioSala, directorioVacio, type Directorio } from '../services/RoomDirectory'
import {
  codigoRealtime, erroresRealtime, esDeSala, esMensaje, esObjeto, LIMITE_MENSAJE,
  type CodigoRealtime, type Message,
} from '../types/realtime'

type EstadoConexion = 'connecting' | 'connected' | 'lost' | 'reconnecting' | 'failed' | 'denied' | 'leaving'
const estadoInicial = { estado: 'connecting', texto: 'Conectando con la sala…' } as const
const sinConfiguracion = {
  estado: 'failed',
  texto: 'No pudimos conectar con la sala. Falta configurar el servicio en tiempo real.',
} as const
const noConfirmado = 'No pudimos confirmar la entrega. Revisa el chat antes de volver a enviar.'

type Acciones = {
  editarNombre: (nombre: string, signal: AbortSignal) => Promise<boolean>
  enviar: (content: string) => Promise<string | null>
  salir: () => Promise<void>
  reintentar: () => void
  reintentarPerfiles: () => void
  cargarAnteriores: () => void
  reintentarHistorial: () => void
}

export function useRoomSocket(roomId: string, user: User) {
  const [conexion, setConexion] = useState<{ estado: EstadoConexion; texto: string }>(() => urlRealtime ? estadoInicial : sinConfiguracion)
  const [presencia, setPresencia] = useState<string[] | null>(null)
  const [historial, setHistorial] = useState(historialInicial)
  const [mensajeEnVivo, setMensajeEnVivo] = useState<Message>()
  const [mensajes, setMensajes] = useState<Message[]>([])
  const [directorio, setDirectorio] = useState(directorioVacio)
  const [aviso, setAviso] = useState('')
  const [nombre, setNombre] = useState<string>()
  const [puedeReintentar, setPuedeReintentar] = useState(false)
  const acciones = useRef<Acciones | null>(null)

  useEffect(() => {
    if (!urlRealtime || auth.currentUser !== user) return
    const sesion = iniciarSesionSala(roomId, user, urlRealtime, {
      setConexion, setPresencia, setMensajes, setDirectorio, setAviso, setNombre, setPuedeReintentar, setHistorial, setMensajeEnVivo,
    })
    acciones.current = sesion.acciones
    return () => {
      acciones.current = null
      sesion.cerrar()
    }
  }, [roomId, user])

  return { conexion, presencia, mensajes, historial, mensajeEnVivo, directorio, nombre, aviso, puedeReintentar, acciones }
}

type Actualizaciones = {
  setHistorial: (estado: EstadoHistorial) => void
  setMensajeEnVivo: (mensaje: Message | undefined) => void
  setConexion: (conexion: { estado: EstadoConexion; texto: string }) => void
  setPresencia: (presencia: string[] | null) => void
  setMensajes: (mensajes: Message[]) => void
  setDirectorio: (directorio: Directorio) => void
  setAviso: (aviso: string) => void
  setNombre: (nombre: string | undefined) => void
  setPuedeReintentar: (disponible: boolean) => void
}

function iniciarSesionSala(roomId: string, user: User, url: string, {
  setConexion, setPresencia, setMensajes, setDirectorio, setAviso, setNombre, setPuedeReintentar, setHistorial, setMensajeEnVivo,
}: Actualizaciones) {
  let cerrado = false
  let saliendo = false
  let unido = false
  let version = 0
  let revisionNombre = 0
  let nombreActual: string | undefined
  let nombreConfirmadoPorRest: string | undefined
  let consultaNombre: AbortController | undefined
  let yaIngreso = false
  let presenciaInicial: string[] | null = null
  let tokenHandshake: string | undefined
  let forzarToken = false
  let recuperacionAuth = false
  let renovacion: ReturnType<typeof setTimeout> | undefined
  let esperaHandshake: ReturnType<typeof setTimeout> | undefined
  let envioPendiente = false
  let reingresoHistorial = false
  const recibidos = new Map<string, Message>()
  const antesDelIngreso = new Map<string, Message>()
  const propiosPendientes = new Map<string, Message>()

  const vigente = () => !cerrado && !saliendo && auth.currentUser === user
  const canal = crearSocketSala(url, enviar => {
    const intento = version
    clearTimeout(esperaHandshake)
    esperaHandshake = setTimeout(() => {
      if (vigente() && intento === version) fallo('No pudimos verificar la conexión con la sala.')
    }, ESPERA_ACK)

    const renovar = forzarToken
    forzarToken = false
    void user.getIdTokenResult(renovar).then(resultado => {
      if (!vigente() || intento !== version) return
      tokenHandshake = resultado.token
      clearTimeout(renovacion)
      renovacion = setTimeout(() => {
        if (vigente() && canal.connected) reconectar(true)
      }, Math.max(1_000, Date.parse(resultado.expirationTime) - Date.now() - 45_000))
      enviar({ token: resultado.token })
    }).catch((error: unknown) => {
      if (!vigente() || intento !== version) return
      if (esObjeto(error) && error.code === 'auth/network-request-failed') {
        fallo('No pudimos verificar tu conexión. Inténtalo nuevamente.')
      } else {
        denegar(erroresRealtime.UNAUTHENTICATED)
      }
    })
  })

  let desuscribirToken: (() => void) | undefined
  const miembros = crearDirectorioSala(roomId, vigente, setDirectorio, codigo => denegar(erroresRealtime[codigo]))

  const historial = crearHistorialSala(roomId, {
    consultar: before => canal.timeout(ESPERA_ACK).emitWithAck('chat:history', {
      roomId, limit: TAMANO_PAGINA, ...(before === undefined ? {} : { before }),
    }),
    publicar: setHistorial,
    incorporar: mensajes => {
      reingresoHistorial = false
      return combinar(mensajes)
    },
    resolverError(codigo) {
      if (codigo === 'NOT_JOINED' || codigo === 'UNAUTHENTICATED') {
        if (reingresoHistorial) {
          if (codigo === 'UNAUTHENTICATED') denegar(erroresRealtime.UNAUTHENTICATED)
          else fallo('No pudimos recuperar el acceso al canal de la sala.')
          return
        }
        reingresoHistorial = true
      }
      resolverError(codigo)
    },
    vigente,
  })

  function publicarNombre(nombre: string) {
    if (nombreActual === nombre) return
    nombreActual = nombre
    setNombre(nombre)
  }

  function reconciliarNombre(nombreEvento?: string) {
    consultaNombre?.abort()
    const solicitud = new AbortController()
    consultaNombre = solicitud
    const revision = revisionNombre
    const vigenteConsulta = () => vigente() && !solicitud.signal.aborted && revision === revisionNombre

    void consultarSalaConPlazo(roomId, solicitud.signal)
      .then(sala => {
        if (!vigenteConsulta()) return
        revisionNombre++
        nombreConfirmadoPorRest = undefined
        publicarNombre(sala.name)
      })
      .catch((error: unknown) => {
        if (!vigenteConsulta()) return
        if (error instanceof ErrorSala && [401, 403, 404].includes(error.status ?? 0)) {
          denegar(error.status === 401 ? erroresRealtime.UNAUTHENTICATED : erroresRealtime.INVALID_ROOM)
        } else if (nombreEvento) {
          nombreConfirmadoPorRest = undefined
          publicarNombre(nombreEvento)
        }
      })
      .finally(() => {
        if (consultaNombre === solicitud) consultaNombre = undefined
      })
  }

  function perderPresencia() {
    historial.interrumpir()
    consultaNombre?.abort()
    version++
    unido = false
    presenciaInicial = null
    antesDelIngreso.clear()
    clearTimeout(renovacion)
    clearTimeout(esperaHandshake)
    setPresencia(null)
    // Un paquete pendiente de transporte no debe salir después de reconectar.
    canal.sendBuffer.length = 0
  }

  function cerrar() {
    cerrado = true
    miembros.cerrar()
    consultaNombre?.abort()
    historial.cerrar()
    clearTimeout(renovacion)
    clearTimeout(esperaHandshake)
    desuscribirToken?.()
    canal.removeAllListeners()
    canal.io.removeAllListeners()
    canal.sendBuffer.length = 0
    canal.disconnect()
  }

  function denegar(texto: string) {
    cerrar()
    recibidos.clear()
    antesDelIngreso.clear()
    propiosPendientes.clear()
    setPresencia(null)
    setMensajes([])
    setHistorial(historialInicial)
    setMensajeEnVivo(undefined)
    setDirectorio(directorioVacio)
    setNombre(undefined)
    setPuedeReintentar(false)
    setConexion({ estado: 'denied', texto })
  }

  function fallo(texto: string) {
    perderPresencia()
    canal.disconnect()
    setPuedeReintentar(true)
    setConexion({ estado: 'failed', texto })
  }

  function reconectar(renovarToken = false) {
    if (!vigente()) return
    perderPresencia()
    canal.disconnect()
    forzarToken = renovarToken
    setPuedeReintentar(false)
    setAviso('')
    setConexion({ estado: 'reconnecting', texto: 'Reconectando con la sala…' })
    canal.connect()
  }

  function recuperarAutenticacion() {
    if (recuperacionAuth) {
      denegar(erroresRealtime.UNAUTHENTICATED)
      return
    }
    recuperacionAuth = true
    reconectar(true)
  }

  function resolverError(codigo: CodigoRealtime) {
    if (codigo === 'FORBIDDEN' || codigo === 'INVALID_ROOM') denegar(erroresRealtime[codigo])
    if (codigo === 'UNAUTHENTICATED') recuperarAutenticacion()
    if (codigo === 'NOT_JOINED') reconectar()
  }

  function actualizarPresencia(uids: string[]) {
    setPresencia(uids)
    miembros.resolver(uids)
  }

  function combinar(mensajes: Iterable<Message>) {
    if (!vigente() || !unido) return 0
    const nuevos = incorporarMensajes(recibidos, mensajes)
    if (nuevos.length) {
      miembros.resolver(nuevos.map(mensaje => mensaje.authorUid))
      setMensajes(ordenarMensajes(recibidos.values()))
    }
    return nuevos.length
  }

  function agregarMensaje(mensaje: Message) {
    if (combinar([mensaje])) setMensajeEnVivo(mensaje)
  }

  function confirmarIngreso() {
    unido = true
    recuperacionAuth = false
    setConexion({ estado: 'connected', texto: 'Conectado a la sala' })
    if (presenciaInicial !== null) actualizarPresencia(presenciaInicial)
    antesDelIngreso.forEach(agregarMensaje)
    antesDelIngreso.clear()
    historial.ingresar()
    if (yaIngreso) reconciliarNombre()
    yaIngreso = true
  }

  canal.on('connect', async () => {
    if (!vigente()) return
    clearTimeout(esperaHandshake)
    const intento = version
    try {
      const respuesta = await canal.timeout(ESPERA_ACK).emitWithAck('room:join', { roomId })
      if (!vigente() || intento !== version) return
      if (esObjeto(respuesta) && respuesta.ok === true && esDeSala(respuesta.data, roomId)) {
        confirmarIngreso()
        return
      }

      const codigo = codigoRealtime(esObjeto(respuesta) ? respuesta.error : null)
      if (codigo === 'INVALID_ROOM' || codigo === 'FORBIDDEN' || codigo === 'UNAUTHENTICATED') {
        resolverError(codigo)
      } else {
        fallo('No pudimos ingresar al canal de la sala.')
      }
    } catch {
      if (vigente() && intento === version) fallo('No pudimos confirmar el ingreso a la sala.')
    }
  })

  canal.on('connect_error', error => {
    if (!vigente()) return
    clearTimeout(esperaHandshake)
    if ('data' in error && codigoRealtime(error.data) === 'UNAUTHENTICATED') {
      recuperarAutenticacion()
    } else if (!canal.active) {
      fallo('No fue posible conectar con la sala.')
    } else {
      perderPresencia()
      setConexion({ estado: 'lost', texto: 'Conexión interrumpida. Intentaremos restablecerla.' })
    }
  })

  canal.on('disconnect', () => {
    if (!vigente()) return
    perderPresencia()
    if (canal.active) {
      setConexion({ estado: 'lost', texto: 'Conexión perdida. Intentaremos restablecerla.' })
    } else {
      setPuedeReintentar(true)
      setConexion({ estado: 'failed', texto: 'Se cerró la conexión con la sala.' })
    }
  })

  canal.io.on('reconnect_attempt', () => {
    if (vigente()) setConexion({ estado: 'reconnecting', texto: 'Reconectando con la sala…' })
  })
  canal.io.on('reconnect_failed', () => {
    if (vigente()) fallo('No fue posible restablecer la conexión con la sala.')
  })

  canal.on('room:users', payload => {
    if (!vigente() || !esDeSala(payload, roomId) || !Array.isArray(payload.users) ||
        !payload.users.every((uid: unknown): uid is string => typeof uid === 'string' && Boolean(uid.trim()))) return

    presenciaInicial = [...new Set<string>(payload.users)]
    if (unido) actualizarPresencia(presenciaInicial)
  })
  canal.on('chat:message', payload => {
    if (!vigente() || !esMensaje(payload, roomId)) return
    if (!unido) {
      antesDelIngreso.set(payload.id, payload)
    } else if (envioPendiente && payload.authorUid === user.uid) {
      // El servidor puede emitir el mensaje persistido antes de su confirmación.
      propiosPendientes.set(payload.id, payload)
    } else {
      agregarMensaje(payload)
    }
  })
  canal.on('room:updated', payload => {
    if (vigente() && esDeSala(payload, roomId) && typeof payload.name === 'string' && payload.name.trim()) {
      revisionNombre++
      consultaNombre?.abort()
      if (nombreConfirmadoPorRest !== undefined && payload.name !== nombreConfirmadoPorRest) {
        reconciliarNombre(payload.name)
      } else {
        nombreConfirmadoPorRest = undefined
        publicarNombre(payload.name)
      }
    }
  })
  canal.on('room:deleted', payload => {
    if (vigente() && esDeSala(payload, roomId)) denegar('La sala ya no está disponible.')
  })
  canal.on('room:error', payload => {
    if (!vigente()) return
    const codigo = codigoRealtime(payload)
    if (codigo === 'INTERNAL_ERROR') {
      // El observador del servidor puede haber retirado el socket del canal.
      fallo('No pudimos verificar el estado de la sala.')
    } else {
      resolverError(codigo)
      if (codigo === 'INVALID_MESSAGE' || codigo === 'PERSISTENCE_ERROR') setAviso(erroresRealtime[codigo])
    }
  })

  function iniciarEnvio() {
    envioPendiente = true
  }

  function finalizarEnvio() {
    envioPendiente = false
    if (vigente()) propiosPendientes.forEach(agregarMensaje)
    propiosPendientes.clear()
  }

  function iniciarSalida() {
    saliendo = true
    historial.cerrar()
    setPresencia(null)
    setConexion({ estado: 'leaving', texto: 'Saliendo de la sala…' })
  }

  function reintentarPerfiles() {
    miembros.reintentar([
      ...(presenciaInicial ?? []),
      ...[...recibidos.values()].map(mensaje => mensaje.authorUid),
    ])
  }

  const acciones: Acciones = {
    async editarNombre(nombre, signal) {
      if (!vigente()) throw new ErrorSala('autenticacion')
      const revision = revisionNombre
      try {
        const resultado = await guardarNombreSala(roomId, nombre, signal)
        if (!vigente() || signal.aborted) return false
        if (revision === revisionNombre) {
          consultaNombre?.abort()
          nombreConfirmadoPorRest = resultado.sala.name
          publicarNombre(resultado.sala.name)
        } else if (nombreActual !== resultado.sala.name) {
          // Los eventos y las respuestas REST no incluyen una versión común.
          reconciliarNombre()
        }
        return resultado.confirmado
      } catch (error) {
        if (vigente() && !signal.aborted && error instanceof ErrorSala) {
          if (error.status === 404) denegar(erroresRealtime.INVALID_ROOM)
          else if (error.status === 401) denegar(erroresRealtime.UNAUTHENTICATED)
          else if (error.status === 403) reconciliarNombre()
        }
        throw error
      }
    },
    async enviar(content) {
      const texto = content.trim()
      if (!texto || texto.length > LIMITE_MENSAJE) return erroresRealtime.INVALID_MESSAGE
      if (!vigente() || !unido || !canal.connected) return 'Espera a que se restablezca la conexión.'
      if (envioPendiente) return 'Espera la confirmación del mensaje anterior.'

      iniciarEnvio()
      const intento = version
      try {
        const respuesta = await canal.timeout(ESPERA_ACK).emitWithAck('chat:send', { roomId, content: texto })
        if (!vigente() || intento !== version) return noConfirmado
        if (esObjeto(respuesta) && respuesta.ok === true &&
            esMensaje(respuesta.data, roomId) && respuesta.data.authorUid === user.uid) {
          agregarMensaje(respuesta.data)
          return null
        }

        if (!esObjeto(respuesta) || respuesta.ok !== false) return noConfirmado
        const codigo = codigoRealtime(respuesta.error)
        resolverError(codigo)
        return erroresRealtime[codigo]
      } catch {
        return noConfirmado
      } finally {
        finalizarEnvio()
      }
    },
    async salir() {
      if (cerrado || saliendo) return
      iniciarSalida()
      try {
        if (canal.connected) await canal.timeout(ESPERA_SALIDA).emitWithAck('room:leave', { roomId })
      } catch {
        // La desconexión también retira la presencia en el servidor.
      } finally {
        cerrar()
      }
    },
    reintentarPerfiles,
    cargarAnteriores: historial.cargarAnteriores,
    reintentarHistorial: historial.reintentar,
    reintentar() {
      reingresoHistorial = false
      reintentarPerfiles()
      reconectar()
    },
  }

  desuscribirToken = onIdTokenChanged(auth, identidad => {
    if (cerrado || saliendo) return
    if (identidad !== user) {
      denegar(erroresRealtime.UNAUTHENTICATED)
      return
    }
    if (!canal.connected || !tokenHandshake) return
    void identidad.getIdToken().then(token => {
      if (vigente() && canal.connected && tokenHandshake !== token) reconectar()
    }).catch(() => {
      if (vigente() && canal.connected) recuperarAutenticacion()
    })
  })
  miembros.iniciar()
  canal.connect()

  return { acciones, cerrar }
}

export type SesionSala = ReturnType<typeof useRoomSocket>
