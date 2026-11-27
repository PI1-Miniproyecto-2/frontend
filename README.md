# AulaPro

## Salas en tiempo real

Configura `VITE_REALTIME_URL` con la URL base del servicio Socket.IO en el entorno local de Vite y en **Project Settings → Environment Variables** de Vercel. Añádela a los entornos donde se habilitará el chat, como Production y Preview. Vite incorpora la variable durante la compilación, así que se aplicará en el siguiente build de Vercel.

El directorio de participantes usa `GET /api/v1/rooms/{roomId}/members` en `VITE_API_URL`. El servicio Socket.IO debe permitir el origen del frontend para que funcione la conexión desde el navegador.
