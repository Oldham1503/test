/* timer.js — Reusable countdown / stopwatch */

class Timer {
  constructor({ duration, onTick, onExpire, displayEl } = {}) {
    this.duration  = duration || 0;     // seconds; 0 = stopwatch
    this.onTick    = onTick  || (() => {});
    this.onExpire  = onExpire || (() => {});
    this.displayEl = displayEl || null;

    this._elapsed  = 0;
    this._interval = null;
    this._running  = false;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._interval = setInterval(() => {
      this._elapsed++;
      this._render();
      this.onTick(this._elapsed, this.getRemaining());
      if (this.duration > 0 && this._elapsed >= this.duration) {
        this.pause();
        this.onExpire();
      }
    }, 1000);
    this._render();
  }

  pause() {
    this._running = false;
    clearInterval(this._interval);
    this._interval = null;
  }

  reset() {
    this.pause();
    this._elapsed = 0;
    this._render();
  }

  getElapsed()   { return this._elapsed; }
  getRemaining() { return Math.max(0, this.duration - this._elapsed); }
  isRunning()    { return this._running; }

  _render() {
    if (!this.displayEl) return;
    const secs = this.duration > 0 ? this.getRemaining() : this._elapsed;
    this.displayEl.textContent = Timer.format(secs);

    // Visual urgency when under 10s countdown
    if (this.duration > 0 && this.getRemaining() <= 10) {
      this.displayEl.classList.add('timer-urgent');
    } else {
      this.displayEl.classList.remove('timer-urgent');
    }
  }

  static format(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
}
