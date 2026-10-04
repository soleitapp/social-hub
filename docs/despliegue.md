# Despliegue — Firebase App Hosting

La plantilla viene preparada para Firebase App Hosting (Next.js sobre Cloud Run). Cualquier host de Node también sirve
(`npm run build` + `npm start`), pero sin App Hosting tendrás que replicar a mano el modo solo lectura y los secretos.

## Antes de empezar

- Proyecto de Firebase con plan Blaze (App Hosting lo exige) y `firebase-tools` instalado (`npm i -g firebase-tools`, `firebase login`).
- Las credenciales de `docs/credenciales.md` ya probadas en local.
- `data/pieces.json` al día: **se importa al compilar**, así que lo que se publica es la versión de esta carpeta.

## Archivos de configuración (completa los marcadores)

| Archivo | Qué poner |
|---|---|
| `.firebaserc` | `TU-PROYECTO-FIREBASE` → el ID de tu proyecto |
| `firebase.json` | `TU-BACKEND-APPHOSTING` → el ID del backend que crees (por ejemplo `social-hub`); lista de carpetas que no se suben |
| `apphosting.yaml` | Instancias (mín. 0, máx. 2), variables y secretos del servidor; `ID_DE_LA_CARPETA_RAIZ_DE_DRIVE` → tu `DRIVE_ROOT_FOLDER_ID` |
| `middleware.js` | Modo solo lectura (ver abajo) |

Las variables `NEXT_PUBLIC_*` (Firebase y marca) también deben estar en `apphosting.yaml` con `availability: [BUILD]`, porque se
incrustan al compilar; no son secretas. Ejemplo:

```yaml
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: "tu-api-key-web"
    availability: [BUILD]
```

## Primer despliegue

```
firebase apphosting:backends:create --project TU-PROYECTO-FIREBASE   # elige región y el ID del backend
firebase deploy --only apphosting
```

Para ver el estado: `firebase apphosting:backends:get TU-BACKEND-APPHOSTING --project TU-PROYECTO-FIREBASE`.
Si no conectas el backend a GitHub, cada deploy sale de esta carpeta con la CLI.

## Modo solo lectura (`HUB_READONLY=1`)

Mientras el servidor no verifique la sesión del usuario, la publicación bloquea con 401 todo `/api/*` salvo `GET /api/cover/*` y
`GET /api/drive/*`. Así nadie con la URL puede escribir en Drive. El login de Google es solo del navegador, y el contenido de las
piezas viaja en el JavaScript de la página: **la URL no debe difundirse**.

Para quitar el modo solo lectura hay que implementar la verificación de sesión en servidor en cada ruta de `app/api/` y
eliminar `HUB_READONLY` de `apphosting.yaml`. Sin eso, déjalo activo en producción.

## Secretos

El asistente o cualquier automatización no debería escribir en Secret Manager: los creas tú.

```
firebase apphosting:secrets:set GOOGLE_OAUTH_CLIENT_ID --force
firebase apphosting:secrets:set GOOGLE_OAUTH_CLIENT_SECRET --force
firebase apphosting:secrets:set GOOGLE_OAUTH_REFRESH_TOKEN --force
```

Pega cada valor desde `.env.local` cuando la CLI lo pida y declara cada secreto en `apphosting.yaml` (`secret: NOMBRE@1`).
Más adelante se suman los tokens de Meta, Threads y Bluesky y las claves de IA del mismo modo.

**Rotar un secreto (orden obligatorio).** `apphosting.yaml` fija la versión (`secret: NOMBRE@N`). Cada revisión de Cloud Run queda
atada a las versiones con que se desplegó y las lee en cada arranque en frío.
1. Crear la versión nueva en Secret Manager (no tocar la anterior).
2. Cambiar el `@N` en `apphosting.yaml` y desplegar.
3. Solo cuando el rollout termine bien, deshabilitar las versiones viejas.

Si se deshabilita antes, la revisión en servicio no puede arrancar y el sitio responde 500, y los rollouts siguientes fallan con
"Revision … is not ready" hasta volver a habilitar esas versiones.

## Después del primer deploy

- Agrega la URL `*.hosted.app` a Firebase Auth → Settings → Authorized domains (si no, el login con Google falla).
- Dominio propio: App Hosting → backend → Settings → Domains → Add custom domain; crea en tu DNS los registros que indique la
  consola (cópialos tal cual) y agrega el dominio también a Authorized domains.
- Direcciones de redirección con `localhost` (Meta, Threads, LinkedIn): reemplázalas por la de producción.
- Conectar GitHub con App Hosting para que cada push a `main` despliegue solo (opcional).

## Costos

Con instancias mínimas en 0 no hay costo de cómputo sin tráfico. Configura una alerta de presupuesto en el proyecto
(por ejemplo, 1 USD al mes).
