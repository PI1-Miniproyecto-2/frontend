
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  crearPerfil,
  actualizarPerfil,
} from '../services/ProfileService'
import { cerrarSesionFirebase } from '../services/AuthService'

export default function ElegirUsuario() {
  const {
    user,
    perfil,
    cargando,
    errorPerfil,
    refrescarPerfil,
  } = useAuth()

  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (cargando) {
    return (
      <main className="p-8" aria-busy="true">
        Verificando sesión...
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (perfil?.profileCompleted && perfil.username?.trim()) {
    return <Navigate to="/dashboard" replace />
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (saving) return

    const nombreUsuario = username.trim()

    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(nombreUsuario)) {
      setError(
        'Usa entre 3 y 20 caracteres: letras, números, puntos o guion bajo.'
      )
      return
    }

    setSaving(true)
    setError('')

    try {
      const datos = {
        username: nombreUsuario,
      }

      if (perfil) {
        await actualizarPerfil(datos)
      } else {
        await crearPerfil(datos)
      }

      // Consultamos nuevamente el perfil después de guardarlo.
      const perfilActualizado = await refrescarPerfil()

      // Solo permitimos entrar al panel si la API confirma
      // que el perfil está completo.
      if (
        perfilActualizado !== null &&
        perfilActualizado.profileCompleted === true &&
        Boolean(perfilActualizado.username?.trim())
      ) {
        navigate('/dashboard', { replace: true })
      } else {
        setError(
          'El perfil todavía está incompleto. Comprueba los datos requeridos por la API.'
        )
      }
    } catch (errorCapturado) {
      const err = errorCapturado as Error & {
        status?: number
      }

      if (err.status === 409) {
        setError(
          'Este nombre de usuario está ocupado. Elige otro.'
        )
      } else if (err.status === 400) {
        setError(err.message)
      } else {
        setError(
          'No se pudo guardar el perfil. Comprueba la conexión e inténtalo otra vez.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const salir = async () => {
    try {
      await cerrarSesionFirebase()
      navigate('/inicio', { replace: true })
    } catch {
      setError('No fue posible cerrar sesión.')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f4f8f7] p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[#073B43]">
          Elige tu nombre de usuario
        </h1>

        <p className="my-4">
          Para entrar a AulaPro, primero debes completar tu perfil.
        </p>

        {errorPerfil && (
          <p role="alert">
            {errorPerfil} Comprueba tu conexión y vuelve a intentarlo.
          </p>
        )}

        <form onSubmit={submit} noValidate>
          <label
            htmlFor="nuevo-username"
            className="block font-semibold mb-2"
          >
            Nombre de usuario
          </label>

          <input
            id="nuevo-username"
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError('')
            }}
            aria-invalid={Boolean(error)}
            aria-describedby="username-feedback"
            className="w-full rounded-lg border border-gray-400 p-3 focus-visible:outline-2 focus-visible:outline-emerald-600"
          />

          <p
            id="username-feedback"
            role={error ? 'alert' : undefined}
            className="text-sm my-2"
          >
            {error ||
              'De 3 a 20 caracteres: letras, números, puntos o guion bajo.'}
          </p>

          <button
            type="submit"
            disabled={saving || Boolean(errorPerfil)}
            className="w-full bg-[#073B43] text-white rounded-lg p-3 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 underline focus-visible:outline-2"
          onClick={salir}
        >
          Salir y cerrar sesión
        </button>
      </section>
    </main>
  )
}
