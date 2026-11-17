# AulaPro — Salón de estudio colaborativo

> **Frontend de AulaPro** · Proyecto Integrador 2 · Universidad del Valle  
> Aplicación web para gestionar el acceso de estudiantes a un entorno de estudio colaborativo.

## Tabla de contenido

1. [Descripción](#descripción)
2. [Objetivos y alcance](#objetivos-y-alcance)
3. [Estado de implementación](#estado-de-implementación)
4. [Tecnologías](#tecnologías)
5. [Arquitectura e integración](#arquitectura-e-integración)
6. [Estructura del repositorio](#estructura-del-repositorio)
7. [Requisitos e instalación](#requisitos-e-instalación)
8. [Variables de entorno](#variables-de-entorno)
9. [Ejecución y comandos](#ejecución-y-comandos)
10. [Rutas y navegación](#rutas-y-navegación)
11. [Autenticación y perfiles](#autenticación-y-perfiles)
12. [API consumida](#api-consumida)
13. [Docker](#docker)
14. [Despliegue](#despliegue)
15. [Accesibilidad](#accesibilidad)
16. [Validación y pruebas](#validación-y-pruebas)
17. [Problemas conocidos](#problemas-conocidos)
18. [Trabajo pendiente](#trabajo-pendiente)
19. [Colaboración y seguridad](#colaboración-y-seguridad)

## Descripción

**AulaPro** es una aplicación web concebida como un salón de estudio colaborativo. Su objetivo es facilitar el acceso a espacios de estudio, la gestión de perfiles y, en las siguientes etapas del proyecto, la interacción entre estudiantes mediante salas y herramientas de colaboración.

Este repositorio contiene **el frontend**. La API de usuarios y la persistencia de perfiles pertenecen al servicio backend, alojado en un repositorio independiente. La autenticación se gestiona desde el navegador mediante Firebase Authentication y se envían tokens de identidad a la API.

## Objetivos y alcance

- Proporcionar interfaces de registro e inicio de sesión.
- Mantener y verificar el estado de autenticación.
- Consultar, crear y actualizar el perfil mediante la API.
- Proteger el panel y las rutas privadas frente a sesiones no autenticadas o perfiles incompletos.
- Ofrecer una interfaz de panel y navegación hacia salas, perfil y ayuda.
- Preparar la base visual y técnica para futuras funciones colaborativas en tiempo real.

> **Alcance real:** algunas vistas de salas y acciones del panel son prototipos. Este README distingue las interfaces existentes de las funcionalidades verificadas extremo a extremo.

## Estado de implementación

| Módulo | Estado en el código entregado | Observaciones |
| --- | --- | --- |
| Interfaz de registro | Implementada | Validaciones de formulario y selección visual de avatar |
| Registro con correo y contraseña | Integrado con Firebase Auth | La creación del usuario Firebase no garantiza por sí sola que se haya guardado el perfil |
| Inicio de sesión con correo | Integrado con Firebase Auth | La entrada al panel depende también de la respuesta de la API de perfiles |
| Persistencia de sesión | Implementada | `browserLocalPersistence` y observador `onAuthStateChanged` |
| Consulta y creación de perfil | Integración HTTP implementada | Requiere API operativa y credenciales correctas en el backend |
| Completar nombre de usuario | Implementado a nivel de interfaz y llamadas HTTP | Se confirma el perfil antes de permitir el acceso |
| Protección de rutas | Implementada | Requiere usuario y perfil completo; muestra error si falla la consulta |
| Panel de usuario | Prototipo visual | Contiene acciones todavía no conectadas a salas reales |
| Páginas de salas | Vistas base | No implementan todavía la colaboración en tiempo real |
| Inicio de sesión con Google | Servicio disponible | El botón de la página de autenticación aún muestra un mensaje provisional |
| Recuperación de contraseña | Servicio disponible | El botón de la página aún muestra un mensaje provisional |
| Diagnóstico de conexión a API | Implementado | `ApiStatusCheck` consulta `/api/v1/system/status`; no prueba Firestore |

## Tecnologías

Según `package.json` del archivo entregado:

| Tecnología | Uso |
| --- | --- |
| React 19 | Interfaces y componentes |
| TypeScript | Tipado estático |
| Vite 8 | Desarrollo y compilación |
| React Router 7 | Navegación y rutas protegidas |
| Tailwind CSS 4 y CSS | Estilos y diseño adaptable |
| Firebase JavaScript SDK 13 | Autenticación y sesión |
| Lucide React | Iconografía |
| Oxlint | Análisis estático |
| Docker / Nginx | Empaquetado y publicación del frontend |

## Arquitectura e integración

```text
Navegador
  └─ React + TypeScript + Vite
      ├─ Firebase Authentication
      │   └─ Registro, login, sesión e ID token
      ├─ AuthContext + ProtectedRoute
      │   └─ Estado de usuario, perfil y permisos de navegación
      └─ ProfileService (fetch)
          └─ API backend /api/v1/users/me
              └─ Firebase Admin / Firestore (responsabilidad del backend)
```

**Separación de responsabilidades:**

- **Frontend:** formularios, estado de sesión, rutas, componentes y llamadas HTTP.
- **Firebase Authentication:** identidad y emisión de ID tokens.
- **Backend:** validación del token, reglas de negocio, operaciones de perfil y acceso a Firestore.
- **Firestore:** almacenamiento de perfiles, gestionado por el backend; el frontend de este ZIP no consulta Firestore directamente.

Repositorios relacionados:

- Frontend: https://github.com/PI1-Miniproyecto-2/frontend
- Backend API: https://github.com/PI1-Miniproyecto-2/backend-api
- Backend realtime (proyecto relacionado): https://github.com/PI1-Miniproyecto-2/bakend-realtime

## Estructura del repositorio

```text
frontend/
├── public/                 # Recursos estáticos
├── src/
│   ├── components/         # UI reutilizable, navegación y protección de rutas
│   │   ├── ProtectedRoute.tsx
│   │   ├── Sidebar.tsx
│   │   └── ApiStatusCheck.tsx
│   ├── context/
│   │   └── AuthContext.tsx # Sesión, perfil y consulta inicial
│   ├── layouts/
│   │   ├── AppLayout.tsx   # Estructura privada con menú lateral
│   │   └── MainLayout.tsx  # Layout público conservado en el proyecto
│   ├── pages/
│   │   ├── AuthPage.tsx    # Registro e inicio de sesión
│   │   ├── ElegirUsuario.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── Rooms.tsx
│   │   ├── Room.tsx
│   │   ├── RoomForm.tsx
│   │   ├── Help.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   ├── Firebase.ts      # Inicialización del SDK de cliente
│   │   ├── AuthService.ts   # Operaciones Firebase Auth
│   │   ├── ProfileService.ts# Operaciones API de perfil
│   │   └── ApiTemp.ts       # Consulta de estado del backend
│   ├── App.tsx              # Tabla de rutas
│   ├── main.tsx             # Punto de entrada y AuthProvider
│   └── index.css
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
└── vite.config.ts
```

Algunos componentes o páginas se conservan como base para tareas futuras; su presencia no implica que todos sus flujos estén terminados.

## Requisitos e instalación

Se necesita Node.js y npm compatibles con las dependencias declaradas, Git y acceso a un proyecto Firebase configurado. **Verifica la versión de Node requerida por el lockfile y las dependencias antes de instalar**; el Dockerfile utiliza Node 22, pero no se ha validado aquí su compatibilidad con todas las versiones fijadas en el ZIP.

```bash
git clone https://github.com/PI1-Miniproyecto-2/frontend.git
cd frontend
npm ci
```

> Si trabajas con una rama específica, selecciónala con `git switch nombre-de-rama`. El ZIP analizado puede no coincidir con la última versión de `main`.

## Variables de entorno

Crea un archivo **`.env.local`** en la raíz del frontend:

```dotenv
VITE_API_URL=https://backend-api-yzvv.onrender.com
VITE_FIREBASE_API_KEY=valor_de_configuracion_web
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
```

Los valores `VITE_FIREBASE_*` deben corresponder a la **configuración de la aplicación web** registrada en Firebase Console. No copies los ejemplos literalmente.

- `VITE_API_URL` define el origen de la API. Si falta, `ProfileService.ts` usa `http://localhost:3000`.
- Las variables `VITE_*` se incorporan al bundle del navegador: **no son un almacén de secretos**.
- **Nunca** coloques claves privadas de Firebase Admin, JSON de cuentas de servicio, contraseñas ni tokens personales en variables `VITE_*`.
- `.gitignore` excluye archivos `*.local`; verifica los cambios antes de hacer commit.
- El backend tiene sus propias variables, como `FIREBASE_PROJECT_ID` y `CORS_ORIGIN`, que deben configurarse **en el backend**, no en el frontend.

## Ejecución y comandos

```bash
# Servidor de desarrollo
npm run dev

# Forzar puerto 5173 (sin saltar automáticamente a 5174)
npm run dev -- --port 5173 --strictPort

# Compilación de TypeScript y frontend
npm run build

# Analizador estático
npm run lint

# Vista previa de la compilación
npm run preview
```

Normalmente el frontend local se consulta en `http://localhost:5173/`. Si el puerto está ocupado, Vite puede elegir otro a menos que se use `--strictPort`. El origen usado debe estar permitido en el CORS del backend.

## Rutas y navegación

Las rutas se definen en `src/App.tsx`:

| Ruta | Tipo | Función |
| --- | --- | --- |
| `/` | Pública | Redirige a `/register` |
| `/inicio` | Pública | Redirige a `/register`; ya no muestra la pantalla provisional |
| `/register` | Pública | Página de autenticación, registro |
| `/login` | Pública | Misma página de autenticación; verificar modo inicial de login |
| `/elegir-usuario` | Con sesión | Completar nombre de usuario y perfil |
| `/dashboard` | Privada | Panel principal |
| `/profile` | Privada | Perfil |
| `/rooms` | Privada | Lista/base de salas |
| `/rooms/create` | Privada | Formulario/base de creación |
| `/rooms/edit/:id` | Privada | Formulario/base de edición |
| `/room/:id` | Privada | Vista/base de sala |
| `/help` | Privada | Ayuda |
| `/404` | Pública | Página no encontrada |

Las rutas privadas están anidadas dentro de `ProtectedRoute` y `AppLayout`. El layout privado incluye `Sidebar` y un enlace de accesibilidad para saltar al contenido principal.

## Autenticación y perfiles

### Registro con correo

1. El usuario completa el formulario en `AuthPage.tsx`.
2. `registrarConCorreo` crea la cuenta mediante Firebase Authentication.
3. El frontend construye un objeto con nombre, apellido, nombre de usuario y avatar.
4. `crearPerfil` envía un `POST` a `/api/v1/users/me` con el ID token.
5. Se consulta nuevamente el perfil (`refrescarPerfil`).
6. Si `profileCompleted` es verdadero y hay `username`, se navega a `/dashboard`; en otro caso, a `/elegir-usuario`.

**Nota:** en el código revisado, el avatar seleccionado visualmente no se transmite como tal; el registro envía `avatar_book`. Es una mejora pendiente.

### Inicio de sesión con correo

1. `iniciarSesionConCorreo` valida correo y contraseña en Firebase.
2. `refrescarPerfil` consulta el perfil mediante la API.
3. Si está completo, se permite `/dashboard`; si no, se solicita completar el perfil.

La persistencia de sesión se configura con `browserLocalPersistence`. `AuthContext` escucha cambios de autenticación con `onAuthStateChanged`.

### Protección de rutas

`ProtectedRoute.tsx`:

- Espera mientras se verifica la sesión.
- Redirige a `/login` si no existe usuario autenticado.
- Bloquea el acceso y muestra un error si falla la consulta del perfil.
- Redirige a `/elegir-usuario` cuando el perfil está incompleto.
- Muestra las rutas privadas solo con sesión y perfil completo confirmados.

### Google y recuperación de contraseña

`AuthService.ts` contiene `iniciarSesionConGoogle` y `recuperarContrasena`, pero **los botones correspondientes en `AuthPage.tsx` todavía muestran mensajes provisionales**. No se documentan como flujos de interfaz terminados.

## API consumida

Base URL configurable con `VITE_API_URL`.

| Método | Endpoint | Uso desde el frontend |
| --- | --- | --- |
| `GET` | `/api/v1/system/status` | Verificar estado del backend |
| `GET` | `/api/v1/users/me` | Consultar perfil autenticado |
| `POST` | `/api/v1/users/me` | Crear perfil |
| `PATCH` | `/api/v1/users/me` | Actualizar perfil |
| `DELETE` | `/api/v1/users/me` | Eliminar perfil (servicio disponible) |

Las operaciones de perfil incluyen el encabezado:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

Cuando se envían datos, se utiliza `Content-Type: application/json`. El frontend no debe enviar la contraseña a la API de perfiles.

**Ejemplo de datos de perfil enviados por el frontend:**

```json
{
  "firstName": "Ejemplo",
  "lastName": "Estudiante",
  "username": "ejemplo.est",
  "avatarId": "avatar_book"
}
```

La respuesta esperada por el frontend incluye campos como `email`, `username`, `profileCompleted`, `avatarId`, `authProvider`, `createdAt` y `updatedAt`. El contrato y los códigos de error definitivos deben contrastarse con la documentación del backend.

Documentación de la API desplegada: https://backend-api-yzvv.onrender.com/api-docs/

## Docker

El repositorio incluye un `Dockerfile` multietapa:

1. Construye el frontend con `node:22-alpine` y `npm ci`.
2. Ejecuta `npm run build`.
3. Copia `dist/` a una imagen `nginx:alpine`.
4. Expone el puerto 80 del contenedor.

Para construir la imagen:

```bash
docker build -t aulapro-frontend .
docker run --rm -p 8080:80 aulapro-frontend
```

El archivo `docker-compose.yml` define los servicios `frontend` y `backend`, y presupone que el backend está en una carpeta hermana `../Backend1`:

```text
carpeta-padre/
├── frontend/    # Este repositorio
└── Backend1/    # Repositorio backend con Dockerfile
```

Para iniciar ambos servicios:

```bash
docker compose config
docker compose up --build -d
docker compose ps
```

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000`

**Limitaciones de la configuración Docker incluida:**

- El `docker-compose.yml` no incluye el servicio realtime.
- La configuración de Firebase Admin/Firestore del backend puede requerir credenciales adicionales, que **no deben** introducirse en el repositorio.
- Vite incorpora las variables `VITE_*` **durante la compilación**. El Dockerfile entregado no declara argumentos para inyectarlas, por lo que se debe revisar la estrategia de build antes de esperar que el frontend servido por Nginx utilice una API externa.
- Para rutas de SPA como `/dashboard`, Nginx puede necesitar una regla `try_files ... /index.html`; el Dockerfile entregado no incorpora una configuración Nginx personalizada.

## Despliegue

El frontend está diseñado para desplegarse como aplicación Vite estática, por ejemplo en Vercel. Configuración típica:

| Campo | Valor |
| --- | --- |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Variables de entorno | `VITE_API_URL` y `VITE_FIREBASE_*` |

La URL de producción debe estar autorizada en el CORS del backend. Para rutas de React Router es necesario configurar la reescritura a `index.html` en el proveedor de hosting si no la proporciona automáticamente.

**Importante:** este ZIP no demuestra por sí solo que el despliegue automático desde cada PR esté configurado; eso debe verificarse en Vercel y GitHub.

## Accesibilidad

El código incluye varias medidas de accesibilidad:

- Etiquetas asociadas a entradas de formularios.
- Estados `aria-invalid` y mensajes de validación.
- Indicadores de carga y mensajes de error.
- Navegación mediante rutas y componentes semánticos.
- Enlace «Saltar al contenido principal» en el layout privado.
- Estilos de foco visible en componentes de autenticación y navegación.

Estas medidas **no sustituyen** una auditoría completa con teclado, lector de pantalla y herramientas como Lighthouse.

## Validación y pruebas

Antes de abrir un pull request:

```bash
npm ci
npm run lint
npm run build
```

Pruebas manuales recomendadas:

1. Abrir `/` y verificar redirección a `/register`.
2. Comprobar que `/inicio` no muestra la página provisional.
3. Probar validaciones de campos del registro.
4. Crear una cuenta de prueba en Firebase Auth y comprobar si la API crea el perfil.
5. Iniciar sesión con una cuenta existente y comprobar la consulta del perfil.
6. Acceder a `/dashboard` sin sesión y verificar la redirección.
7. Acceder con perfil incompleto y comprobar `/elegir-usuario`.
8. Simular fallo de API y confirmar que no se concede acceso al panel.
9. Revisar diseño adaptable, navegación por teclado y foco visible.

**No se identificó en el ZIP un script `npm test` ni una suite de tests automatizados.** No debe afirmarse cobertura automatizada sin agregarla y ejecutarla.

## Problemas conocidos

- **HTTP 500 en `/api/v1/users/me`:** observado durante la integración con el backend en Render. El frontend puede autenticar en Firebase, pero no completar el flujo de perfil mientras el endpoint falle. La causa debe diagnosticarse en los logs y configuración del backend; no está resuelta por el código de este ZIP.
- **CORS y puertos:** el backend debe permitir el origen exacto del frontend (`5173`, `5174` u origen de producción). Una respuesta `OPTIONS` exitosa no garantiza que las peticiones `GET` o `POST` reales funcionen.
- **Login por URL:** `/login` y `/register` renderizan `AuthPage`; el modo inicial de la pantalla debe revisarse para asegurar que `/login` abra directamente el formulario correcto.
- **Google y recuperación de contraseña:** botones aún no conectados a las funciones ya existentes en el servicio.
- **Avatar:** la selección visual no está asociada todavía al valor enviado en la creación del perfil.
- **Salas:** las pantallas existen, pero la creación, unión y colaboración en tiempo real no están implementadas en este frontend.
- **Panel:** contiene textos y datos de demostración; no representan necesariamente información del usuario autenticado.

## Trabajo pendiente

1. Corregir y validar el endpoint de perfil en el backend y su autenticación con Firebase Admin.
2. Completar las pruebas de registro, perfil e inicio de sesión de extremo a extremo.
3. Conectar el botón de Google y la recuperación de contraseña con los servicios disponibles.
4. Ajustar el modo inicial de `/login` y los enlaces de retorno a inicio.
5. Enviar el avatar realmente seleccionado y validar su compatibilidad con la API.
6. Sustituir los datos simulados del dashboard por información real.
7. Implementar servicios y flujos de salas.
8. Integrar funcionalidades de chat, tiempo real y audiovisual en los sprints correspondientes.
9. Añadir pruebas automatizadas y documentación de evidencias de QA.
10. Revisar el build Docker, la configuración de Nginx para SPA y la integración del servicio realtime.

## Colaboración y seguridad

Flujo recomendado de Git:

```bash
git switch -c feature/nombre-tarea
# Realizar cambios y ejecutar validaciones
git add .
git diff --cached --name-only
git commit -m "feat: descripcion del cambio"
git push -u origin feature/nombre-tarea
```

Crear un Pull Request hacia `main` y documentar alcance, pruebas realizadas, capturas y pendientes. No subir archivos `.env.local`, tokens, contraseñas, credenciales de Firebase Admin ni archivos JSON de cuentas de servicio.

---

**AulaPro · Proyecto Integrador 2 · Universidad del Valle**  
