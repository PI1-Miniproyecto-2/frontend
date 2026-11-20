
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  registrarConCorreo,
  iniciarSesionConCorreo,
  iniciarSesionConGoogle,
  mensajeErrorFirebase,
} from '../services/AuthService'

import {
  crearPerfil,
  consultarPerfil,
  type DatosPerfil,
} from '../services/ProfileService'

import { useAuth } from '../context/AuthContext'
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  Mail,
  Users,
} from 'lucide-react'

const avatars = [
  { id: 'avatar1', emoji: '👩🏻', color: '#D5F3E9' },
  { id: 'avatar2', emoji: '👨🏽', color: '#E9E1FA' },
  { id: 'avatar3', emoji: '👩🏽', color: '#FCEBD8' },
  { id: 'avatar4', emoji: '👨🏻', color: '#DDEEF0' },
]

type FormData = {
  nombres: string
  apellidos: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

function AuthPage() {
    const navigate = useNavigate()
  const { refrescarPerfil } = useAuth()
  // false = Registro | true = Inicio de sesión
  const [isLogin, setIsLogin] = useState(false)

  const [form, setForm] = useState<FormData>({
    nombres: '',
    apellidos: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [avatar, setAvatar] = useState('avatar1')
  const [terms, setTerms] = useState(false)
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (field: keyof FormData, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: '' }))
    setMessage('')
  }

  // Cambia entre Registro e Inicio de sesión sin recargar
  const changeMode = (loginMode: boolean) => {
    setIsLogin(loginMode)
    setErrors({})
    setMessage('')
    setShowPassword(false)
    setShowConfirm(false)
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (isLogin) {
      if (!form.email.trim()) {
        newErrors.email = 'Este campo es obligatorio.'
      } else if (!validateEmail(form.email)) {
        newErrors.email = 'Ingresa un correo electrónico válido.'
      }

      if (!form.password) {
        newErrors.password = 'Este campo es obligatorio.'
      } else if (form.password.length < 8) {
        newErrors.password = 'La contraseña debe tener mínimo 8 caracteres.'
      }
    } else {
      if (!form.nombres.trim()) {
        newErrors.nombres = 'Este campo es obligatorio.'
      }

      if (!form.apellidos.trim()) {
        newErrors.apellidos = 'Este campo es obligatorio.'
      }

      if (!form.username.trim()) {
        newErrors.username = 'Este campo es obligatorio.'
      } else if (!/^[a-zA-Z0-9_.]{3,20}$/.test(form.username)) {
        newErrors.username =
          'Usa entre 3 y 20 caracteres: letras, números, puntos o guion bajo.'
      }

      if (!form.email.trim()) {
        newErrors.email = 'Este campo es obligatorio.'
      } else if (!validateEmail(form.email)) {
        newErrors.email = 'Ingresa un correo electrónico válido.'
      }

      if (!form.password) {
        newErrors.password = 'Este campo es obligatorio.'
      } else if (form.password.length < 8) {
        newErrors.password = 'La contraseña debe tener mínimo 8 caracteres.'
      }

      if (!form.confirmPassword) {
        newErrors.confirmPassword = 'Este campo es obligatorio.'
      } else if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden.'
      }

      if (!terms) {
        newErrors.terms = 'Debes aceptar los términos y condiciones.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  const mensajeErrorAPI = (error: unknown): string => {
    const apiError = error as Error & { status?: number }

    if (apiError.status === 409) {
      return 'El nombre de usuario está ocupado o el perfil ya existe.'
    }

    if (apiError.status === 400) {
      return 'Los datos del perfil no son válidos.'
    }

    if (apiError.status === 401) {
      return 'La API no autorizó tu sesión.'
    }

    return apiError.message || 'No fue posible guardar el perfil.'
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) return

    setMessage('')

    if (!validate()) return

    setLoading(true)

    try {
if (isLogin) {
  // 1. Autenticar al usuario en Firebase.
  await iniciarSesionConCorreo(form.email, form.password)

  // 2. Consultar el perfil real mediante la API.
  const perfilActualizado = await refrescarPerfil()

  // 3. Permitir el acceso solo si el perfil está completo.
  if (
    perfilActualizado?.profileCompleted &&
    perfilActualizado.username?.trim()
  ) {
    navigate('/dashboard', { replace: true })
  } else {
    navigate('/elegir-usuario', { replace: true })
  }

  return
}

      // Crear cuenta en Firebase.
      await registrarConCorreo(form.email, form.password)

      // Preparar datos para la API.
      // No enviar correo ni contraseña.
      const datosPerfil: DatosPerfil = {
        firstName: form.nombres.trim(),
        lastName: form.apellidos.trim(),
        username: form.username.trim(),
        avatarId: 'avatar_book',
      }

      let perfilGuardado

      // Crear perfil en el backend.
      try {
        perfilGuardado = await crearPerfil(datosPerfil)
      } catch (error) {
        const status = (error as Error & { status?: number }).status

        // Verificar si el perfil se guardó antes
        // de intentar otra creación.
        if (status === 409 || status === 500 || status === 503) {
          try {
            perfilGuardado = await consultarPerfil()
          } catch {
            // Mantener el error original.
          }

          if (!perfilGuardado) {
            throw error
          }
        } else {
          throw error
        }
      }

      // Actualizar el perfil del contexto.
      const perfilActualizado = await refrescarPerfil()

      if (
        perfilActualizado?.profileCompleted &&
        perfilActualizado.username?.trim()
      ) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/elegir-usuario', { replace: true })
      }
    } catch (error) {
      const codigo =
        typeof error === 'object' &&
        error !== null &&
        'code' in error
          ? String(error.code)
          : ''

      if (codigo.startsWith('auth/')) {
        setMessage(mensajeErrorFirebase(error))
      } else {
        setMessage(
          `No se pudo completar el registro: ${mensajeErrorAPI(error)}`
        )
      }
    } finally {
      setLoading(false)
    }
  }




