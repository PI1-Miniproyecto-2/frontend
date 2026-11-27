
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Check,
  Copy,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import EditRoomModal from '../components/EditRoomModal'
import { useAuth } from '../context/AuthContext'
import { auth } from '../services/Firebase'
import {
  guardarNombreSala,
  obtenerMisSalas,
  type Sala,
} from '../services/RoomsService'

function Rooms() {
  const { user } = useAuth()
  const [salas, setSalas] = useState<Sala[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [copiadoId, setCopiadoId] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const consulta = useRef<AbortController | null>(null)

  const cargarSalas = useCallback(async () => {
    if (!user || auth.currentUser !== user) return
    consulta.current?.abort()
    const solicitud = new AbortController()
    consulta.current = solicitud
    const vigente = () => !solicitud.signal.aborted && auth.currentUser === user
    setCargando(true)
    setError('')

    try {
      const resultado = await obtenerMisSalas(solicitud.signal)
      if (vigente()) setSalas(resultado)
    } catch {
      if (vigente()) setError(
        'No pudimos cargar tus salas. Comprueba tu conexión e inténtalo nuevamente.'
      )
    } finally {
      if (vigente()) setCargando(false)
    }
  }, [user])

  useEffect(() => {
    void cargarSalas()
    return () => consulta.current?.abort()
  }, [cargarSalas])

  async function copiarId(roomId: string) {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopiadoId(roomId)
      setMensaje('Identificador copiado correctamente.')
    } catch {
      setCopiadoId(null)
      setMensaje('No se pudo copiar el identificador. Inténtalo de nuevo.')
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#073B43]">
            Mis salas de estudio
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Consulta tus salas y comparte sus identificadores con tus compañeros.
          </p>
        </div>

        <Link
          to="/rooms/create"
          className="inline-flex items-center gap-2 rounded-xl bg-[#70DCCB] px-5 py-3 text-sm font-semibold text-[#073B43] hover:bg-[#50CDBA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F77]"
        >
          <Plus size={18} aria-hidden="true" />
          Crear sala
        </Link>
      </header>

      <p className="sr-only" role="status" aria-live="polite">
        {mensaje}
      </p>

      <p role="status" className="mb-4 font-semibold break-words text-[#047857] empty:sr-only">{confirmacion}</p>

      {cargando ? (
        <div
          role="status"
          className="rounded-2xl border border-gray-200 bg-white p-10 text-center"
        >
          <RefreshCw
            size={30}
            className="mx-auto mb-4 animate-spin text-[#087F77]"
            aria-hidden="true"
          />
          <p className="font-medium text-[#073B43]">
            Cargando tus salas...
          </p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-white p-10 text-center"
        >
          <AlertCircle
            size={32}
            className="mx-auto mb-4 text-red-600"
            aria-hidden="true"
          />

          <h2 className="text-lg font-semibold text-[#073B43]">
            No pudimos mostrar tus salas
          </h2>

          <p className="mt-2 text-sm text-gray-600">{error}</p>

          <button
            type="button"
            onClick={() => void cargarSalas()}
            className="mt-5 rounded-xl bg-[#70DCCB] px-5 py-3 font-semibold text-[#073B43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F77]"
          >
            Intentar nuevamente
          </button>
        </div>
      ) : salas.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#DDF7F2]">
            <BookOpen
              size={32}
              className="text-[#087F77]"
              aria-hidden="true"
            />
          </div>

          <h2 className="text-xl font-bold text-[#073B43]">
            Aún no tienes salas de estudio
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
            Crea tu primera sala para organizar una sesión de estudio
            con tus compañeros.
          </p>

          <Link
            to="/rooms/create"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#70DCCB] px-5 py-3 font-semibold text-[#073B43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F77]"
          >
            <Plus size={18} aria-hidden="true" />
            Crear mi primera sala
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            {salas.length === 1
              ? 'Tienes 1 sala creada.'
              : `Tienes ${salas.length} salas creadas.`}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {salas.map((sala) => (
              <article
                key={sala.roomId}
                className="flex flex-col justify-between rounded-2xl border border-[#DCE9E8] bg-white p-5 shadow-sm"
              >
                <div>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#DDF7F2] text-[#087F77]">
                    <BookOpen size={22} aria-hidden="true" />
                  </div>

                  <h2 className="break-words text-lg font-bold text-[#073B43]">
                    {sala.name}
                  </h2>

                  <p className="mt-4 text-xs font-medium text-gray-600">
                    Identificador de la sala
                  </p>

                  <p className="mt-1 break-all font-mono text-sm font-semibold text-[#176B71]">
                    {sala.roomId}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {user && sala.ownerUid === user.uid && (
                    <EditRoomModal sala={sala} user={user}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DCE9E8] px-4 py-2.5 text-sm font-semibold text-[#073B43] hover:bg-[#F1F7F6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F77]"
                      onGuardar={async (nombre, signal) => {
                        setConfirmacion('')
                        const { sala: actualizada, confirmado } = await guardarNombreSala(sala.roomId, nombre, signal)
                        if (!signal.aborted && auth.currentUser === user) {
                          setSalas(actuales => actuales.map(actual =>
                            actual.roomId === actualizada.roomId ? { ...actual, name: actualizada.name } : actual))
                        }
                        return confirmado
                      }}
                      onGuardado={() => setConfirmacion('El nombre de la sala se actualizó correctamente.')} />
                  )}

                  <button
                    type="button"
                    onClick={() => void copiarId(sala.roomId)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#DCE9E8] px-4 py-2.5 text-sm font-semibold text-[#073B43] hover:bg-[#F1F7F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F77]"
                    aria-label={`Copiar identificador de ${sala.name}`}
                  >
                    {copiadoId === sala.roomId ? (
                      <Check size={17} aria-hidden="true" />
                    ) : (
                      <Copy size={17} aria-hidden="true" />
                    )}

                    {copiadoId === sala.roomId ? 'Copiado' : 'Copiar ID'}
                  </button>

                  <Link
                    to={`/room/${encodeURIComponent(sala.roomId)}`}
                    className="inline-flex items-center rounded-xl bg-[#70DCCB] px-4 py-2.5 text-sm font-semibold text-[#073B43] hover:bg-[#50CDBA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F77]"
                  >
                    Ingresar
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default Rooms
