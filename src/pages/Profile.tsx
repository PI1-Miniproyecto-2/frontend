import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { actualizarPerfil, eliminarPerfil } from '../services/ProfileService'
import { cerrarSesionFirebase } from '../services/AuthService'

export default function Profile() {
  const navigate = useNavigate()
  const {
    user,
    perfil,
    cargando,
    errorPerfil,
    refrescarPerfil,
  } = useAuth()

  const [recargando, setRecargando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState<string | null>(null)
  const botonEliminarRef = useRef<HTMLButtonElement>(null)
  const botonCancelarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!mostrarConfirmacion) return
    botonCancelarRef.current?.focus()
    const manejarTecla = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !eliminando) {
  setMostrarConfirmacion(false)
}
      if (event.key === 'Tab') {
        const modal = document.getElementById('modal-eliminar-cuenta')
        const controles = Array.from(modal?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
        if (!controles.length) return
        const primero = controles[0]
        const ultimo = controles[controles.length - 1]
        if (event.shiftKey && document.activeElement === primero) {
          event.preventDefault()
          ultimo.focus()
        } else if (!event.shiftKey && document.activeElement === ultimo) {
          event.preventDefault()
          primero.focus()
        }
      }
    }
    document.addEventListener('keydown', manejarTecla)
    return () => {
      document.removeEventListener('keydown', manejarTecla)
      botonEliminarRef.current?.focus()
    }
  }, [mostrarConfirmacion])

  const [nombre, setNombre] = useState('')


