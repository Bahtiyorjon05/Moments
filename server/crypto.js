import crypto from 'node:crypto'

// AES-256-GCM reversible encryption for passwords (per project requirement:
// passwords are recoverable for the admin dashboard rather than one-way hashed).
// ⚠️ Reversible password storage is intentionally used here for an admin view.
// Do NOT reuse real/shared credentials on this app.
//
// Key is derived lazily so it picks up ENCRYPTION_KEY even when dotenv loads the
// env AFTER this module is first imported (ESM import hoisting).
let _key
function KEY() {
  if (!_key) {
    _key = crypto
      .createHash('sha256')
      .update(process.env.ENCRYPTION_KEY || 'moments_dev_encryption_key_change_me')
      .digest() // 32-byte key
  }
  return _key
}

export function encrypt(plaintext) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY(), iv)
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // store as iv:tag:ciphertext (base64)
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decrypt(payload) {
  try {
    const buf = Buffer.from(payload, 'base64')
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const enc = buf.subarray(28)
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

// Constant-time compare of a candidate password against the stored ciphertext.
export function verify(candidate, stored) {
  const plain = decrypt(stored)
  if (plain === null) return false
  const a = Buffer.from(String(candidate))
  const b = Buffer.from(plain)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
