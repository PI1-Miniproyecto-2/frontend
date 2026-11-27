# AulaPro

## Salas en tiempo real

Configura `VITE_REALTIME_URL` con la URL base del servicio Socket.IO en el entorno local de Vite y en **Project Settings → Environment Variables** de Vercel. Añádela a los entornos donde se habilitará el chat, como Production y Preview. Vite incorpora la variable durante la compilación, así que se aplicará en el siguiente build de Vercel.

El directorio de participantes usa `GET /api/v1/rooms/{roomId}/members` en `VITE_API_URL`. El servicio Socket.IO debe permitir el origen del frontend para que funcione la conexión desde el navegador.

### Historial de mensajes (US-11)

Después de confirmar el ingreso a la sala, el cliente consulta `chat:history` en el mismo socket. Solicita 20 mensajes por página y usa el cursor devuelto por el servidor para cargar mensajes anteriores. El chat combina el historial, los eventos en tiempo real y las confirmaciones de envío por ID.

Tras una reconexión, el cliente consulta desde los mensajes más recientes hasta encontrar el último punto confirmado antes de la interrupción o llegar al inicio. Cada ciclo consulta hasta cuatro páginas. Si faltan mensajes por recuperar, **Continuar sincronización** reanuda la búsqueda. Si la conexión vuelve a caer, la búsqueda reinicia desde los mensajes más recientes sin perder lo que ya se mostró.

El servidor conserva la autorización del historial y Firestore es la fuente de los mensajes persistidos. Las fechas visibles usan la zona horaria local del navegador.

Para ejecutar las pruebas automatizadas de paginación, deduplicación y reconexión, usa `node --test tests/room-history.test.mjs`.

### Edición de salas (US-07)

El anfitrión puede abrir **Editar sala** desde **Mis salas** o desde la cabecera de la sala. El formulario envía únicamente `{ name }` a `PATCH /api/v1/rooms/{roomId}`. Backend API verifica la sesión, el perfil y el propietario. El nombre admite de 1 a 100 unidades UTF-16 después de recortar los espacios de los extremos.

Backend Realtime notifica a los participantes mediante `room:updated`. El cliente conserva la sesión de chat y consulta el nombre por REST tras reingresar después de una desconexión. Si una respuesta de edición es incierta o REST y Socket.IO discrepan, el cliente vuelve a consultar la sala. El contrato carece de una versión común para ordenar eventos y respuestas concurrentes.

Pruebas automatizadas de edición: `node --test tests/room-edit.test.mjs`.

### Eliminación de salas (US-07)

El anfitrión puede confirmar **Eliminar sala** desde la tarjeta o desde la cabecera. El cliente envía `DELETE /api/v1/rooms/{roomId}` con autenticación y sin cuerpo. Un `204` confirma la eliminación del documento de sala. Los mensajes persistidos por separado se conservan en el backend y dejan de estar accesibles desde esa sala.

`room:deleted` cierra el chat, la presencia y el historial de los usuarios conectados. Si la respuesta de DELETE es incierta, el cliente comprueba la disponibilidad con GET. Un `404` se presenta como sala no disponible. Cualquier nuevo intento de eliminación requiere una confirmación del anfitrión.

Para ejecutar las pruebas del cliente de eliminación, usa `node --test tests/room-delete.test.mjs`.
