import { Link } from 'react-router-dom'
import Verified from './Verified.jsx'

export default function UserName({ user, className = '', badge = 14, link = true }) {
  const inner = (
    <span className={`inline-flex items-center gap-1 font-semibold hover:opacity-70 transition ${className}`}>
      {user.username}
      {user.is_verified && <Verified size={badge} />}
    </span>
  )
  return link ? <Link to={`/u/${user.username}`}>{inner}</Link> : inner
}
