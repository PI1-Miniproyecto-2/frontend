import { useEffect, useId, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { User } from 'firebase/auth'
import { auth } from '../services/Firebase'
import {
  comprobarDisponibilidadSala, confirmarEliminacionSala, mensajeErrorEliminacion, mensajesEliminacion,
  type ResultadoEliminacion, type Sala,
} from '../services/RoomsService'
import Button from './Button'
import Alert from './Alert'

type ResultadoDisponible = Exclude<ResultadoEliminacion, 'incierta'>

export default function DeleteRoomModal({
  sala, user, className, onResultado, signalSala,
}: {
  sala: Sala
  user: User
  className: string
  onResultado: (resultado: ResultadoDisponible) => void
  signalSala?: () => AbortSignal | undefined
}) {
  const id = useId()
  const dialogo = useRef<HTMLDialogElement>(null)
  const activador = useRef<HTMLButtonElement>(null)
  const cancelar = useRef<HTMLButtonElement>(null)
  const solicitud = useRef<AbortController | null>(null)
  const [fase, setFase] = useState<'eliminando' | 'comprobando' | 'lista'>('lista')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [requiereConsulta, setRequiereConsulta] = useState(false)
  const ocupado = fase === 'eliminando' || fase === 'comprobando'

  useEffect(() => () => { solicitud.current?.abort() }, [])

  function abrir() {
    if (auth.currentUser !== user || sala.ownerUid !== user.uid) return
    setError(requiereConsulta ? mensajesEliminacion.incierta : '')
    setAviso('')
    dialogo.current?.showModal()
    cancelar.current?.focus()
  }

  async function solicitar(comprobar: boolean) {
    if (solicitud.current || (!comprobar && requiereConsulta)) return
    if (auth.currentUser !== user || sala.ownerUid !== user.uid) {
      setError('No pudimos verificar tu permiso para eliminar la sala.')
      return
    }

    const operacion = new AbortController()
    solicitud.current = operacion
    // En el interior, el resultado HTTP se conserva aunque room:deleted cierre el diálogo.
    const signal = signalSala?.() ?? operacion.signal
    const vigente = () => !signal.aborted && auth.currentUser === user
    setFase(comprobar ? 'comprobando' : 'eliminando')
    setError('')
    setAviso('')
    try {
      const resultado = comprobar
        ? await comprobarDisponibilidadSala(sala.roomId, signal)
        : await confirmarEliminacionSala(sala.roomId, signal)
      if (!vigente()) return
      if (resultado === 'incierta') {
        if (operacion.signal.aborted) return
        setRequiereConsulta(true)
        setError(mensajesEliminacion.incierta)
      } else if (resultado === 'disponible') {
        if (operacion.signal.aborted) return
        setRequiereConsulta(false)
        setAviso('La sala sigue disponible. Puedes volver a confirmar la eliminación.')
      } else {
        dialogo.current?.close()
        onResultado(resultado)
      }
    } catch (fallo) {
      if (vigente() && !operacion.signal.aborted) setError(mensajeErrorEliminacion(fallo))
    } finally {
      solicitud.current = null
      if (vigente() && !operacion.signal.aborted) setFase('lista')
    }
  }

  return (
    <>
      <button ref={activador} type="button" aria-haspopup="dialog" aria-controls={id}
        aria-label={`Eliminar sala ${sala.name}`} className={className} onClick={abrir}>
        <Trash2 size={16} aria-hidden="true" />
        Eliminar sala
      </button>
      <dialog id={id} ref={dialogo} aria-labelledby={`${id}-titulo`}
        aria-describedby={`${id}-descripcion ${id}-advertencia`}
        onCancel={event => { if (solicitud.current) event.preventDefault() }}
        onClose={() => activador.current?.focus({ preventScroll: true })}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-[#DCE9E8] bg-white p-5 text-[#073B43] shadow-xl backdrop:bg-[#05272C]/70 sm:p-7">
        <h2 id={`${id}-titulo`} className="text-xl font-bold">Eliminar sala de estudio</h2>
        <p id={`${id}-descripcion`} className="mt-2 wrap-anywhere">¿Deseas eliminar la sala «{sala.name}»?</p>
        <p id={`${id}-advertencia`} className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-900">
          Los participantes perderán el acceso a esta sala y no podrán continuar la sesión de estudio.
        </p>
        <form className="mt-4 space-y-3" onSubmit={event => { event.preventDefault(); void solicitar(false) }}>
          {error && <Alert type="error">{error}</Alert>}
          <p role="status" className="text-sm empty:sr-only">
            {fase === 'eliminando' ? 'Eliminando sala… Espera la confirmación para cerrar.' :
              fase === 'comprobando' ? 'Comprobando el estado de la sala…' : aviso}
          </p>
          <div className="flex flex-wrap justify-end gap-3">
            <Button ref={cancelar} type="button" variant="secondary" className="min-h-11 aria-disabled:opacity-60" aria-disabled={ocupado}
              onClick={() => { if (!solicitud.current) dialogo.current?.close() }}>
              Cancelar
            </Button>
            {requiereConsulta ? (
              <Button type="button" className="min-h-11 aria-disabled:opacity-60" aria-disabled={ocupado}
                onClick={() => void solicitar(true)}>Comprobar estado</Button>
            ) : (
              <Button type="submit" className="min-h-11 bg-red-800 hover:bg-red-900 aria-disabled:opacity-60"
                aria-disabled={ocupado}>Eliminar sala</Button>
            )}
          </div>
        </form>
      </dialog>
    </>
  )
}