const confirmarEliminacion = async () => {
  if (eliminando) return

  setEliminando(true)
  setErrorEliminacion(null)

  try {
    console.log('Solicitando eliminación de cuenta al backend...')

    // Solicitar eliminación real al backend.
    await eliminarPerfil()

    console.log('El backend confirmó la eliminación.')

    // Cerrar la sesión local después de la confirmación.
    try {
      await cerrarSesionFirebase()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }

    setMostrarConfirmacion(false)
    navigate('/', { replace: true })

  } catch (error) {
    console.error('El backend rechazó la eliminación:', error)

    const respuesta = error as Error & { status?: number }

    setErrorEliminacion(
      respuesta.message ||
      'No se pudo eliminar la cuenta. Inténtalo nuevamente.'
    )
  } finally {
    setEliminando(false)
  }
}


  const [apellido, setApellido] = useState('')
  const [username, setUsername] = useState('')

  const [mensajeError, setMensajeError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const volverAIntentar = async () => {
    setRecargando(true)
    setMensajeError(null)

    try {
      await refrescarPerfil()
    } catch {
      setMensajeError('No fue posible cargar tu perfil. Inténtalo nuevamente.')
    } finally {
      setRecargando(false)
    }
  }

  const iniciarEdicion = () => {
    if (!perfil) return

    setNombre(perfil.firstName || '')
    setApellido(perfil.lastName || '')
    setUsername(perfil.username || '')
    setMensajeError(null)
    setMensajeExito(null)
    setEditando(true)
  }

  const cancelarEdicion = () => {
    setEditando(false)
    setMensajeError(null)
  }

  const guardarCambios = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!perfil || guardando) return

    const firstName = nombre.trim()
    const lastName = apellido.trim()
    const nuevoUsername = username.trim()

    setMensajeError(null)
    setMensajeExito(null)

    if (!firstName || !lastName || !nuevoUsername) {
      setMensajeError('Completa el nombre, el apellido y el nombre de usuario.')
      return
    }

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(nuevoUsername)) {
      setMensajeError(
        'El nombre de usuario debe tener entre 3 y 30 caracteres y usar letras, números, puntos, guiones o guiones bajos.'
      )
      return
    }

    setGuardando(true)

    try {
      await actualizarPerfil({
        firstName,
        lastName,
        username: nuevoUsername,
        avatarId: perfil.avatarId,
      })

      await refrescarPerfil()

      setEditando(false)
      setMensajeExito('Perfil actualizado correctamente.')
    } catch (error) {
      const respuesta = error as Error & { status?: number }

      if (
        respuesta.status === 409 &&
        /ocupado|existe|uso/i.test(respuesta.message)
      ) {
        setMensajeError(
          'Ese nombre de usuario ya está en uso. Elige otro.'
        )
      } else {
        setMensajeError(
          respuesta.message || 'No fue posible guardar los cambios.'
        )
      }
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p role="status" className="text-[#073B43]">
          Cargando tu perfil...
        </p>
      </main>
    )
  }

  if (errorPerfil || !perfil) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div
          role={errorPerfil ? 'alert' : 'status'}
          className="rounded-2xl border border-gray-200 bg-white p-6"
        >
          <h1 className="text-2xl font-bold text-[#073B43]">
            Mi perfil
          </h1>

          <p className="mt-3 text-gray-600">
            {errorPerfil || 'Todavía no encontramos información de tu perfil.'}
          </p>

          <button
            type="button"
            onClick={volverAIntentar}
            disabled={recargando}
            className="mt-5 rounded-lg bg-[#70DCCB] px-5 py-3 font-semibold text-[#073B43] disabled:opacity-50"
          >
            {recargando ? 'Intentando...' : 'Volver a intentar'}
          </button>
        </div>
      </main>
    )
  }

  const nombreCompleto =
    [perfil.firstName, perfil.lastName]
      .filter(Boolean)
      .join(' ') || 'Estudiante'

  const iniciales =
    [perfil.firstName, perfil.lastName]
      .filter(Boolean)
      .map((valor) => valor!.charAt(0).toUpperCase())
      .join('') || 'AP'

  const nombreUsuario = perfil.username || 'Sin configurar'
  const correo = perfil.email || user?.email || 'No disponible'

  const campoClase =
    'w-full min-h-11 rounded-xl border border-gray-300 bg-[#F5F8F8] px-3 py-2 text-sm text-[#073B43] focus:outline-none focus:ring-2 focus:ring-[#0AB5A8]'

  return (
    <main className="min-h-screen bg-[#F5F8F8] px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-5">

        {/* Encabezado */}
        <section className="flex flex-col gap-5 rounded-2xl bg-[#073B43] p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              aria-label={`Avatar de ${nombreCompleto}`}
              role="img"
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#C8F4EC] text-2xl font-bold text-[#073B43]"
            >
              {iniciales}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#70DCCB]">
                Perfil de estudiante
              </p>

              <h1 className="mt-2 break-words text-2xl font-bold">
                {nombreCompleto}
              </h1>

              <p className="mt-1 break-all text-sm text-gray-200">
                @{nombreUsuario}
              </p>
            </div>
          </div>

          {!editando && (
            <button
              type="button"
              onClick={iniciarEdicion}
              className="rounded-xl bg-[#70DCCB] px-5 py-3 font-semibold text-[#073B43] hover:bg-[#55CEBC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Editar perfil
            </button>
          )}
        </section>

        {mensajeExito && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"
          >
            {mensajeExito}
          </div>
        )}

        {mensajeError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {mensajeError}
          </div>
        )}

        {/* Información personal */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-6 text-xl font-bold text-[#073B43]">
            Información personal
          </h2>

          {editando ? (
            <form onSubmit={guardarCambios} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="perfil-nombre" className="mb-2 block text-sm font-medium text-[#075E69]">
                    Nombre
                  </label>
                  <input
                    id="perfil-nombre"
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    className={campoClase}
                    maxLength={60}
                    required
                    disabled={guardando}
                  />
                </div>

                <div>
                  <label htmlFor="perfil-apellido" className="mb-2 block text-sm font-medium text-[#075E69]">
                    Apellido
                  </label>
                  <input
                    id="perfil-apellido"
                    value={apellido}
                    onChange={(event) => setApellido(event.target.value)}
                    className={campoClase}
                    maxLength={60}
                    required
                    disabled={guardando}
                  />
                </div>

                <div>
                  <label htmlFor="perfil-usuario" className="mb-2 block text-sm font-medium text-[#075E69]">
                    Nombre de usuario
                  </label>
                  <input
                    id="perfil-usuario"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className={campoClase}
                    minLength={3}
                    maxLength={30}
                    required
                    disabled={guardando}
                  />
                </div>

                <div>
                  <label htmlFor="perfil-correo" className="mb-2 block text-sm font-medium text-[#075E69]">
                    Correo electrónico
                  </label>
                  <input
                    id="perfil-correo"
                    value={correo}
                    readOnly
                    aria-describedby="correo-ayuda"
                    className={`${campoClase} cursor-not-allowed opacity-70`}
                  />
                  <p id="correo-ayuda" className="mt-1 text-xs text-gray-500">
                    El correo no se puede cambiar desde esta pantalla.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  disabled={guardando}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-[#073B43] hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-xl bg-[#70DCCB] px-5 py-3 font-semibold text-[#073B43] hover:bg-[#55CEBC] disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <dt className="mb-2 text-sm font-medium text-[#075E69]">
                  Nombre completo
                </dt>
                <dd className="min-h-11 break-words rounded-xl border border-gray-200 bg-[#F5F8F8] p-3 text-sm text-[#073B43]">
                  {nombreCompleto}
                </dd>
              </div>

              <div>
                <dt className="mb-2 text-sm font-medium text-[#075E69]">
                  Nombre de usuario
                </dt>
                <dd className="min-h-11 break-words rounded-xl border border-gray-200 bg-[#F5F8F8] p-3 text-sm text-[#073B43]">
                  {nombreUsuario}
                </dd>
              </div>

              <div>
                <dt className="mb-2 text-sm font-medium text-[#075E69]">
                  Correo electrónico
                </dt>
                <dd className="min-h-11 break-all rounded-xl border border-gray-200 bg-[#F5F8F8] p-3 text-sm text-[#073B43]">
                  {correo}
                </dd>
              </div>

              <div>
                <dt className="mb-2 text-sm font-medium text-[#075E69]">
                  Programa académico
                </dt>
                <dd className="min-h-11 rounded-xl border border-gray-200 bg-[#F5F8F8] p-3 text-sm text-gray-500">
                  No registrado
                </dd>
              </div>
            </dl>
          )}
        </section>

        {/* Administración de cuenta */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 text-lg font-bold text-[#073B43]">
            Administración de cuenta
          </h2>

          <button
            ref={botonEliminarRef}
            type="button"
            onClick={() => setMostrarConfirmacion(true)}
            disabled={guardando || editando}
            className="rounded-xl border border-red-300 bg-red-50 px-5 py-3 font-semibold text-red-600 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
          >
            Eliminar cuenta
          </button>
        </section>
      </div>

      {mostrarConfirmacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="presentation"
        >
          <section
            id="modal-eliminar-cuenta"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-eliminar-cuenta"
            aria-describedby="descripcion-eliminar-cuenta"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8"
          >
            <div aria-hidden="true" className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-700">
              !
            </div>
            <h2 id="titulo-eliminar-cuenta" className="text-xl font-bold text-[#073B43]">
              ¿Seguro que quieres eliminar tu cuenta?
            </h2>
            <p id="descripcion-eliminar-cuenta" className="mt-3 text-sm leading-6 text-gray-600">
              Esta acción eliminará tu cuenta y tus datos asociados. No se puede deshacer.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                ref={botonCancelarRef}
                type="button"
                onClick={() => setMostrarConfirmacion(false)}
                className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-[#073B43] hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#073B43]"
              >
                Cancelar
                
              </button>

          <button
            type="button"
            onClick={confirmarEliminacion}
            disabled={eliminando}
            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {eliminando ? 'Eliminando cuenta...' : 'Eliminar cuenta'}
          </button>

            </div>

{errorEliminacion && (
  <p
    role="alert"
    className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
  >
    {errorEliminacion}
  </p>
)}

      <p className="mt-4 text-xs text-gray-500">
        Por seguridad, es posible que necesites iniciar sesión nuevamente
        antes de eliminar tu cuenta.
      </p>

          </section>
        </div>
      )}
    </main>
  )
}
