# Spec-driven development

Cómo trabajamos: **primero se acuerda qué se construye (spec), luego cómo (plan), luego los pasos (tareas), y
recién ahí se implementa.** El objetivo es que el pedido, los criterios de "listo" y el alcance queden por escrito
antes del código, para no rehacer ni tocar de más.

## Cuándo hace falta spec

| Cambio | ¿Spec? |
|---|---|
| Una línea, un texto, un color, un ajuste de espaciado | No. Se hace y se cuenta qué se tocó. |
| Un componente nuevo o copiado de otro repo | Sí, versión corta (spec + tareas). |
| Cambia el layout, el modelo de datos, la auth, o toca varias páginas | Sí, completa (spec + plan + tareas). |
| Migración de datos o cualquier cosa que escriba en Firestore/Drive | Sí, completa, y se confirma antes de escribir. |

## Estructura

```
specs/
├── README.md              ← este archivo
├── _template/             ← se copia para cada feature
│   ├── spec.md            ← QUÉ y POR QUÉ
│   ├── plan.md            ← CÓMO
│   └── tasks.md           ← PASOS verificables
└── NNN-nombre/            ← una carpeta por feature (001, 002, …)
```

## Flujo (y su comando)

1. **`/spec <pedido>`** — convierte el pedido en `spec.md`: problema, comportamiento esperado, criterios de aceptación
   comprobables, fuera de alcance, preguntas abiertas. **Las preguntas abiertas se resuelven con el usuario antes de seguir.**
2. **`/plan`** — lee la spec y el código real y escribe `plan.md`: archivos a tocar, decisiones, riesgos, qué se reutiliza
   (incluido lo que se copia de otro repo).
3. **`/tasks`** — baja el plan a `tasks.md`: checklist ordenada, cada tarea pequeña y verificable.
4. **`/implement`** — ejecuta las tareas en orden, marca cada una, verifica (compila / rutas / criterios) y al final
   reporta contra los criterios de aceptación: qué se cumple, qué no se pudo ver en pantalla.

El usuario puede cortar en cualquier paso: la spec aprobada es el contrato.

## Reglas de la spec

- **Criterios de aceptación observables**, en una frase cada uno ("el título mide 18px", "con 0 programadas la sección
  dice «No hay nada programado»"). Si no se puede comprobar, no es un criterio.
- **Fuera de alcance explícito.** Todo lo que no está en la spec no se toca; si aparece algo adyacente, va a "Ideas".
- **Una spec = un cambio entregable.** Si crece, se parte en dos.
- **Estado** en el encabezado: `borrador` → `aprobada` → `en curso` → `hecha` (o `descartada`).
- Cuando se copia algo de otro repo, la spec nombra el archivo origen y se anota en `docs/design-system.md`.

## Al terminar

- La spec queda en el repo como historial (no se borra). Se pasa a `hecha` con la fecha y el commit.
- Lo que se aprendió y aplica a futuros cambios sube a `CLAUDE.md` o `docs/design-system.md`.
