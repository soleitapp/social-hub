Implementa las tareas de una spec: ejecuta `specs/NNN-nombre/tasks.md` en orden.

Spec (carpeta o número): $ARGUMENTS

## Pasos

1. Lee `spec.md`, `plan.md` y `tasks.md`, además de `CLAUDE.md`. Pasa el estado de la spec a `en curso`.
2. Por cada tarea pendiente, en orden:
   - Haz **solo** lo que dice la tarea. Si algo adyacente parece mal, no lo toques: anótalo en «Ideas / pendientes» de la spec.
   - Verifica: compila los archivos tocados (`npx esbuild <archivo> --loader:.jsx=jsx --outfile=/dev/null`) y, si hay servidor
     en marcha, que las rutas afectadas respondan 200.
   - Marca la tarea `[x]` y anota en el «Registro» cualquier desvío del plan.
3. Si el plan resulta equivocado o aparece una duda de producto, **detente y pregunta**; no improvises.
4. Al terminar: revisa uno por uno los criterios de aceptación de `spec.md` y repórtalos (cumple / no cumple / no pude ver en
   pantalla). Pasa la spec a `hecha` con la fecha.
5. Commits: uno por feature, solo con los archivos de la tarea (nunca `data/`, `public/covers/` ni archivos ajenos). Push y deploy
   solo si el usuario lo pide.

## Reglas

- Cero cambios fuera del alcance de la spec.
- Credenciales y `.env.local`: no se copian ni se editan sin permiso explícito.
- Lo aprendido que sirva a futuros cambios sube a `CLAUDE.md` o `docs/design-system.md`.
