/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Procedural Web Audio Synthwave Music Engine
 * Zero external audio files, 100% real-time synthesized retro-wave soundtrack.
 */
class SynthwaveMusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private isMuted = false;
  private isBoss = false;
  private masterGain: GainNode | null = null;

  private currentStep = 0;
  private timerId: number | null = null;
  private tempo = 105; // BPM

  // D Minor retro chord progression: Dm -> Bb -> F -> C
  private chords = [
    [146.83, 174.61, 220.0], // D3, F3, A3
    [116.54, 146.83, 174.61], // Bb2, D3, F3
    [130.81, 164.81, 196.0], // C3, E3, G3
    [110.0, 130.81, 164.81], // A2, C3, E3
  ];

  // Bass roots corresponding to chords
  private bassNotes = [
    73.42, // D2
    58.27, // Bb1
    65.41, // C2
    55.0,  // A1
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('void_music_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    }
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.22, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext not supported or restricted
    }
  }

  public start() {
    this.initContext();
    if (!this.ctx || this.isPlaying) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.currentStep = 0;
    this.scheduleNextBeat();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public setBossMode(isBoss: boolean) {
    this.isBoss = isBoss;
    this.tempo = isBoss ? 138 : 105;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('void_music_muted', String(this.isMuted));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.22, this.ctx.currentTime);
    }
    if (!this.isMuted && !this.isPlaying) {
      this.start();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private scheduleNextBeat() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const stepDuration = (60 / this.tempo) / 4; // 16th note in seconds
    const now = this.ctx.currentTime;

    const bar = Math.floor(this.currentStep / 16) % this.chords.length;
    const stepInBar = this.currentStep % 16;

    // 1. Synth Bassline Arpeggio (driving 16th notes)
    if (stepInBar % 2 === 0) {
      const root = this.bassNotes[bar];
      const isOctave = stepInBar === 4 || stepInBar === 12;
      const freq = isOctave ? root * 2 : root;
      this.playSynthBass(now, freq, stepDuration * 1.8);
    }

    // 2. Cosmic Ambient Pad (played on bar start)
    if (stepInBar === 0) {
      const chord = this.chords[bar];
      this.playSynthPad(now, chord, stepDuration * 16);
    }

    // 3. Cyberpunk Kick on 1, 5, 9, 13
    if (stepInBar % 4 === 0) {
      this.playKick(now);
    }

    // 4. Snare on 5 and 13 (2 and 4 in 4/4)
    if (stepInBar === 4 || stepInBar === 12) {
      this.playSnare(now);
    }

    // 5. Hi-Hats on every off-beat
    if (stepInBar % 2 === 1) {
      this.playHiHat(now, stepInBar % 4 === 2);
    }

    // 6. Boss Mode Lead Arpeggiator
    if (this.isBoss && (stepInBar % 2 === 0 || stepInBar % 3 === 0)) {
      const leadNotes = [293.66, 349.23, 440.0, 523.25, 587.33]; // D4, F4, A4, C5, D5
      const note = leadNotes[(this.currentStep + bar) % leadNotes.length];
      this.playLead(now, note, stepDuration * 0.9);
    }

    this.currentStep++;

    const delayMs = stepDuration * 1000;
    this.timerId = window.setTimeout(() => this.scheduleNextBeat(), delayMs);
  }

  private playSynthBass(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.isBoss ? 750 : 450, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + duration);
    filter.Q.setValueAtTime(6, time);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playSynthPad(time: number, chord: number[], duration: number) {
    if (!this.ctx || !this.masterGain) return;

    for (const freq of chord) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.linearRampToValueAtTime(1100, time + duration * 0.5);
      filter.frequency.linearRampToValueAtTime(600, time + duration);

      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.6);
      gain.gain.linearRampToValueAtTime(0.01, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + duration);
    }
  }

  private playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;

    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.12);
  }

  private playHiHat(time: number, accent: boolean) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(accent ? 0.15 : 0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.04);
  }

  private playLead(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, time);
    filter.Q.setValueAtTime(4, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }
}

export const Music = new SynthwaveMusicEngine();
