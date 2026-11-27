import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import type { SesionSala } from '../hooks/useRoomSocket'
import { nombreMiembro } from '../services/RoomDirectory'
import { LIMITE_MENSAJE } from '../types/realtime'

const horaLocal = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' })
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]'

export default function RoomChat({ sesion, uid, visible }: {
  sesion: SesionSala
  uid: string
  visible: boolean
}) {
  const { conexion, mensajes, directorio, acciones, puedeReintentar, aviso } = sesion
  const [borrador, setBorrador] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [nuevos, setNuevos] = useState(false)
  const lista = useRef<HTMLDivElement>(null)
  const cercaDelFinal = useRef(true)
  const cantidadAnterior = useRef(0)
  const ocupado = useRef(false)
  const longitud = borrador.trim().length
  const excedeLimite = longitud > LIMITE_MENSAJE
  const puedeEnviar = conexion.estado === 'connected' && !enviando && longitud > 0 && !excedeLimite

  function moverAlFinal() {
    if (lista.current) lista.current.scrollTop = lista.current.scrollHeight
    cercaDelFinal.current = true
    setNuevos(false)
  }

  useLayoutEffect(() => {
    if (!visible) return
    if (cercaDelFinal.current && lista.current) {
      lista.current.scrollTop = lista.current.scrollHeight
    } else if (mensajes.length > cantidadAnterior.current) {
      setNuevos(true)
    }
    cantidadAnterior.current = mensajes.length
  }, [mensajes, visible])

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!puedeEnviar || ocupado.current || !acciones.current) return

    ocupado.current = true
    setEnviando(true)
    setError('')
    const resultado = await acciones.current.enviar(borrador)
    ocupado.current = false
    setEnviando(false)
    if (resultado) {
      setError(resultado)
    } else {
      setBorrador(actual => actual === borrador ? '' : actual)
      moverAlFinal()
    }
  }

  function manejarEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing ||
        event.nativeEvent.keyCode === 229) return
    event.preventDefault()
    if (!event.repeat && puedeEnviar) event.currentTarget.form?.requestSubmit()
  }

  return (
    <section id="chat-sala" aria-labelledby="chat-titulo" hidden={!visible}
      className="min-w-0 rounded-xl bg-white p-3 text-[#073B43] sm:p-4">
      <header>
        <h2 id="chat-titulo" className="text-lg font-bold">Chat de la sala</h2>
        <p role="status" className="mt-1 text-sm">{conexion.texto}</p>
        {aviso && <p role="alert" className="mt-1 text-sm text-red-800">{aviso}</p>}
        {puedeReintentar && (
          <button type="button" onClick={() => acciones.current?.reintentar()}
            className={`mt-1 min-h-11 rounded px-2 font-semibold underline ${foco}`}>
            Reconectar
          </button>
        )}
      </header>

      <div className="relative mt-4">
        <div ref={lista} role="log" aria-label="Mensajes de la sala" aria-relevant="additions"
          aria-live={visible ? 'polite' : 'off'} tabIndex={0}
          onScroll={event => {
            const panel = event.currentTarget
            cercaDelFinal.current = panel.scrollHeight - panel.scrollTop - panel.clientHeight <= 64
            if (cercaDelFinal.current) setNuevos(false)
          }}
          className={`h-[clamp(15rem,46dvh,36rem)] space-y-3 overflow-y-auto rounded-lg bg-[#F5F8F8] p-3 ${foco}`}>
          {mensajes.length === 0 && <p className="text-sm">Aún no hay mensajes en esta sesión.</p>}
          {mensajes.map(mensaje => {
            const propio = mensaje.authorUid === uid
            return (
              <article key={mensaje.id}
                className={`w-fit max-w-[90%] rounded-lg p-3 wrap-anywhere ${propio ? 'ml-auto bg-[#DDF7F2]' : 'mr-auto border border-teal-900/20 bg-white'}`}>
                <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <strong>{nombreMiembro(directorio, mensaje.authorUid)}{propio && ' (Tú)'}</strong>
                  <time dateTime={mensaje.createdAt}>{horaLocal.format(new Date(mensaje.createdAt))}</time>
                </p>
                <p className="mt-1 whitespace-pre-wrap">{mensaje.content}</p>
              </article>
            )
          })}
        </div>
        {nuevos && (
          <button type="button" onClick={() => {
            lista.current?.focus({ preventScroll: true })
            moverAlFinal()
          }} className={`absolute bottom-2 left-1/2 min-h-11 w-max max-w-full -translate-x-1/2 rounded-lg bg-[#047857] px-3 font-semibold text-white ${foco}`}>
            Ver mensajes nuevos
          </button>
        )}
      </div>

      <form className="mt-4 space-y-2" onSubmit={event => void enviar(event)}>
        <label htmlFor="mensaje-sala" className="block font-semibold">Mensaje</label>
        <textarea id="mensaje-sala" rows={2} value={borrador} onKeyDown={manejarEnter}
          aria-describedby={`ayuda-mensaje longitud-mensaje${error || excedeLimite ? ' error-mensaje' : ''}`}
          aria-invalid={excedeLimite}
          onChange={event => {
            setBorrador(event.target.value)
            if (!ocupado.current) setError('')
          }}
          className={`block min-h-12 w-full resize-y rounded-lg border border-[#39766F] p-2 ${foco}`} />
        <div className="flex flex-wrap justify-between gap-x-3 text-xs">
          <p id="ayuda-mensaje">Enter para enviar · Shift+Enter para salto de línea</p>
          <p id="longitud-mensaje">{longitud} / {LIMITE_MENSAJE}</p>
        </div>
        {(error || excedeLimite) && (
          <p id="error-mensaje" role="alert" className="text-sm text-red-800">
            {excedeLimite ? 'El mensaje supera el límite de 2000 unidades de texto.' : error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" aria-disabled={!puedeEnviar}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#047857] px-3 py-2 font-semibold text-white aria-disabled:cursor-not-allowed aria-disabled:bg-[#DDF7F2] aria-disabled:text-[#073B43] ${foco}`}>
            <Send size={16} aria-hidden="true" />
            Enviar mensaje
          </button>
          <p role="status" className="text-sm">{enviando ? 'Enviando…' : ''}</p>
        </div>
      </form>
    </section>
  )
}