const handleGoogle = async () => {
  if (loading) return

  setLoading(true)
  setMessage('')
  setErrors({})

  try {
    // 1. Abrir Google y autenticar con Firebase.
    await iniciarSesionConGoogle()

    // 2. Consultar el perfil a través del backend.
    const perfilActualizado = await refrescarPerfil()

    // 3. Si ya tiene un perfil completo, entrar al Dashboard.
    if (
      perfilActualizado?.profileCompleted &&
      perfilActualizado.username?.trim()
    ) {
      navigate('/dashboard', { replace: true })
      return
    }

    // 4. Si es un usuario nuevo, completar su perfil.
    navigate('/elegir-usuario', { replace: true })

  } catch (error) {
    console.error('Error de autenticación con Google:', error)

    const codigo =
      typeof error === 'object' &&
      error !== null &&
      'code' in error
        ? String(error.code)
        : ''

    if (codigo.startsWith('auth/')) {
      setMessage(mensajeErrorFirebase(error))
    } else {
      setMessage(
        `No fue posible completar el acceso con Google: ${mensajeErrorAPI(error)}`
      )
    }
  } finally {
    setLoading(false)
  }
}


  const handleForgotPassword = () => {
    setMessage(
      'La recuperación de contraseña estará disponible al conectar Firebase Authentication.'
    )
  }

  return (
    <main className="register-page">
      {/* PANEL IZQUIERDO: PERMANECE IGUAL EN AMBAS PANTALLAS */}
      <section className="register-brand">
        <Link to="/inicio" className="register-logo">
          <BookOpen size={23} strokeWidth={2} />
          <span>AulaPro</span>
        </Link>

        <div className="brand-message">
          <span className="brand-eyebrow">
            APRENDER TAMBIÉN ES CONVERSAR
          </span>

          <span className="brand-quote">“</span>

          <h1>
            Cuando explicas una
            <br />
            idea a tu equipo,
            <br />
            también la entiendes
            <br />
            mejor.
          </h1>

          <div className="brand-line" />

          <p>Emilio, estudiante de Diseño Visual</p>
        </div>

        <div className="brand-decoration" aria-hidden="true">
          <Mail size={48} />
          <Users size={48} />
        </div>

        <span className="brand-footer">
          AulaPro · Entorno de demostración
        </span>
      </section>

      {/* PANEL DERECHO: FORMULARIO DINÁMICO */}
      <section className="register-content">
        <div className="register-form-container">
          <Link to="/inicio" className="back-home">
            <ArrowLeft size={15} />
            Volver al inicio
          </Link>

<h2>
  {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
</h2>

<p className="register-subtitle">
  {isLogin
    ? 'Tu próxima sesión de estudio está a un clic.'
    : 'Organiza tu próximo encuentro de estudio.'}
</p>

{/* BOTONES PARA CAMBIAR ENTRE REGISTRO E INICIO DE SESIÓN */}
<div
  role="group"
  aria-label="Seleccionar tipo de acceso"
  className="mt-5 mb-6 grid grid-cols-2 gap-3"
>
  <button
    type="button"
    onClick={() => changeMode(false)}
    aria-pressed={!isLogin}
    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F77] ${
      !isLogin
        ? 'border-[#2FC79B] bg-[#2FC79B] text-[#073B43]'
        : 'border-[#DCE9E8] bg-white text-[#073B43] hover:bg-[#F1F7F6]'
    }`}
  >
    Crear cuenta
  </button>

  <button
    type="button"
    onClick={() => changeMode(true)}
    aria-pressed={isLogin}
    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F77] ${
      isLogin
        ? 'border-[#2FC79B] bg-[#2FC79B] text-[#073B43]'
        : 'border-[#DCE9E8] bg-white text-[#073B43] hover:bg-[#F1F7F6]'
    }`}
  >
    Iniciar sesión
  </button>
