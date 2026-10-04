# Credenciales — de dónde sale cada variable

Todas van en `.env.local` (raíz) salvo las de `dispatch/`, que van en `dispatch/.env`. Ninguna se sube al repo ni se pega
en chats o capturas. Se configuran de a una: el hub funciona con las que pongas y apaga el resto.

| Servicio | Variables | Qué activa si falta |
|---|---|---|
| Firebase Auth | `NEXT_PUBLIC_FIREBASE_*` | Sin ellas no hay login (el hub corre abierto, solo para uso local) |
| Firestore | `NEXT_PUBLIC_FIRESTORE_DATABASE`, ADC de gcloud | Los scripts de `scripts/` no funcionan |
| Google Drive (lectura) | `GOOGLE_SERVICE_ACCOUNT_JSON`, `DRIVE_ROOT_FOLDER_ID` | Sin archivos en producción |
| Google Drive (escritura) | `GOOGLE_OAUTH_*` | Sin portadas generadas ni subidas |
| Meta (Instagram, Facebook) | `META_*` | Sin conciliación ni programación en Facebook |
| Threads | `THREADS_*` | Sin conciliación de Threads |
| Bluesky | `BLUESKY_*` | Sin publicación ni conciliación de Bluesky |
| X | `X_*` (en `dispatch/.env`) | Sin publicación en X |
| IA | `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` | Sin generación de texto asistida |

## Firebase (login y Firestore)

1. [console.firebase.google.com](https://console.firebase.google.com) → crea un proyecto (o usa uno existente).
2. **Authentication → Sign-in method → Google → Habilitar.** En *Settings → Authorized domains* agrega `localhost` y, más tarde,
   el dominio de producción.
3. **Configuración del proyecto → Tus apps → Web (`</>`)** → registra la app y copia la "Configuración del SDK" a las seis
   variables `NEXT_PUBLIC_FIREBASE_*`. Son identificadores públicos.
4. **Firestore Database → Crear base de datos.** Si usas la base por defecto, deja `NEXT_PUBLIC_FIRESTORE_DATABASE` vacío; si
   creas una con nombre, escribe ese nombre.
5. Para los scripts de `scripts/` (usan permisos de administrador, no hay claves en el repo):
   `gcloud auth application-default login` y confirma que `NEXT_PUBLIC_FIREBASE_PROJECT_ID` es el proyecto correcto.
6. `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` (opcional): dominio de tu Google Workspace.

## Google Drive

El hub necesita una carpeta raíz (por ejemplo "Redes sociales") con la estructura de `docs/adaptacion.md` §5.

1. [console.cloud.google.com](https://console.cloud.google.com) → proyecto → **APIs y servicios → Biblioteca → Google Drive API → Habilitar.**
2. **Lectura (cuenta de servicio):** *Credenciales → Crear credenciales → Cuenta de servicio* → crea una clave JSON.
   Comparte la carpeta raíz de Drive con el correo de la cuenta de servicio (rol *Lector*). Pon el JSON en **una sola línea**
   en `GOOGLE_SERVICE_ACCOUNT_JSON`, o la ruta a un archivo guardado **fuera** del repo.
3. **Escritura (tu cuenta, OAuth):** una cuenta de servicio no tiene cuota y no puede crear archivos. *Credenciales → Crear
   credenciales → ID de cliente de OAuth → Aplicación de escritorio.* Copia ID y secreto a `GOOGLE_OAUTH_CLIENT_ID` y
   `GOOGLE_OAUTH_CLIENT_SECRET`. Si la pantalla de consentimiento está en "Pruebas", agrega tu correo como usuario de prueba.
4. Ejecuta **una vez**: `node scripts/drive-authorize.mjs`. Abre el navegador, autorizas y deja `GOOGLE_OAUTH_REFRESH_TOKEN` en `.env.local`.
5. `DRIVE_ROOT_FOLDER_ID`: el texto que aparece después de `/folders/` en la dirección de la carpeta raíz.
6. En tu máquina con Drive para escritorio, `RS` apunta a esa misma carpeta (por ejemplo `G:/My Drive/Marketing/Redes sociales`).

## Meta (Instagram y Facebook) y Threads

1. [developers.facebook.com](https://developers.facebook.com) → *Mis apps → Crear app* (tipo Empresa). Copia el **ID de la app**
   a `META_APP_ID` y el **secreto** (*Configuración → Básica*) a `META_APP_SECRET`.
2. Agrega los productos que uses (Inicio de sesión con Facebook, Instagram Graph API). Para Threads se crea otra app de caso de uso
   Threads, con su propio ID y secreto (`THREADS_APP_ID`, `THREADS_APP_SECRET`).
3. **`META_PAGE_ID`:** el ID numérico de tu Página de Facebook (*Página → Información → ID de la página*).
4. **`META_PAGE_TOKEN`:** token de acceso de la Página con permisos `pages_manage_posts`, `pages_read_engagement` e
   `instagram_basic`. Genéralo en el Explorador de la Graph API y cámbialo por uno de larga duración. Los permisos más allá de tu
   propio rol requieren revisión de la app por Meta.
5. **`THREADS_USER_TOKEN`:** token de usuario de Threads (`threads_basic`, `threads_content_publish`).
6. Las variables `*_REDIRECT_URI` quedan con `localhost` en local; en producción usa tu dominio. **Esta plantilla no incluye todavía
   las rutas `/api/oauth/*`**: los tokens se obtienen a mano como en los pasos 4 y 5.

## Bluesky

*Settings → Privacy and security → App passwords → Add app password.* Usa esa contraseña (no la de la cuenta) en
`BLUESKY_APP_PASSWORD`; `BLUESKY_IDENTIFIER` es tu handle (`tu-usuario.bsky.social` o tu dominio).

## X (Twitter)

[developer.x.com](https://developer.x.com) → *Projects & Apps* → tu app → *Keys and tokens*. Genera API Key/Secret y Access
Token/Secret **con permiso "Read and Write"** (si lo cambias después, regenera los tokens). Van en `dispatch/.env`.

## IA (opcional)

- `GEMINI_API_KEY`: clave de [Google AI Studio](https://aistudio.google.com) (capa gratuita).
- `ANTHROPIC_API_KEY`: clave de [console.anthropic.com](https://console.anthropic.com), respaldo cuando se agota Gemini.
- `AI_CLAUDE_MONTHLY_CAP_USD`: tope mensual en dólares; al alcanzarlo, el flujo se pausa.

## Buenas prácticas

- Un `.env.local` por persona/máquina; no se copia entre repos ni por chat.
- En producción los secretos viven en el gestor del proveedor (Secret Manager en Firebase), no en archivos: `docs/despliegue.md`.
- Si un secreto se filtra, **rótalo de inmediato** en el servicio de origen y luego actualiza `.env.local` y el gestor de secretos.
