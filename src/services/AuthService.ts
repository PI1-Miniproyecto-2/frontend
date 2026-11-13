
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  type UserCredential,
} from 'firebase/auth'

import {
  auth,
  googleProvider,
  persistirSesion,
} from './Firebase'

export async function registrarConCorreo(
  email: string,
  password: string
): Promise<UserCredential> {
  await persistirSesion()

  return createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  )
}

export async function iniciarSesionConCorreo(
  email: string,
  password: string
): Promise<UserCredential> {
  await persistirSesion()

  return signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  )
}

export async function iniciarSesionConGoogle(): Promise<UserCredential> {
  await persistirSesion()

  googleProvider.setCustomParameters({
    prompt: 'select_account',
  })

  return signInWithPopup(auth, googleProvider)
}

export async function recuperarContrasena(email: string) {
  return sendPasswordResetEmail(auth, email.trim())
}

export async function cerrarSesionFirebase() {
  return signOut(auth)
}

export async function obtenerToken() {
  const user = auth.currentUser

  if (!user) {
    throw new Error('No hay una sesión autenticada.')
  }

  return user.getIdToken()
}

export function mensajeErrorFirebase(error: unknown): string {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error
      ? String(error.code)
      : ''

  const errores: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/popup-closed-by-user': 'Se canceló el inicio de sesión con Google.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana de Google.',
    'auth/cancelled-popup-request': 'La solicitud de Google fue cancelada.',
    'auth/network-request-failed': 'Error de conexión. Inténtalo nuevamente.',
    'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde.',
  }

  return errores[code] || 'Ocurrió un error. Inténtalo nuevamente.'
}
