# AulaPro

## Salas en tiempo real

Configura `VITE_REALTIME_URL` con la URL base del servicio Socket.IO en el entorno local de Vite y en **Project Settings → Environment Variables** de Vercel. Añádela a los entornos donde se habilitará el chat, como Production y Preview. Vite incorpora la variable durante la compilación, así que se aplicará en el siguiente build de Vercel.

El directorio de participantes usa `GET /api/v1/rooms/{roomId}/members` en `VITE_API_URL`. El servicio Socket.IO debe permitir el origen del frontend para que funcione la conexión desde el navegador.

### Historial de mensajes (US-11)

Después de confirmar el ingreso a la sala, el cliente consulta `chat:history` en el mismo socket. Solicita 20 mensajes por página y usa el cursor devuelto por el servidor para cargar mensajes anteriores. El chat combina el historial, los eventos en tiempo real y las confirmaciones de envío por ID.

Tras una reconexión, el cliente consulta desde los mensajes más recientes hasta encontrar el último punto confirmado antes de la interrupción o llegar al inicio. Cada ciclo consulta hasta cuatro páginas. Si faltan mensajes por recuperar, **Continuar sincronización** reanuda la búsqueda. Si la conexión vuelve a caer, la búsqueda reinicia desde los mensajes más recientes sin perder lo que ya se mostró.

El servidor conserva la autorización del historial y Firestore es la fuente de los mensajes persistidos. Las fechas visibles usan la zona horaria local del navegador.

Para ejecutar las pruebas automatizadas de paginación, deduplicación y reconexión, usa `node --test tests/room-history.test.mjs`.
