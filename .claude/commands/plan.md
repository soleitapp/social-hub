Escribe el plan técnico de una spec aprobada: `specs/NNN-nombre/plan.md`.

Spec (carpeta o número): $ARGUMENTS

## Pasos

1. Abre `specs/NNN-nombre/spec.md`. Si su estado no es `aprobada`, **detente** y dilo.
2. Lee el código que se va a tocar y lo que se puede reutilizar. Si algo se copia de otro repo, lee el archivo origen completo
   (no lo reconstruyas de memoria).
3. Copia `specs/_template/plan.md` y complétalo: enfoque (con alternativas descartadas), tabla de archivos, reutilización,
   datos y efectos, riesgos, verificación de cada criterio.
4. Marca en «Datos y efectos» cualquier escritura fuera del repo (Firestore, Drive, `.env.local`): requiere confirmación explícita.

## Reglas

- No implementes. No cambies la spec; si el plan revela un problema en ella, dilo y propón el cambio.
- Cada criterio de aceptación debe tener una forma concreta de verificarse.
- Resume el plan en pocas líneas y pide el visto bueno para pasar a `/tasks`.
