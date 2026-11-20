
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookOpen, ShieldCheck, CheckCircle2, Copy } from 'lucide-react'
import { crearSala, type Sala, type PrivacidadSala } from '../services/RoomsService'

function RoomForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [privacidad, setPrivacidad] = useState<PrivacidadSala>('private')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [salaCreada, setSalaCreada] = useState<Sala | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (guardando) return

    setError('')

    if (isEditing) {
      setError('La edición de salas todavía no está disponible.')
      return
    }

    if (nombre.trim().length < 3 || nombre.trim().length > 80) {
      setError('El nombre debe tener entre 3 y 80 caracteres.')
      return
    }

    if (descripcion.trim().length > 300) {
      setError('La descripción no puede superar los 300 caracteres.')
      return
    }

    setGuardando(true)

      try {
const sala = await crearSala({
  name: nombre.trim(),
})

setSalaCreada(sala)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible crear la sala. Inténtalo nuevamente.'
      )
    } finally {
      setGuardando(false)
    }
  }

  async function copiarCodigo() {
    if (!salaCreada) return

    try {
      await navigator.clipboard.writeText(salaCreada.roomId)
      setCopiado(true)
    } catch {
      setError('No fue posible copiar el código.')
    }
  }

  if (salaCreada) {
    return (
      <section className="mx-auto w-full max-w-[570px] rounded-[22px] border border-gray-200 bg-white px-6 py-9 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#DDF7F2] text-[#087F77]">
          <CheckCircle2 size={36} aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-bold text-[#073B43]">
          ¡Sala creada!
        </h1>

        <p className="mt-3 text-sm text-gray-600">
          Tu sala <strong>{salaCreada.name}</strong> ya está guardada.
          Comparte el identificador para que tus compañeros puedan encontrarla.
        </p>

        <div className="mt-7 rounded-xl border border-[#DCE9E8] bg-[#F1F7F6] p-5">
          <p className="mb-2 text-sm font-medium text-[#073B43]">
            Identificador de la sala
          </p>

          <div className="flex items-center justify-center gap-3">
            <span className="break-all font-mono text-lg font-bold text-[#176B71]">
              {salaCreada.roomId}
            </span>

            <button
              type="button"
              onClick={copiarCodigo}
              aria-label="Copiar identificador de la sala"
              className="rounded-lg p-2 text-[#087F77] hover:bg-[#DDF7F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F77]"
            >
              <Copy size={20} aria-hidden="true" />
            </button>
          </div>

          <p role="status" className="mt-2 text-sm text-[#087F77]">
            {copiado ? 'Identificador copiado correctamente.' : ''}
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/rooms')}
            className="flex-1 rounded-xl border border-[#DCE9E8] px-5 py-3 text-sm font-semibold text-[#073B43] hover:bg-gray-50"
          >
            Ver mis salas
          </button>

          <button
            type="button"
            onClick={() =>
  navigate(`/room/${encodeURIComponent(salaCreada.roomId)}`)
}
            className="flex-1 rounded-xl bg-[#70DCCB] px-5 py-3 text-sm font-semibold text-[#073B43] hover:bg-[#50CDBA]"
          >
            Ingresar ahora
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[570px] px-3 py-2 sm:px-4">
      <section className="rounded-[22px] border border-gray-200 bg-white px-5 py-7 shadow-sm sm:px-7">
        <header className="mb-8 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DDF7F2] text-[#087F77]">
            <BookOpen size={21} aria-hidden="true" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#073B43]">
              {isEditing ? 'Editar sala' : 'Crear nueva sala'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Prepara un espacio para su próxima sesión.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-6">
            <label htmlFor="nombre-sala" className="mb-2 block text-sm font-medium text-[#073B43]">
              Nombre de la sala
            </label>
            <input
              id="nombre-sala"
              type="text"
              value={nombre}
              maxLength={80}
              required
              aria-required="true"
              placeholder="Ej. Sala de programación"
              onChange={(e) => {
                setNombre(e.target.value)
                setError('')
              }}
              className="w-full rounded-xl border border-[#DCE9E8] bg-[#F5F9F9] px-4 py-3 text-sm text-[#073B43] outline-none transition focus:border-[#18B7A9] focus:ring-2 focus:ring-[#70DCCB]"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="descripcion-sala" className="mb-2 block text-sm font-medium text-[#073B43]">
              Descripción
            </label>
            <textarea
              id="descripcion-sala"
              value={descripcion}
              maxLength={300}
              rows={4}
              placeholder="¿Qué van a estudiar?"
              onChange={(e) => {
                setDescripcion(e.target.value)
                setError('')
              }}
              className="w-full resize-y rounded-xl border border-[#DCE9E8] bg-[#F5F9F9] px-4 py-3 text-sm text-[#073B43] outline-none transition focus:border-[#18B7A9] focus:ring-2 focus:ring-[#70DCCB]"
            />
          </div>

          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-[#073B43]">
              Código de acceso
            </p>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#DCE9E8] bg-[#F1F7F6] px-4 py-4">
              <div>
                <p className="font-mono text-sm font-semibold tracking-wide text-[#176B71]">
                  Se generará automáticamente
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Puedes compartirlo con tus compañeros.
                </p>
              </div>
              <ShieldCheck size={21} className="shrink-0 text-[#18B7A9]" aria-hidden="true" />
            </div>
          </div>

          <fieldset className="mb-7">
            <legend className="mb-2 text-sm font-medium text-[#073B43]">
              Privacidad
            </legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([
                ['private', 'Privada', 'Solo ingresan quienes tengan el código.'],
                ['public', 'Pública', 'Cualquier estudiante con el enlace.'],
              ] as const).map(([valor, titulo, detalle]) => (
                <label
                  key={valor}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    privacidad === valor
                      ? 'border-[#42CFC1] bg-[#EAFBF7]'
                      : 'border-[#DCE9E8] bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="privacidad"
                    value={valor}
                    checked={privacidad === valor}
                    onChange={() => setPrivacidad(valor)}
                    className="accent-[#079C8D]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[#073B43]">
                      {titulo}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {detalle}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
            <Link
              to="/rooms"
              className="rounded-xl border border-[#DCE9E8] bg-white px-4 py-2.5 text-sm font-semibold text-[#073B43] hover:bg-gray-50"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-[#70DCCB] px-4 py-2.5 text-sm font-semibold text-[#073B43] transition hover:bg-[#50CDBA] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando
                ? 'Creando sala...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear sala'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default RoomForm
