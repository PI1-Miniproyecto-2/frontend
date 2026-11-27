import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useNavigationType, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, CameraOff, Copy, MessageCircle, MicOff, MonitorUp } from 'lucide-react'
import type { User } from 'firebase/auth'
import EditRoomModal from '../components/EditRoomModal'
import ParticipantsList from '../components/ParticipantsList'
import RoomChat from '../components/RoomChat'
import { useRoomSocket } from '../hooks/useRoomSocket'
import { useAuth } from '../context/AuthContext'
import { auth } from '../services/Firebase'
import {
  ErrorSala,
  guardarNombreSala,
  mensajeErrorSala,
  obtenerSala,
  PATRON_CODIGO_SALA,
  type Sala,
} from '../services/RoomsService'

type EstadoSala =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string; reintentar: boolean }
  | { tipo: 'lista'; sala: Sala; user: User }

const focoClaro = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70DCCB]'
const volver = 'inline-flex min-h-11 items-center rounded-lg bg-[#047857] px-4 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]'

function Room() {
  const codigo = useParams().id?.trim() ?? ''
  const { user } = useAuth()
  const location = useLocation()
  const tipoNavegacion = useNavigationType()

  if (!PATRON_CODIGO_SALA.test(codigo)) {
    return (
      <section className="rounded-xl bg-white p-5">
        <h1 className="text-xl font-bold">Código de sala inválido</h1>
        <p className="my-3">El código debe contener 20 letras o números.</p>
        <Link to="/dashboard" className={volver}>Volver al panel principal</Link>
      </section>
    )
  }

  if (!user) return null

  return (
    <SalaAutorizada
      key={JSON.stringify([user.uid, codigo, location.key])}
      codigo={codigo}
      user={user}
      confirmarIngreso={tipoNavegacion === 'PUSH' && location.state?.salaUnida === codigo}
    />
  )
}

function SalaAutorizada({ codigo, user, confirmarIngreso }: {
  codigo: string
  user: User
  confirmarIngreso: boolean
}) {
  const [estado, setEstado] = useState<EstadoSala>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)
  const encabezado = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const solicitud = new AbortController()

    async function cargarSala() {
      try {
        if (auth.currentUser !== user) return
        const sala = await obtenerSala(codigo, solicitud.signal)
        if (solicitud.signal.aborted || auth.currentUser !== user) return

        if (sala.ownerUid !== user.uid && !sala.participantUids.includes(user.uid)) {
          throw new ErrorSala('http', 404)
        }
        setEstado({ tipo: 'lista', sala, user })
      } catch (error) {
        if (solicitud.signal.aborted || auth.currentUser !== user) return

        setEstado({
          tipo: 'error',
          mensaje: mensajeErrorSala(error, 'abrir'),
          reintentar: !(error instanceof ErrorSala) ||
            error.tipo === 'conexion' || error.tipo === 'respuesta' ||
            (error.status !== undefined && error.status >= 500),
        })
      }
    }

    void cargarSala()
    return () => solicitud.abort()
  }, [codigo, intento, user])

  useEffect(() => {
    encabezado.current?.focus()
  }, [estado.tipo])

  if (estado.tipo === 'cargando' || (estado.tipo === 'lista' && estado.user !== user)) {
    return (
      <section className="rounded-xl bg-white p-5">
        <h1 tabIndex={-1} ref={encabezado} className="text-xl font-bold">Abriendo sala</h1>
        <p role="status" className="my-3">Verificando tu acceso a la sala...</p>
        <Link to="/rooms" className={volver}>Volver a Mis salas</Link>
      </section>
    )
  }

  if (estado.tipo === 'error') {
    return (
      <section className="rounded-xl bg-white p-5">
        <h1 tabIndex={-1} ref={encabezado} className="text-xl font-bold">Sala no disponible</h1>
        <p role="alert" className="my-3 text-red-800">{estado.mensaje}</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard" className={volver}>Volver al panel principal</Link>
          {estado.reintentar && (
            <button
              type="button"
              className={volver}
              onClick={() => {
                setEstado({ tipo: 'cargando' })
                setIntento(intento + 1)
              }}
            >
              Reintentar
            </button>
          )}
        </div>
      </section>
    )
  }

  return <InteriorSala sala={estado.sala} user={user} confirmarIngreso={confirmarIngreso} />
}

