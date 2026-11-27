import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Pencil } from 'lucide-react'
import type { User } from 'firebase/auth'
import { auth } from '../services/Firebase'
import { mensajeErrorEdicion, validarNombreSala, type Sala } from '../services/RoomsService'
import Button from './Button'
import Input from './Input'
import Alert from './Alert'

export default function EditRoomModal({ sala, user, className, onGuardar, onGuardado }: {
  sala: Sala
  user: User
  className: string
  onGuardar: (name: string, signal: AbortSignal) => Promise<boolean>
  onGuardado: () => void
}) {
  const id = useId()
  const dialogo = useRef<HTMLDialogElement>(null)
  const activador = useRef<HTMLButtonElement>(null)
  const solicitud = useRef<AbortController | null>(null)
  const nombreInicial = useRef(sala.name)
  const [nombre, setNombre] = useState(sala.name)
  const [errorCampo, setErrorCampo] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => () => { solicitud.current?.abort() }, [])

  function abrir() {
    if (auth.currentUser !== user || sala.ownerUid !== user.uid) return
    nombreInicial.current = sala.name
    setNombre(sala.name)
    setErrorCampo('')
    setError('')
    dialogo.current?.showModal()
    document.getElementById(`${id}-nombre`)?.focus()
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (solicitud.current) return
    setError('')
    setErrorCampo('')
    if (auth.currentUser !== user || sala.ownerUid !== user.uid) {
      setError('No pudimos verificar tu permiso para editar la sala.')
      return
    }

    const name = nombre.trim()
    const sinCambios = name === nombreInicial.current || name === sala.name
    const validacion = validarNombreSala(name) || (sinCambios ? 'El nombre no tiene cambios.' : '')
    if (validacion) {
      setErrorCampo(validacion)
      document.getElementById(`${id}-nombre`)?.focus()
      return
    }

    const operacion = new AbortController()
    solicitud.current = operacion
    setGuardando(true)
    const vigente = () => !operacion.signal.aborted && auth.currentUser === user

    try {
      const confirmado = await onGuardar(name, operacion.signal)
      if (!vigente()) return
      if (confirmado) {
        dialogo.current?.close()
        onGuardado()
      } else {
        setError('El nombre consultado todavía es distinto. No pudimos confirmar el cambio. Puedes intentarlo nuevamente.')
      }
    } catch (errorEdicion) {
      if (vigente()) setError(mensajeErrorEdicion(errorEdicion))
    } finally {
      solicitud.current = null
      if (vigente()) setGuardando(false)
    }
  }

  return (
    <>
      <button ref={activador} type="button" aria-haspopup="dialog" aria-controls={id}
        className={className} onClick={abrir}>
        <Pencil size={16} aria-hidden="true" />
        Editar sala
      </button>
      <dialog id={id} ref={dialogo} aria-labelledby={`${id}-titulo`} aria-describedby={`${id}-descripcion`}
        onCancel={event => { if (solicitud.current) event.preventDefault() }}
        onClose={() => activador.current?.focus({ preventScroll: true })}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-[#DCE9E8] bg-white p-5 text-[#073B43] shadow-xl backdrop:bg-[#05272C]/70 sm:p-7">
        <h2 id={`${id}-titulo`} className="text-xl font-bold">Editar sala de estudio</h2>
        <p id={`${id}-descripcion`} className="mb-5 mt-2 text-sm">Modifica el nombre de tu sala de estudio.</p>

        <form onSubmit={event => void guardar(event)} noValidate className="space-y-4">
          <Input id={`${id}-nombre`} label="Nombre de la sala" value={nombre}
            required autoFocus readOnly={guardando} error={errorCampo}
            onChange={event => { setNombre(event.target.value); setErrorCampo(''); setError('') }} />
          {error && <Alert type="error">{error}</Alert>}
          <p role="status" className="text-sm empty:sr-only">
            {guardando ? 'Guardando cambios… Espera la confirmación para cerrar.' : ''}
          </p>
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary" className="min-h-11" disabled={guardando}
              onClick={() => { if (!solicitud.current) dialogo.current?.close() }}>
              Cancelar
            </Button>
            <Button type="submit" className="min-h-11 aria-disabled:opacity-60" aria-disabled={guardando}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </dialog>
    </>
  )
}
