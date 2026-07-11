import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev_secret'

export function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '30d' })
}

// Hard auth — 401 if no/invalid token.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Soft auth — attaches req.user if a valid token exists, else continues.
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try { req.user = jwt.verify(token, SECRET) } catch { /* ignore */ }
  }
  next()
}