</div>


          {/* MENSAJE DE ERROR O INFORMACIÓN */}
          {message && (
            <div
              className={`register-feedback ${
                isLogin && message === 'Correo o contraseña incorrectos'
                  ? 'login-error'
                  : ''
              }`}
              role={isLogin ? 'alert' : 'status'}
            >
              {message}
            </div>
          )}

          {/* GOOGLE */}


        <button
          type="button"
          className="google-button"
          onClick={handleGoogle}
          disabled={loading}
        >
          <span className="google-letter">G</span>
          {loading
            ? 'Conectando con Google...'
            : isLogin
              ? 'Continuar con Google'
              : 'Registrarse con Google'}
        </button>



          <div className="register-divider">
            <span>
              {isLogin ? 'o continúa con' : 'o regístrate con correo'}
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* CAMPOS EXCLUSIVOS DEL REGISTRO */}
            {!isLogin && (
              <>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="nombres">Nombres</label>
                    <input
                      id="nombres"
                      type="text"
                      placeholder="Emilio"
                      autoComplete="given-name"
                      value={form.nombres}
                      onChange={(e) =>
                        updateField('nombres', e.target.value)
                      }
                      aria-invalid={!!errors.nombres}
                    />
                    {errors.nombres && <small>{errors.nombres}</small>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="apellidos">Apellidos</label>
                    <input
                      id="apellidos"
                      type="text"
                      placeholder="Castro"
                      autoComplete="family-name"
                      value={form.apellidos}
                      onChange={(e) =>
                        updateField('apellidos', e.target.value)
                      }
                      aria-invalid={!!errors.apellidos}
                    />
                    {errors.apellidos && <small>{errors.apellidos}</small>}
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="username">Nombre de usuario</label>
                  <input
                    id="username"
                    type="text"
                    placeholder="emilio.c"
                    autoComplete="username"
                    value={form.username}
                    onChange={(e) =>
                      updateField('username', e.target.value)
                    }
                    aria-invalid={!!errors.username}
                  />

                  <span className="field-hint">
                    Así te encontrarán tus compañeros en AulaPro.
                  </span>

                  {errors.username && <small>{errors.username}</small>}
                </div>
              </>
            )}

            {/* CORREO: COMPARTIDO POR AMBOS FORMULARIOS */}
            <div className="form-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                placeholder="nombre@universidad.edu"
                autoComplete="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && <small>{errors.email}</small>}
            </div>

            {/* CONTRASEÑA */}
            <div className="form-field">
              <label htmlFor="password">Contraseña</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  aria-invalid={!!errors.password}
                />

                <button
                  type="button"
                  className="eye-button"
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  onClick={() => setShowPassword((previous) => !previous)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {errors.password && <small>{errors.password}</small>}
            </div>

            {/* CAMPOS EXCLUSIVOS DEL REGISTRO */}
            {!isLogin && (
              <>
                <div className="form-field">
                  <label htmlFor="confirmPassword">
                    Confirmar contraseña
                  </label>

                  <div className="password-wrapper">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repite tu contraseña"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        updateField('confirmPassword', e.target.value)
                      }
                      aria-invalid={!!errors.confirmPassword}
                    />

                    <button
                      type="button"
                      className="eye-button"
                      aria-label={
                        showConfirm
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      onClick={() => setShowConfirm((previous) => !previous)}
                    >
                      {showConfirm ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <small>{errors.confirmPassword}</small>
                  )}
                </div>

                {/* AVATARES */}
                <div className="avatar-section">
                  <label>Elige tu avatar de perfil</label>

                  <div className="avatar-list">
                    {avatars.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`avatar-option ${
                          avatar === item.id ? 'selected' : ''
                        }`}
                        style={{ backgroundColor: item.color }}
                        onClick={() => setAvatar(item.id)}
                        aria-label={`Elegir avatar ${item.id}`}
                        aria-pressed={avatar === item.id}
                      >
                        <span>{item.emoji}</span>

                        {avatar === item.id && (
                          <span className="avatar-check">
                            <Check size={11} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TÉRMINOS */}
                <div className="terms-container">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => {
                      setTerms(e.target.checked)
                      setErrors((previous) => ({
                        ...previous,
                        terms: '',
                      }))
                    }}
                    aria-invalid={!!errors.terms}
                  />

                  <label htmlFor="terms">
                    Acepto los <Link to="/terminos">términos y condiciones</Link>{' '}
                    de AulaPro.
                  </label>
                </div>

                {errors.terms && (
                  <small className="terms-error">{errors.terms}</small>
                )}
              </>
            )}

            {/* OPCIONES EXCLUSIVAS DEL LOGIN */}
            {isLogin && (
              <div className="login-options">
                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Recordar datos
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={handleForgotPassword}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* BOTÓN PRINCIPAL */}
            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading
                ? isLogin
                  ? 'Iniciando sesión...'
                  : 'Creando cuenta...'
                : isLogin
                  ? 'Iniciar sesión'
                  : 'Crear cuenta'}

              {!loading && <ArrowRight size={17} />}
              {loading && <span className="auth-spinner" />}
            </button>
          </form>

          {/* CAMBIAR ENTRE REGISTRO Y LOGIN */}
          <p className="login-link">
            {isLogin ? (
              <>
                ¿Aún no tienes cuenta?{' '}
                <button
                  type="button"
                  className="auth-switch"
                  onClick={() => changeMode(false)}
                >
                  Crear una cuenta
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  className="auth-switch"
                  onClick={() => changeMode(true)}
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </section>
    </main>
  )
}

export default AuthPage
