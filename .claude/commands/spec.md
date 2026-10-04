Crea la spec de un cambio: `specs/NNN-nombre/spec.md`.

Pedido del usuario: $ARGUMENTS

## Pasos

1. Lee `specs/README.md` (flujo y reglas), `CLAUDE.md` y `AGENTS.md` (reglas sobre credenciales y servicios externos). Si el cambio toca UI, lee también `docs/design-system.md`.
2. Elige el siguiente número libre en `specs/` (001, 002, …) y un nombre corto en kebab-case.
3. Copia `specs/_template/spec.md` a `specs/NNN-nombre/spec.md` y complétalo **con el código real a la vista** (busca lo que
   ya existe; si se copia de otro repo, abre el archivo origen del otro repo).
4. Escribe criterios de aceptación **observables**, un «Fuera de alcance» explícito y las **Preguntas abiertas**.
5. Estado inicial: `borrador`.

## Reglas

- No escribas código en este paso.
- Si el pedido es ambiguo, las dudas van a «Preguntas abiertas» y se **preguntan al usuario** (opciones concretas) antes de pasar a `/plan`.
- No inventes requisitos que el usuario no pidió: lo adyacente va a «Ideas / pendientes».
- Termina mostrando un resumen de la spec (problema, criterios, fuera de alcance, preguntas) y pide aprobación para pasar a `aprobada`.
