import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import type { SesionSala } from '../hooks/useRoomSocket'
import { nombreMiembro } from '../services/RoomDirectory'
import { LIMITE_MENSAJE } from '../types/realtime'

const fechaLocal = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]'

export default function RoomChat({ sesion, uid, visible }: {
  sesion: SesionSala
  uid: string
  visible: boolean
}) {
  const { conexion, mensajes, historial, mensajeEnVivo, directorio, acciones, puedeReintentar, aviso } = sesion
  const [borrador, setBorrador] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [nuevos, setNuevos] = useState(false)
  const lista = useRef<HTMLDivElement>(null)
  const cercaDelFinal = useRef(true)
  const ultimoVisible = useRef<string | undefined>(undefined)
  const ultimoEnVivo = useRef<string | undefined>(undefined)
  const ancla = useRef<{ elemento: HTMLElement; distancia: number } | null>(null)
  const focoAnteriores = useRef(false)
  const ocupado = useRef(false)
  const longitud = borrador.trim().length
  const excedeLimite = longitud > LIMITE_MENSAJE
  const puedeEnviar = conexion.estado === 'connected' && !enviando && longitud > 0 && !excedeLimite

  function guardarPosicion(panel: HTMLDivElement) {
    const borde = panel.getBoundingClientRect().top
    const elemento = Array.from(panel.children).find(hijo =>
      hijo instanceof HTMLElement && hijo.tagName === 'ARTICLE' && hijo.getBoundingClientRect().bottom > borde)
    ancla.current = elemento instanceof HTMLElement
      ? { elemento, distancia: elemento.getBoundingClientRect().top - borde }
      : null
  }

  function moverAlFinal() {
    if (lista.current) lista.current.scrollTop = lista.current.scrollHeight
    cercaDelFinal.current = true
    setNuevos(false)
  }

  useLayoutEffect(() => {
    const panel = lista.current
    if (!visible || !panel) return
    const ultimo = mensajes.at(-1)?.id
    const cambioFinal = ultimo !== ultimoVisible.current || mensajeEnVivo?.id !== ultimoEnVivo.current
    const posicion = ancla.current
    if (cambioFinal && cercaDelFinal.current) {
      panel.scrollTop = panel.scrollHeight
    } else if (posicion && panel.contains(posicion.elemento)) {
      const distancia = posicion.elemento.getBoundingClientRect().top - panel.getBoundingClientRect().top
      panel.scrollTop += distancia - posicion.distancia
    }
    if (cambioFinal && !cercaDelFinal.current) setNuevos(true)
    ultimoVisible.current = ultimo
    ultimoEnVivo.current = mensajeEnVivo?.id
    guardarPosicion(panel)
  }, [mensajes, mensajeEnVivo, visible])

  useLayoutEffect(() => {
    if (!historial.hayAnteriores && focoAnteriores.current) {
      focoAnteriores.current = false
      if (visible && document.activeElement === document.body) lista.current?.focus({ preventScroll: true })
    }
  }, [historial.hayAnteriores, visible])

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

  const { fase, hayAnteriores, anuncio } = historial
  const conectado = conexion.estado === 'connected'
  const puedeCargar = conectado && (fase === 'listo' || fase === 'errorAnteriores')
  const estadoHistorial = {
    esperando: '',
    inicial: 'Cargando historial de mensajes…',
    listo: anuncio,
    anteriores: 'Cargando mensajes anteriores…',
    recuperando: 'Recuperando los mensajes que llegaron mientras estabas desconectado…',
    interrumpido: 'Historial pendiente de sincronizar.',
    errorInicial: 'No pudimos cargar el historial. Inténtalo nuevamente.',
    errorAnteriores: 'No pudimos cargar los mensajes anteriores. Inténtalo nuevamente.',
    incompleto: 'No pudimos recuperar todos los mensajes. Puedes continuar la sincronización.',
  }[fase]

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

      <div className="mt-3 text-sm">
        <p role="status" className="empty:sr-only">{estadoHistorial}</p>
        {conectado && (fase === 'errorInicial' || fase === 'incompleto') && (
          <button type="button" onClick={() => {
            lista.current?.focus({ preventScroll: true })
            acciones.current?.reintentarHistorial()
          }} className={`min-h-11 rounded px-2 font-semibold underline ${foco}`}>
            {fase === 'incompleto' ? 'Continuar sincronización' : 'Reintentar historial'}
          </button>
        )}
        {hayAnteriores && (
          <button type="button" aria-disabled={!puedeCargar} aria-controls="mensajes-sala"
            onFocus={() => { focoAnteriores.current = true }}
            onBlur={() => { focoAnteriores.current = false }}
            onClick={() => { if (puedeCargar) acciones.current?.cargarAnteriores() }}
            className={`min-h-11 rounded px-2 font-semibold underline aria-disabled:cursor-wait ${foco}`}>
            Cargar mensajes anteriores
          </button>
        )}
        {fase === 'listo' && !hayAnteriores && mensajes.length > 0 && (
          <p className="mt-1">Has llegado al inicio de la conversación.</p>
        )}
      </div>

      <div className="sr-only" aria-live={visible ? 'polite' : 'off'}>
        {mensajeEnVivo && mensajeEnVivo.authorUid !== uid && (
          <p key={mensajeEnVivo.id}>Mensaje nuevo: {mensajeEnVivo.content}</p>
        )}
      </div>

      <div className="relative mt-3">
        <div id="mensajes-sala" ref={lista} role="region" aria-label="Mensajes de la sala" tabIndex={0}
          onScroll={event => {
            const panel = event.currentTarget
            guardarPosicion(panel)
            cercaDelFinal.current = panel.scrollHeight - panel.scrollTop - panel.clientHeight <= 64
            if (cercaDelFinal.current) setNuevos(false)
          }}
          className={`h-[clamp(15rem,46dvh,36rem)] space-y-3 overflow-y-auto [overflow-anchor:none] rounded-lg bg-[#F5F8F8] p-3 ${foco}`}>
          {fase === 'listo' && mensajes.length === 0 && <p className="text-sm">Aún no hay mensajes. ¡Inicia la conversación!</p>}
          {mensajes.map(mensaje => {
            const propio = mensaje.authorUid === uid
            return (
              <article key={mensaje.id}
                className={`w-fit max-w-[90%] rounded-lg p-3 wrap-anywhere ${propio ? 'ml-auto bg-[#DDF7F2]' : 'mr-auto border border-teal-900/20 bg-white'}`}>
                <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <strong>{nombreMiembro(directorio, mensaje.authorUid)}{propio && ' (Tú)'}</strong>
                  <time dateTime={mensaje.createdAt}>{fechaLocal.format(new Date(mensaje.createdAt))}</time>
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
