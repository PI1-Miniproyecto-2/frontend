
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Check,
  Copy,
  MessageCircle,
  Mic,
  MicOff,
  MonitorUp,
  Send,
  Users,
  X,
} from 'lucide-react'

type Mensaje = {
  id: number
  autor: string
  texto: string
  hora: string
}

function Room() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [microfono, setMicrofono] = useState(false)
  const [camara, setCamara] = useState(false)
  const [chatAbierto, setChatAbierto] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [copiado, setCopiado] = useState(false)

  const codigo = id || 'SIN-CODIGO'

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  function enviarMensaje(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const texto = mensaje.trim()
    if (!texto) return

    const nuevoMensaje: Mensaje = {
      id: Date.now(),
      autor: 'Tú',
      texto,
      hora: new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setMensajes((anteriores) => [...anteriores, nuevoMensaje])
    setMensaje('')
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-xl bg-[#062E33] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#05272C] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#13B8A6] text-[#073B43]">
            <MessageCircle size={21} aria-hidden="true" />
          </div>

          <div>
            <h1 className="font-bold">Sala de estudio</h1>
            <p className="text-xs text-teal-100">
              Código: {codigo} · Vista de demostración
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copiarCodigo}
            className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70DCCB]"
          >
            {copiado ? <Check size={15} /> : <Copy size={15} />}
            {copiado ? 'Copiado' : 'Copiar código'}
          </button>

          <button
            type="button"
            onClick={() => setChatAbierto((actual) => !actual)}
            aria-label={chatAbierto ? 'Ocultar chat' : 'Mostrar chat'}
            aria-expanded={chatAbierto}
            className="rounded-lg bg-[#13B8A6] p-2 text-[#073B43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <MessageCircle size={19} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid flex-1 grid-cols-1 gap-2 p-3 sm:grid-cols-2">
            <div className="relative flex min-h-[200px] items-center justify-center rounded-xl border-2 border-[#13B8A6] bg-[#103E43]">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#B8E8E2] text-xl font-bold text-[#073B43]">
                Tú
              </div>

              <span className="absolute bottom-3 left-3 rounded-md bg-black/40 px-2 py-1 text-xs">
                Tú · {microfono ? 'Micrófono activado' : 'Micrófono apagado'}
              </span>
            </div>

            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl bg-[#10383E] text-center">
              <Users size={32} className="mb-3 text-[#70DCCB]" />
              <p className="text-sm font-medium">Esperando participantes</p>
              <p className="mt-1 px-4 text-xs text-teal-100">
                Comparte el código para invitar a tus compañeros.
              </p>
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 bg-[#05272C] px-4 py-4">
            <button
              type="button"
              onClick={() => setMicrofono((actual) => !actual)}
              aria-label={microfono ? 'Desactivar micrófono' : 'Activar micrófono'}
              aria-pressed={microfono}
              className="rounded-full bg-white/15 p-3 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {microfono ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <button
              type="button"
              onClick={() => setCamara((actual) => !actual)}
              aria-label={camara ? 'Desactivar cámara' : 'Activar cámara'}
              aria-pressed={camara}
              className="rounded-full bg-white/15 p-3 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {camara ? <Camera size={20} /> : <CameraOff size={20} />}
            </button>

            <button
              type="button"
              disabled
              title="Compartir pantalla estará disponible cuando integremos videollamadas"
              className="cursor-not-allowed rounded-full bg-white/15 p-3 opacity-50"
              aria-label="Compartir pantalla no disponible"
            >
              <MonitorUp size={20} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="flex items-center gap-2 rounded-full bg-[#DC5264] px-5 py-3 text-sm font-semibold hover:bg-[#C93F51] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ArrowLeft size={17} />
              Abandonar
            </button>
          </footer>
        </div>

        {chatAbierto && (
          <aside className="flex h-[360px] flex-col border-t border-gray-200 bg-white text-[#073B43] lg:h-auto lg:w-[300px] lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div>
                <h2 className="font-bold">Chat de la sala</h2>
                <p className="text-xs text-gray-500">
                  Mensajes locales de demostración
                </p>
              </div>

              <button
                type="button"
                onClick={() => setChatAbierto(false)}
                aria-label="Cerrar chat"
                className="rounded-lg p-2 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#087F77]"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="flex-1 space-y-3 overflow-y-auto p-4"
              aria-label="Mensajes del chat"
              aria-live="polite"
            >
              {mensajes.length === 0 ? (
                <p className="mt-6 text-center text-sm text-gray-500">
                  Aún no hay mensajes. ¡Inicia la conversación!
                </p>
              ) : (
                mensajes.map((item) => (
                  <div key={item.id} className="flex flex-col items-end">
                    <p className="mb-1 text-xs font-semibold">
                      {item.autor} · {item.hora}
                    </p>
                    <p className="max-w-full break-words rounded-xl bg-[#EAF6F4] px-3 py-2 text-sm">
                      {item.texto}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={enviarMensaje}
              className="flex gap-2 border-t border-gray-200 p-3"
            >
              <label htmlFor="mensaje-sala" className="sr-only">
                Escribe un mensaje
              </label>

              <input
                id="mensaje-sala"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                maxLength={1000}
                placeholder="Escribe un mensaje..."
                className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-[#F5F8F8] px-3 py-2 text-sm outline-none focus:border-[#13B8A6] focus:ring-2 focus:ring-[#70DCCB]"
              />

              <button
                type="submit"
                disabled={!mensaje.trim()}
                aria-label="Enviar mensaje"
                className="rounded-xl bg-[#13B8A6] p-3 text-[#073B43] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={17} />
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  )
}

export default Room