function InteriorSala({ sala, user, confirmarIngreso }: {
  sala: Sala
  user: User
  confirmarIngreso: boolean
}) {
  const sesion = useRoomSocket(sala.roomId, user)
  const navegar = useNavigate()
  const [chatAbierto, setChatAbierto] = useState(true)
  const [mensajeCopia, setMensajeCopia] = useState('')
  const [confirmacionEdicion, setConfirmacionEdicion] = useState('')
  const [nombreRest, setNombreRest] = useState<string>()
  const nombre = sesion.nombre ?? nombreRest ?? sala.name
  const encabezado = useRef<HTMLHeadingElement>(null)
  const salidaEnCurso = useRef(false)
  const montado = useRef(false)
  const [errorAccesoRest, setErrorAccesoRest] = useState('')
  const denegado = sesion.conexion.estado === 'denied' || Boolean(errorAccesoRest)
  const rol = sala.ownerUid === user.uid ? 'Anfitrión' : 'Participante'

  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])

  useEffect(() => {
    encabezado.current?.focus()
  }, [denegado])

  async function salir() {
    if (salidaEnCurso.current) return
    salidaEnCurso.current = true
    await sesion.acciones.current?.salir()
    if (montado.current) navegar('/rooms')
  }

  async function copiarCodigo(roomId: string) {
    try {
      await navigator.clipboard.writeText(roomId)
      setMensajeCopia('Código copiado.')
    } catch {
      setMensajeCopia('No se pudo copiar el código. Puedes seleccionarlo y copiarlo manualmente.')
    }
  }

  if (denegado) {
    return (
      <section className="rounded-xl bg-white p-5">
        <h1 tabIndex={-1} ref={encabezado} className="text-xl font-bold">Sala no disponible</h1>
        <p role="alert" className="my-3 text-red-800">{errorAccesoRest || sesion.conexion.texto}</p>
        <Link to="/rooms" className={volver}>Volver a Mis salas</Link>
      </section>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col rounded-xl bg-[#062E33] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-white/10 bg-[#05272C] px-4 py-3">
        <div className="min-w-0">
          <h1 tabIndex={-1} ref={encabezado} aria-describedby={confirmarIngreso ? 'confirmacion-ingreso' : undefined} className="text-xl font-bold wrap-anywhere">{nombre}</h1>
          <p className="text-sm text-teal-100 wrap-anywhere">Código: {sala.roomId}</p>
          <p className="text-sm text-teal-100">{rol}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {sala.ownerUid === user.uid && sesion.conexion.estado !== 'leaving' && (
            <EditRoomModal sala={{ ...sala, name: nombre }} user={user}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/50 px-3 py-2 hover:bg-white/10 ${focoClaro}`}
              onGuardar={async (nuevo, signal) => {
                setConfirmacionEdicion('')
                if (sesion.acciones.current) return sesion.acciones.current.editarNombre(nuevo, signal)
                try {
                  const resultado = await guardarNombreSala(sala.roomId, nuevo, signal)
                  if (!signal.aborted && auth.currentUser === user) setNombreRest(resultado.sala.name)
                  return resultado.confirmado
                } catch (error) {
                  if (!signal.aborted && auth.currentUser === user && error instanceof ErrorSala && error.status === 404) {
                    setErrorAccesoRest('La sala ya no está disponible.')
                  }
                  throw error
                }
              }}
              onGuardado={() => setConfirmacionEdicion('El nombre de la sala se actualizó correctamente.')} />
          )}
          <button
            type="button"
            onClick={() => void copiarCodigo(sala.roomId)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/50 px-3 py-2 hover:bg-white/10 ${focoClaro}`}
          >
            <Copy size={15} aria-hidden="true" />
            Copiar código
          </button>
          <button
            type="button"
            onClick={() => void salir()}
            aria-disabled={sesion.conexion.estado === 'leaving'}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-800 px-3 py-2 font-semibold hover:bg-red-900 ${focoClaro}`}
          >
            <ArrowLeft size={17} aria-hidden="true" />
            {sesion.conexion.estado === 'leaving' ? 'Saliendo de la sala…' : 'Salir de la sala'}
          </button>
        </div>
      </header>

      {!chatAbierto && <p role="status" className="px-4 pt-3 text-sm text-teal-100">{sesion.conexion.texto}</p>}
      <div className="px-4 text-sm text-teal-100">
        {confirmarIngreso && <p id="confirmacion-ingreso" className="pt-3">Ingresaste a la sala.</p>}
        <p role="status" className="sr-only">
          {sala.ownerUid !== user.uid && sesion.nombre !== undefined ? `Nombre de la sala: ${nombre}.` : ''}
        </p>
        <p role="status" className="pt-3 font-semibold empty:sr-only">{confirmacionEdicion}</p>
        <p role="status" className={mensajeCopia ? 'pt-3' : undefined}>{mensajeCopia}</p>
      </div>

      <div className={`grid flex-1 items-start gap-3 p-3 ${chatAbierto ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]' : ''}`}>
        <div className="min-w-0 space-y-3">
          <section aria-labelledby="estudio-titulo" className="flex items-center gap-3 rounded-xl bg-[#0A3C3E] p-4">
            <BookOpen size={24} className="shrink-0 text-[#70DCCB]" aria-hidden="true" />
            <h2 id="estudio-titulo" className="text-lg font-bold">Espacio de estudio</h2>
          </section>
          <ParticipantsList sesion={sesion} ownerUid={sala.ownerUid} uid={user.uid} />

          <footer className="border-t border-white/10 px-4 py-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" disabled aria-label="Micrófono no disponible" className="rounded-full bg-white/15 p-3">
                <MicOff size={20} aria-hidden="true" />
              </button>
              <button type="button" disabled aria-label="Cámara no disponible" className="rounded-full bg-white/15 p-3">
                <CameraOff size={20} aria-hidden="true" />
              </button>
              <button type="button" disabled aria-label="Compartir pantalla no disponible" className="rounded-full bg-white/15 p-3">
                <MonitorUp size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setChatAbierto(actual => !actual)}
                aria-expanded={chatAbierto}
                aria-controls="chat-sala"
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#70DCCB] px-3 py-2 font-semibold text-[#073B43] ${focoClaro}`}
              >
                <MessageCircle size={17} aria-hidden="true" />
                {chatAbierto ? 'Ocultar chat' : 'Mostrar chat'}
              </button>
            </div>
            <p className="mt-3 text-sm text-teal-100">El micrófono, la cámara y la pantalla compartida estarán disponibles más adelante.</p>
          </footer>
        </div>

        <RoomChat sesion={sesion} uid={user.uid} visible={chatAbierto} />
      </div>
    </div>
  )
}

export default Room
