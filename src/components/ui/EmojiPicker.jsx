import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const GROUPS = {
  'Smileys': '😀 😃 😄 😁 😆 😅 😂 🤣 🥲 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🫡 🤭 🫢 😴 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕',
  'Gestures': '👍 👎 👊 ✊ 🤛 🤜 👏 🙌 👐 🤝 🙏 ✌️ 🤞 🫰 🤟 🤘 👌 🤌 🤏 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤙 💪 🦾 🫵',
  'Hearts': '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ❤️‍🔥 💯 ✨ ⭐ 🌟 💫 🔥 🎉 🎊',
  'Animals': '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦄 🐝 🦋 🐢 🐙 🦈 🐬 🐳 🦭 🦩',
  'Food': '🍏 🍎 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🥑 🍔 🍟 🍕 🌮 🌯 🍜 🍣 🍩 🍪 🎂 🍰 🧋 ☕ 🍺 🥂',
  'Travel': '⚽ 🏀 🏈 🎾 🏐 🎱 🏓 🏸 🥅 ⛳ 🎯 🎮 🎧 🎸 🚗 ✈️ 🚀 🏝️ 🏔️ 🌋 🗺️ 🧭 🏖️ 🌅 🌈 ☀️ 🌙 ⛅',
}

// Popover emoji picker. Calls onSelect(emoji) on click.
export default function EmojiPicker({ onSelect, onClose, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.() }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`card w-[300px] max-w-[86vw] max-h-72 overflow-y-auto p-3 shadow-[var(--shadow-soft)] ${className}`}
    >
      {Object.entries(GROUPS).map(([name, emojis]) => (
        <div key={name} className="mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-faint)] mb-1 sticky top-0">{name}</p>
          <div className="grid grid-cols-8 gap-0.5">
            {emojis.split(' ').filter(Boolean).map((e, i) => (
              <button key={name + i} type="button" onClick={() => onSelect(e)}
                className="text-xl h-8 w-8 grid place-items-center rounded-lg hover:bg-[var(--surface-strong)] transition">
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  )
}
