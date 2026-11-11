
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
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

type RegisterForm = {
  nombres: string
  apellidos: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

const avatars = [
  { id: 'avatar1', emoji: '👩🏻', color: '#D5F3E9' },
  { id: 'avatar2', emoji: '👨🏽', color: '#E9E1FA' },
  { id: 'avatar3', emoji: '👩🏽', color: '#FCEBD8' },
  { id: 'avatar4', emoji: '👨🏻', color: '#DDEEF0' },
]

function Register() {
  const [form, setForm] = useState<RegisterForm>({
    nombres: '',
    apellidos: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [avatar, setAvatar] = useState('avatar1')
  const [terms, setTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')

  const updateField = (field: keyof RegisterForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: '' }))
    setMessage('')
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!form.nombres.trim()) {
      newErrors.nombres = 'Ingresa tus nombres.'
    }

    if (!form.apellidos.trim()) {
      newErrors.apellidos = 'Ingresa tus apellidos.'
    }

    if (!form.username.trim()) {
      newErrors.username = 'Elige un nombre de usuario.'
    } else if (!/^[a-zA-Z0-9_.]{3,20}$/.test(form.username)) {
      newErrors.username =
        'Usa entre 3 y 20 caracteres: letras, números, puntos o guion bajo.'
    }

    if (!form.email.trim()) {
      newErrors.email = 'Ingresa tu correo electrónico.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido.'
    }

    if (!form.password) {
      newErrors.password = 'Ingresa una contraseña.'
    } else if (form.password.length < 8) {
      newErrors.password = 'La contraseña debe tener mínimo 8 caracteres.'
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña.'
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.'
    }

    if (!terms) {
      newErrors.terms = 'Debes aceptar los términos y condiciones.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    if (!validate()) return

    setMessage(
      '¡Validación correcta! El formulario está listo para conectarse con el servicio de registro.'
    )
  }

  const handleGoogleRegister = () => {
    setMessage(
      'El registro con Google estará disponible cuando conectemos Firebase Authentication.'
    )
  }

  return (
    <main className="register-page">
      {/* PANEL IZQUIERDO */}
      <section className="register-brand">
        <Link to="/" className="register-logo">
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

          <p>Equipos de distintas carreras, un solo lugar</p>
        </div>

        <div className="brand-decoration" aria-hidden="true">
          <Mail size={48} />
          <Users size={48} />
        </div>
      </section>

      {/* PANEL DERECHO */}
      <section className="register-content">
        <div className="register-form-container">
          <Link to="/" className="back-home">
            <ArrowLeft size={15} />
            Volver al inicio
          </Link>

          <h2>Crea tu cuenta</h2>

          <p className="register-subtitle">
            Organiza tu próximo encuentro de estudio.
          </p>

          {/* REGISTRO GOOGLE */}
          <button
            type="button"
            className="google-button"
            onClick={handleGoogleRegister}
          >
            <span className="google-letter">G</span>
            Registrarse con Google
          </button>

          <div className="register-divider">
            <span>o regístrate con correo</span>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="nombres">Nombres</label>
                <input
                  id="nombres"
                  type="text"
                  placeholder="Emilio"
                  autoComplete="given-name"
                  value={form.nombres}
                  onChange={(e) => updateField('nombres', e.target.value)}
                  aria-invalid={!!errors.nombres}
                  aria-describedby={errors.nombres ? 'error-nombres' : undefined}
                />
                {errors.nombres && (
                  <small id="error-nombres">{errors.nombres}</small>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="apellidos">Apellidos</label>
                <input
                  id="apellidos"
                  type="text"
                  placeholder="Castro"
                  autoComplete="family-name"
                  value={form.apellidos}
                  onChange={(e) => updateField('apellidos', e.target.value)}
                  aria-invalid={!!errors.apellidos}
                  aria-describedby={errors.apellidos ? 'error-apellidos' : undefined}
                />
                {errors.apellidos && (
                  <small id="error-apellidos">{errors.apellidos}</small>
                )}
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
                onChange={(e) => updateField('username', e.target.value)}
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'error-username' : 'hint-username'}
              />

              <span id="hint-username" className="field-hint">
                Así te encontrarán tus compañeros en AulaPro.
              </span>

              {errors.username && (
                <small id="error-username">{errors.username}</small>
              )}
            </div>

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
                aria-describedby={errors.email ? 'error-email' : undefined}
              />

              {errors.email && <small id="error-email">{errors.email}</small>}
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="password">Contraseña</label>

                <div className="password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'error-password' : undefined}
                  />

                  <button
                    type="button"
                    className="eye-button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((previous) => !previous)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {errors.password && (
                  <small id="error-password">{errors.password}</small>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="confirmPassword">Confirmar contraseña</label>

                <div className="password-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword ? 'error-confirm' : undefined
                    }
                  />

                  <button
                    type="button"
                    className="eye-button"
                    aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowConfirm((previous) => !previous)}
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <small id="error-confirm">{errors.confirmPassword}</small>
                )}
              </div>
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
                  setErrors((previous) => ({ ...previous, terms: '' }))
                  setMessage('')
                }}
                aria-invalid={!!errors.terms}
              />

              <label htmlFor="terms">
                Acepto los{' '}
                <Link to="/terminos">términos y condiciones</Link> de AulaPro.
              </label>
            </div>

            {errors.terms && (
              <small className="terms-error">{errors.terms}</small>
            )}

            {/* MENSAJES */}
            {message && (
              <div className="register-feedback" role="status">
                {message}
              </div>
            )}

            {/* BOTÓN PRINCIPAL */}
            <button type="submit" className="register-submit">
              Crear cuenta
              <ArrowRight size={17} />
            </button>
          </form>

          <p className="login-link">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Register
