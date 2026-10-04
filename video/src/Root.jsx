import React from 'react';
import { Composition } from 'remotion';
import { Short } from './Short';
import vo from './vo-01.json';
import { BRAND } from './brand';

// Beats de c01 (default de la composición). Los demás dispatches se rendean
// pasando --props con sus beats (cada uno con `dur` y `audio`); la duración
// se calcula en calculateMetadata desde la suma de `dur`.
const BEATS_01 = [
  { type: 'hook', variant: 'ink', eyebrow: 'Ejemplo', headline: 'Un titular que detiene el scroll.', accent: 'scroll' },
  { type: 'stat', variant: 'mint', label: 'El dato', value: '60%', text: 'Texto que explica la cifra en una línea.', source: 'Fuente 2025' },
  { type: 'stat', variant: 'ink', label: 'El contraste', value: '3x', text: 'Otra cifra que sostiene el argumento.', source: 'Fuente 2025' },
  { type: 'reframe', variant: 'paper', label: 'El giro', text: 'Una frase que reencuadra el problema.', accent: 'reencuadra' },
  { type: 'outro', variant: 'teal', punch: 'Cierre con una frase corta.', url: BRAND.url },
];
const BEATS = BEATS_01.map((b, i) => ({ ...b, dur: vo.beats[i]?.dur, audio: vo.beats[i]?.audio }));

const FPS = 30;
const totalFrames = (beats) => beats.reduce((s, b) => s + (b.dur || 0), 0);

export const RemotionRoot = () => (
  <Composition
    id="Short"
    component={Short}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={vo.total}
    defaultProps={{ beats: BEATS }}
    calculateMetadata={({ props }) => {
      const beats = props?.beats?.length ? props.beats : BEATS;
      return { durationInFrames: totalFrames(beats) || vo.total, fps: FPS, width: 1080, height: 1920 };
    }}
  />
);
