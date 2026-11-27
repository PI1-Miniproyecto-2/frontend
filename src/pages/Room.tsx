import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigationType, useParams } from 'react-router-dom'
import { ArrowLeft, CameraOff, Copy, MessageCircle, MicOff, MonitorUp, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  ErrorSala,
  mensajeErrorSala,
  obtenerSala,
  PATRON_CODIGO_SALA,
  type Sala,
} from '../services/RoomsService'

type EstadoSala =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string; reintentar: boolean }
  | { tipo: 'lista'; sala: Sala }

const focoClaro = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70DCCB]'
const volver = 'inline-flex min-h-10 items-center rounded-lg bg-[#047857] px-4 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]'

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
      uid={user.uid}
      confirmarIngreso={tipoNavegacion === 'PUSH' && location.state?.salaUnida === codigo}
    />
  )
}

function SalaAutorizada({ codigo, uid, confirmarIngreso }: {
  codigo: string
  uid: string
  confirmarIngreso: boolean
}) {
  const [estado, setEstado] = useState<EstadoSala>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)
  const [chatAbierto, setChatAbierto] = useState(true)
  const [mensajeCopia, setMensajeCopia] = useState('')
  const encabezado = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const solicitud = new AbortController()

    async function cargarSala() {
      try {
        const sala = await obtenerSala(codigo, solicitud.signal)
        if (solicitud.signal.aborted) return

        if (sala.ownerUid !== uid && !sala.participantUids.includes(uid)) {
          throw new ErrorSala('http', 404)
        }
        setEstado({ tipo: 'lista', sala })
      } catch (error) {
        if (solicitud.signal.aborted) return

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
  }, [codigo, intento, uid])

  useEffect(() => {
    encabezado.current?.focus()
  }, [estado.tipo])

  async function copiarCodigo(roomId: string) {
    try {
      await navigator.clipboard.writeText(roomId)
      setMensajeCopia('Código copiado.')
    } catch {
      setMensajeCopia('No se pudo copiar el código. Puedes seleccionarlo y copiarlo manualmente.')
    }
  }

  if (estado.tipo === 'cargando') {
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

  const { sala } = estado
  const rol = sala.ownerUid === uid ? 'Anfitrión' : 'Participante'

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col rounded-xl bg-[#062E33] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-white/10 bg-[#05272C] px-4 py-3">
        <div className="min-w-0">
          <h1 tabIndex={-1} ref={encabezado} aria-describedby={confirmarIngreso ? 'confirmacion-ingreso' : undefined} className="text-xl font-bold wrap-anywhere">{sala.name}</h1>
          <p className="text-sm text-teal-100 wrap-anywhere">Código: {sala.roomId}</p>
          <p className="text-sm text-teal-100">{rol}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copiarCodigo(sala.roomId)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/50 px-3 py-2 hover:bg-white/10 ${focoClaro}`}
          >
            <Copy size={15} aria-hidden="true" />
            Copiar código
          </button>
          <Link
            to="/rooms"
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-800 px-3 py-2 font-semibold hover:bg-red-900 ${focoClaro}`}
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Salir de la sala
          </Link>
        </div>
      </header>

      <div className="px-4 text-sm text-teal-100">
        {confirmarIngreso && <p id="confirmacion-ingreso" className="pt-3">Ingresaste a la sala.</p>}
        <p role="status" className={mensajeCopia ? 'pt-3' : undefined}>{mensajeCopia}</p>
      </div>

      <div className="flex flex-1 flex-col xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid flex-1 gap-2 p-3 sm:grid-cols-2">
            <div className="flex min-h-40 items-center justify-center rounded-xl border-2 border-[#13B8A6] bg-[#103E43]">
              <span className="grid size-20 place-items-center rounded-full bg-[#B8E8E2] text-xl font-bold text-[#073B43]">Tú</span>
            </div>
            <div className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-[#10383E] p-4 text-center">
              <Users size={32} className="mb-3 text-[#70DCCB]" aria-hidden="true" />
              <p>Comparte el código para invitar a tus compañeros.</p>
              <p className="mt-1 text-sm text-teal-100">La presencia en tiempo real estará disponible más adelante.</p>
            </div>
          </div>

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
                onClick={() => setChatAbierto(!chatAbierto)}
                aria-expanded={chatAbierto}
                aria-controls="chat-sala"
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#70DCCB] px-3 py-2 font-semibold text-[#073B43] ${focoClaro}`}
              >
                <MessageCircle size={17} aria-hidden="true" />
                {chatAbierto ? 'Ocultar chat' : 'Mostrar chat'}
              </button>
            </div>
            <p className="mt-3 text-sm text-teal-100">El micrófono, la cámara y la pantalla compartida estarán disponibles más adelante.</p>
          </footer>
        </div>

        <aside id="chat-sala" hidden={!chatAbierto} className="rounded-b-xl border-t border-gray-200 bg-white p-4 text-[#073B43] xl:w-64 xl:rounded-bl-none xl:border-l xl:border-t-0">
          <h2 className="font-bold">Chat de la sala</h2>
          <p className="mt-2 text-sm">La mensajería en tiempo real aún no está disponible.</p>
        </aside>
      </div>
    </div>
  )
}

export default Room
