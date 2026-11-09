/** Accumulates visible, recent interaction time using a monotonic clock. */
export class ActiveClock {
  private totalMs: number;
  private previous: number;
  private lastActivity: number;
  private visible = true;
  private paused = false;
  constructor(initialSeconds = 0, private now: () => number = () => performance.now(), private idleMs = 60_000, private maxGapMs = 15_000) {
    this.totalMs = Math.max(0, initialSeconds) * 1000;
    this.previous = this.lastActivity = this.now();
  }
  private collect() {
    const current = this.now();
    const delta = current - this.previous;
    if (this.visible && !this.paused && delta >= 0 && delta <= this.maxGapMs) {
      this.totalMs += Math.max(0, Math.min(delta, this.lastActivity + this.idleMs - this.previous));
    }
    this.previous = current;
  }
  activity() { this.collect(); this.lastActivity = this.now(); }
  setVisible(value: boolean) { this.collect(); this.visible = value; if (value) this.lastActivity = this.now(); }
  setPaused(value: boolean) { this.collect(); this.paused = value; if (!value) this.lastActivity = this.now(); }
  seconds() { this.collect(); return Math.floor(this.totalMs / 1000); }
}
