# Shorts verticales (Remotion)

Shorts 9:16 (1080×1920) para YouTube Shorts / TikTok / IG Reels. Reusa el ADN de
marca de `TipCover` (paleta teal, motivo radar, headline con palabra-acento,
variantes ink/paper). Video por código → repetible y on-brand.

## Uso

```
cd video
npm install                 # instala Remotion (baja Chromium en el 1er render)
npm run studio              # editor visual en el navegador
node tip-props.mjs 3        # genera props.json desde el tip 3
npm run render              # renderiza out/short.mp4 con props.json
```

## Estado

- [x] Composición base `Short` (mudo/tipográfico): eyebrow, headline animado
      (palabras que entran, acento en teal), beat de texto, wordmark, radar.
- [x] Datos desde `tips.js` (`tip-props.mjs`).
- [ ] **Voz (ElevenLabs)** — pista de narración desde el texto + subtítulos
      quemados sincronizados. Necesita API key + voice_id.
- [ ] **Hosting (Cloudflare R2)** — subir el MP4 a un bucket público para que
      el publicador lo consuma por URL.
- [ ] Enganche con el pipeline de distribución (YT/TikTok/Reels).
