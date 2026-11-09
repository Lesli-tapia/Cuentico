import type { SceneEvent } from '@/modules/content/types';
/** One audio source, bounded timers, and user-gesture permission for declarative scene events. */
export class SceneEventPlayer {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private request: AbortController | null = null;
  private allowed = false;
  constructor(private muted = true) {}
  async unlock() {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    try { this.context ??= new AudioContext(); await this.context.resume(); this.allowed = true; } catch { this.allowed = false; }
  }
  setMuted(muted: boolean) { this.muted = muted; if (muted) this.stopAudio(); }
  private stopAudio() { this.request?.abort(); this.request = null; try { this.source?.stop(); } catch {} this.source = null; }
  private async play(event: SceneEvent) {
    if (!event.asset || this.muted || !this.allowed || !this.context) return;
    this.stopAudio(); const request = new AbortController(); this.request = request;
    try {
      const response = await fetch(event.asset, { signal: request.signal }); if (!response.ok) return;
      const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
      if (request.signal.aborted || this.muted) return;
      const source = this.context.createBufferSource(); const gain = this.context.createGain();
      gain.gain.value = 0.16; source.buffer = buffer; source.loop = event.eventType === 'AMBIENT_AUDIO';
      source.connect(gain); gain.connect(this.context.destination); this.source = source; source.start();
      if (event.durationMs > 0) this.timers.push(setTimeout(() => { try { source.stop(); } catch {} }, event.durationMs));
    } catch { /* A missing or unsupported audio asset never interrupts reading. */ }
  }
  trigger(events: SceneEvent[], trigger: SceneEvent['trigger'], reducedMotion: boolean, animate: (event: SceneEvent) => void) {
    for (const event of events.filter(e => e.enabled && (e.trigger === trigger || (trigger === 'ON_SCENE_ENTER' && e.trigger === 'AFTER_DELAY')))) {
      this.timers.push(setTimeout(() => {
        if (event.eventType === 'SOUND_EFFECT' || event.eventType === 'AMBIENT_AUDIO') void this.play(event);
        else if (!reducedMotion) animate(event);
      }, Math.max(0, event.delayMs)));
    }
  }
  clear() { this.timers.forEach(clearTimeout); this.timers = []; this.stopAudio(); }
  dispose() { this.clear(); void this.context?.close(); this.context = null; }
}
