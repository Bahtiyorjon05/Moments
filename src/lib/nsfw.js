// Client-side nudity/explicit-content detection with nsfwjs (bundled model).
// Lazy-loaded so tfjs/model only download when the user actually uploads.
// Fails OPEN (allows upload) if the model can't load, so uploads never break.

let modelPromise
async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      await import('@tensorflow/tfjs')
      const nsfwjs = await import('nsfwjs')
      return nsfwjs.load('MobileNetV2') // small ~3.5MB model (not the 33MB Inception)
    })()
  }
  return modelPromise
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function videoFrame(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.src = url; v.muted = true
    v.onloadeddata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2) }
    v.onseeked = () => {
      const c = document.createElement('canvas')
      c.width = v.videoWidth; c.height = v.videoHeight
      c.getContext('2d').drawImage(v, 0, 0)
      URL.revokeObjectURL(url)
      loadImage(c.toDataURL('image/jpeg', 0.9)).then(resolve, reject)
    }
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('video decode failed')) }
  })
}

async function fileToImage(file) {
  if (file.type.startsWith('video/')) return videoFrame(file)
  const url = URL.createObjectURL(file)
  try { return await loadImage(url) } finally { setTimeout(() => URL.revokeObjectURL(url), 1000) }
}

// Returns true if the media should be BLOCKED (explicit).
export async function checkNSFW(file) {
  try {
    const [model, img] = await Promise.all([getModel(), fileToImage(file)])
    const preds = await model.classify(img)
    const p = Object.fromEntries(preds.map((x) => [x.className, x.probability]))
    const explicit = (p.Porn || 0) + (p.Hentai || 0)
    const sexy = p.Sexy || 0
    return explicit >= 0.5 || sexy >= 0.85
  } catch (e) {
    console.warn('NSFW check skipped:', e?.message)
    return false // fail open — never block uploads on model errors
  }
}
