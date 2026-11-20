
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  obtenerMisSalas,
  type Sala,
} from '../services/RoomsService'
import {
  Plus,
  Link as LinkIcon,
  ArrowRight,
  BookOpen,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'

function Dashboard() {
  const navigate = useNavigate()
  const { perfil, user } = useAuth()

  const [roomCode, setRoomCode] = useState('')
  const [salas, setSalas] = useState<Sala[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorSalas, setErrorSalas] = useState('')
  const [copiadoId, setCopiadoId] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')

  const nombre =
    perfil?.firstName?.trim() ||
    user?.displayName?.split(' ')[0] ||
    'Estudiante'

  const apellido = perfil?.lastName?.trim() || ''
  const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ')
  const iniciales =
    `${nombre.charAt(0)}${apellido.charAt(0) || ''}`.toUpperCase()

  const fechaActual = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  useEffect(() => {
    let activo = true

    async function cargarSalas() {
      try {
        setCargando(true)
        setErrorSalas('')

        const resultado = await obtenerMisSalas()

        if (!activo) return

        if (!Array.isArray(resultado)) {
          throw new Error('Formato de salas inválido')
        }

        setSalas(resultado)
      } catch {
        if (activo) {
          setErrorSalas(
            'No pudimos cargar tus salas recientes.'
          )
        }
      } finally {
        if (activo) setCargando(false)
      }
    }

    void cargarSalas()

    return () => {
      activo = false
    }
  }, [])

  const salasRecientes = [...salas]
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
    )
    .slice(0, 5)

  const handleJoinRoom = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!roomCode.trim()) return

    // El ingreso de participantes por código se integrará
    // cuando el backend permita validar y registrar el acceso.
    setMensaje(
      'El ingreso de participantes por código todavía no está disponible.'
    )
  }

  async function copiarId(roomId: string) {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopiadoId(roomId)
      setMensaje('Identificador de sala copiado correctamente.')
    } catch {
      setCopiadoId(null)
      setMensaje('No se pudo copiar el identificador.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          Salas conectadas con la API
        </span>

        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-900"
          aria-label={`Usuario ${nombreCompleto}`}
          role="img"
        >
          {iniciales}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {mensaje}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-3xl bg-[#0A3C3E] p-8 text-white lg:col-span-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              {fechaActual}
            </p>

            <h2 className="mb-1 text-3xl font-bold">
              ¡Hola, {nombre}!
            </h2>

            <p className="text-sm text-emerald-100">
              ¿Qué vamos a estudiar hoy?
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/rooms/create')}
              className="flex items-center gap-2 rounded-xl bg-[#047857] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#065F46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A3C3E]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Crear sala
            </button>

            <button
              type="button"
              onClick={() =>
                document.getElementById('room-code')?.focus()
              }
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-[#0A3C3E] transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A3C3E]"
            >
              <LinkIcon className="h-4 w-4" aria-hidden="true" />
              Ingresar un código
            </button>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="mb-1 text-lg font-bold text-gray-900">
              Únete a una sala
            </h3>

            <p className="mb-4 text-xs text-gray-600">
              Pega el código que te compartió tu compañero.
            </p>

            <form onSubmit={handleJoinRoom} className="space-y-3">
              <div>
                <label
                  htmlFor="room-code"
                  className="mb-1 block text-xs font-medium text-gray-800"
                >
                  Código de acceso
                </label>

                <input
                  id="room-code"
                  name="roomCode"
                  type="text"
                  placeholder="Pega el ID de la sala"
                  autoComplete="off"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus-visible:border-[#047857] focus-visible:ring-2 focus-visible:ring-[#047857]"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#86EFAC] py-2.5 text-sm font-semibold text-[#0A3C3E] transition-colors hover:bg-[#6EE7B7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] focus-visible:ring-offset-2"
              >
                Unirse a una sala
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      </div>

      <section aria-labelledby="salas-recientes-titulo">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              TUS ESPACIOS
            </p>

            <h3
              id="salas-recientes-titulo"
              className="text-xl font-bold text-gray-900"
            >
              Mis salas recientes
            </h3>
          </div>

          <button
            type="button"
            onClick={() => navigate('/rooms')}
            className="flex items-center gap-1 rounded text-sm font-semibold text-[#047857] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] focus-visible:ring-offset-2"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {cargando ? (
          <div
            role="status"
            className="rounded-2xl border border-gray-200 bg-white p-8 text-center"
          >
            <RefreshCw
              className="mx-auto mb-3 h-7 w-7 animate-spin text-[#047857]"
              aria-hidden="true"
            />
            <p className="text-sm text-gray-700">
              Cargando tus salas recientes...
            </p>
          </div>
        ) : errorSalas ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-white p-8 text-center"
          >
            <AlertCircle
              className="mx-auto mb-3 h-7 w-7 text-red-600"
              aria-hidden="true"
            />
            <p className="text-sm text-gray-700">
              {errorSalas}
            </p>

            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="mt-4 rounded-xl bg-[#047857] px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]"
            >
              Ir a Mis salas
            </button>
          </div>
        ) : salasRecientes.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <BookOpen
              className="mx-auto mb-3 h-9 w-9 text-[#047857]"
              aria-hidden="true"
            />

            <h4 className="font-bold text-[#0A3C3E]">
              Aún no tienes salas
            </h4>

            <p className="mt-2 text-sm text-gray-600">
              Crea tu primera sala de estudio para comenzar.
            </p>

            <button
              type="button"
              onClick={() => navigate('/rooms/create')}
              className="mt-4 rounded-xl bg-[#047857] px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]"
            >
              Crear mi primera sala
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {salasRecientes.map((sala) => (
              <article
                key={sala.roomId}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-[#047857]">
                    <BookOpen
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void copiarId(sala.roomId)}
                    aria-label={`Copiar ID de ${sala.name}`}
                    className="rounded-lg p-2 text-gray-600 hover:text-[#047857] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
                    title="Copiar ID de sala"
                  >
                    {copiadoId === sala.roomId ? (
                      <Check
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <Copy
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>

                <h4 className="mb-2 break-words font-bold text-gray-900">
                  {sala.name}
                </h4>

                <p className="mb-4 break-all font-mono text-xs text-gray-600">
                  ID: {sala.roomId}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/room/${encodeURIComponent(sala.roomId)}`
                    )
                  }
                  className="flex items-center gap-1 text-sm font-semibold text-[#047857] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] focus-visible:ring-offset-2"
                >
                  Ingresar a la sala
                  <ArrowRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Dashboard
