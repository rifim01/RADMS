// Web Audio API sound notifications — no external file needed
let _ctx = null

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // Resume if suspended (browser autoplay policy)
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function beep(freq, duration, gain = 0.25) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g)
    g.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    g.gain.setValueAtTime(gain, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch { /* AudioContext not supported */ }
}

function playSequence(notes) {
  try {
    const ctx = getCtx()
    let time = ctx.currentTime
    notes.forEach(({ freq, dur, gain = 0.25 }) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.connect(g)
      g.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      g.gain.setValueAtTime(gain, time)
      g.gain.exponentialRampToValueAtTime(0.001, time + dur)
      osc.start(time)
      osc.stop(time + dur)
      time += dur + 0.05
    })
  } catch { /* ignore */ }
}

// Driver dipanggil — dua nada naik, mencolok
export function playCalled() {
  playSequence([
    { freq: 660, dur: 0.15, gain: 0.35 },
    { freq: 880, dur: 0.15, gain: 0.35 },
    { freq: 1100, dur: 0.3, gain: 0.4 },
  ])
}

// Notifikasi biasa — satu nada lembut
export function playNotification() {
  beep(660, 0.25, 0.2)
}

// Panic / darurat — alarm cepat berulang
export function playPanic() {
  playSequence([
    { freq: 1200, dur: 0.1, gain: 0.5 },
    { freq: 800,  dur: 0.1, gain: 0.5 },
    { freq: 1200, dur: 0.1, gain: 0.5 },
    { freq: 800,  dur: 0.1, gain: 0.5 },
    { freq: 1200, dur: 0.2, gain: 0.5 },
  ])
}

// Masuk antrian / sukses
export function playSuccess() {
  playSequence([
    { freq: 523, dur: 0.1, gain: 0.2 },
    { freq: 659, dur: 0.1, gain: 0.2 },
    { freq: 784, dur: 0.2, gain: 0.25 },
  ])
}

// Unlock AudioContext on first user interaction (required by browsers)
export function unlockAudio() {
  try { getCtx() } catch { /* ignore */ }
}
