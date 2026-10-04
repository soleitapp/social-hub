import React from 'react';
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { loadFont as loadSans } from '@remotion/google-fonts/OpenSans';
import { VARIANTS, COLORS, BRAND } from './brand';

const mono = loadMono().fontFamily;
const sans = loadSans().fontFamily;
const MX = 96;
const FADE = 8;

// Parte un texto en palabras separando la palabra-acento (teal) — como TipCover.
function splitAccent(str, accent) {
  if (!accent || !str.includes(accent)) return [{ w: str, a: false }];
  const i = str.indexOf(accent);
  return [
    { w: str.slice(0, i), a: false },
    { w: accent, a: true },
    { w: str.slice(i + accent.length), a: false },
  ].filter((s) => s.w !== '');
}
function toWords(str, accent) {
  const out = [];
  for (const seg of splitAccent(str, accent))
    for (const w of seg.w.trim().split(/\s+/)) if (w) out.push({ w, a: seg.a });
  return out;
}

// Radar con barrido rotatorio — continuo dentro de cada beat.
const RadarBg = ({ v }) => {
  const frame = useCurrentFrame();
  const rot = (frame * 1.1) % 360;
  const pulse = interpolate(Math.sin(frame / 24), [-1, 1], [v.radarOp * 0.55, v.radarOp]);
  return (
    <svg viewBox="0 0 240 240" style={{ position: 'absolute', right: -170, bottom: -170, width: 820, height: 820, color: v.radar, opacity: pulse }}>
      {[44, 82, 120, 158].map((r) => (
        <circle key={r} cx="120" cy="120" r={r} fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      ))}
      <line x1="120" y1="120" x2="120" y2="-40" stroke="currentColor" strokeWidth="2.5" opacity="0.55" transform={`rotate(${rot} 120 120)`} />
      <circle cx="120" cy="120" r="7" fill="currentColor" />
    </svg>
  );
};

const Eyebrow = ({ children, v, o }) => (
  <div style={{ fontFamily: mono, fontSize: 30, letterSpacing: 7, color: v.eyebrow, fontWeight: 600, textTransform: 'uppercase', opacity: o, transform: `translateY(${(1 - o) * -16}px)` }}>
    {children}
  </div>
);

// Wordmark de marca reproducido como texto (spec exacta del SVG:
// Open Sans, parte 1 en 600 con acento + parte 2 en 500, misma baseline; textos en brand.js).
const Wordmark = ({ v, size, primary, secondary }) => (
  <div style={{ fontFamily: sans, whiteSpace: 'nowrap', lineHeight: 1, display: 'inline-block' }}>
    <span style={{ fontSize: size, fontWeight: 600, letterSpacing: -0.025 * size, color: primary || v.accent }}>{BRAND.primary}</span>
    <span style={{ fontSize: size * 0.55, fontWeight: 500, letterSpacing: -0.009 * size, color: secondary || v.text, marginLeft: 0.14 * size }}>{BRAND.secondary}</span>
  </div>
);

// --- Contenido por tipo de beat -------------------------------------------

const HookBeat = ({ beat, v, frame, fps, o }) => {
  const words = toWords(beat.headline, beat.accent);
  return (
    <div style={{ padding: `0 ${MX}px`, display: 'flex', flexDirection: 'column', gap: 56 }}>
      <Eyebrow v={v} o={o}>{beat.eyebrow}</Eyebrow>
      <div style={{ fontFamily: sans, fontSize: 108, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - (10 + i * 3), fps, config: { damping: 200 } });
          return (
            <span key={i} style={{ display: 'inline-block', marginRight: 24, opacity: s, transform: `translateY(${(1 - s) * 34}px)`, color: w.a ? v.accent : v.text }}>
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const StatBeat = ({ beat, v, frame, fps, o }) => {
  const rise = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  // Escala el valor según su largo para que no desborde el ancho (ej. "38.000:1").
  const vlen = String(beat.value || '').length;
  const valSize = vlen > 7 ? 158 : vlen > 5 ? 202 : 260;
  return (
    <div style={{ padding: `0 ${MX}px`, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Eyebrow v={v} o={o}>{beat.label}</Eyebrow>
      <div style={{ fontFamily: sans, fontSize: valSize, fontWeight: 800, lineHeight: 1, letterSpacing: -6, color: v.accent, opacity: rise, transform: `translateY(${(1 - rise) * 26}px)`, whiteSpace: 'nowrap' }}>
        {beat.value}
      </div>
      <div style={{ fontFamily: sans, fontSize: 58, fontWeight: 600, lineHeight: 1.34, color: v.text, opacity: o }}>
        {beat.text}
      </div>
      {beat.source && (
        <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: 3, color: v.sub, marginTop: 12, opacity: o }}>
          FUENTE · {beat.source}
        </div>
      )}
    </div>
  );
};

const ReframeBeat = ({ beat, v, frame, fps, o }) => {
  const words = toWords(beat.text, beat.accent);
  return (
    <div style={{ padding: `0 ${MX}px`, display: 'flex', flexDirection: 'column', gap: 44 }}>
      <Eyebrow v={v} o={o}>{beat.label}</Eyebrow>
      <div style={{ height: 5, width: interpolate(spring({ frame, fps, config: { damping: 200 } }), [0, 1], [0, 120]), backgroundColor: v.accent }} />
      <div style={{ fontFamily: sans, fontSize: 78, fontWeight: 700, lineHeight: 1.16, letterSpacing: -1 }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - (10 + i * 2), fps, config: { damping: 200 } });
          return (
            <span key={i} style={{ display: 'inline-block', marginRight: 20, opacity: s, transform: `translateY(${(1 - s) * 26}px)`, color: w.a ? v.accent : v.text, fontStyle: w.a ? 'italic' : 'normal' }}>
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const OutroBeat = ({ beat, v, frame, fps, o }) => {
  const rise = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  return (
    <div style={{ padding: `0 ${MX}px`, display: 'flex', flexDirection: 'column', gap: 64 }}>
      <div style={{ fontFamily: sans, fontSize: 96, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2, color: v.text, opacity: rise, transform: `translateY(${(1 - rise) * 26}px)` }}>
        {beat.punch}
      </div>
      <div style={{ opacity: o, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22 }}>
        <Wordmark v={v} size={116} primary={COLORS.white} secondary={COLORS.ink} />
        <div style={{ fontFamily: mono, fontSize: 38, letterSpacing: 2, fontWeight: 600, color: v.text }}>
          {beat.follow || 'Síguenos'}
        </div>
      </div>
    </div>
  );
};

const CONTENT = { hook: HookBeat, stat: StatBeat, reframe: ReframeBeat, outro: OutroBeat };

const Beat = ({ beat }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = VARIANTS[beat.variant] || VARIANTS.ink;
  const layerO = interpolate(frame, [0, FADE], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const contentO = interpolate(frame, [FADE, FADE + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const Body = CONTENT[beat.type] || HookBeat;
  return (
    <AbsoluteFill style={{ backgroundColor: v.bg, opacity: layerO, justifyContent: 'center' }}>
      {beat.audio && <Audio src={staticFile(beat.audio)} />}
      <RadarBg v={v} />
      <Body beat={beat} v={v} frame={frame} fps={fps} o={contentO} />
      {beat.type !== 'outro' && (
        <div style={{ position: 'absolute', left: MX, bottom: 92, opacity: contentO }}>
          <Wordmark v={v} size={54} />
        </div>
      )}
    </AbsoluteFill>
  );
};

export const Short = ({ beats }) => {
  const { durationInFrames } = useVideoConfig();
  const list = beats && beats.length ? beats : [];
  // Arranque de cada escena: acumulado de su `dur` (largo real de la voz);
  // sin timings, reparto uniforme.
  const hasDur = list.length > 0 && list.every((b) => b.dur);
  let acc = 0;
  const starts = list.map((b, i) => {
    if (hasDur) { const s = acc; acc += b.dur; return s; }
    return Math.floor((durationInFrames / list.length) * i);
  });
  return (
    <AbsoluteFill style={{ backgroundColor: VARIANTS.ink.bg, fontFamily: sans }}>
      {list.map((beat, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={durationInFrames - starts[i]}>
          <Beat beat={beat} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
