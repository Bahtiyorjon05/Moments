// Seeds the moments DB with rich demo data.
// Usage: npm run db:seed   (run `npm run db:setup` first)
import bcrypt from 'bcryptjs'
import { pool, tx } from './db.js'

const img = (seed, w = 900, h = 1100) => `https://picsum.photos/seed/${seed}/${w}/${h}`
const avatar = (n) => `https://i.pravatar.cc/300?img=${n}`
const VID = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample'

const PASSWORD = 'moments123'

// ── Users ──────────────────────────────────────────────
const users = [
  { username: 'alex.rivera',   name: 'Alex Rivera',    avatar: avatar(12), verified: true,  bio: '📸 Visual storyteller · chasing golden hours\n🌍 Currently: Lisbon' },
  { username: 'maya.chen',     name: 'Maya Chen',      avatar: avatar(5),  verified: true,  bio: 'Designer & coffee optimist ☕\nBuilding beautiful things' },
  { username: 'leoblanc',      name: 'Leo Blanc',      avatar: avatar(13), verified: false, bio: 'Mountains > everything ⛰️\nTrail runner, film photographer' },
  { username: 'sofia.k',       name: 'Sofia Katsaros', avatar: avatar(9),  verified: true,  bio: 'Food is love 🍜\nRecipes & restaurant finds' },
  { username: 'devon.james',   name: 'Devon James',    avatar: avatar(15), verified: false, bio: 'Street style · sneakers · city nights 🌃' },
  { username: 'nadia.w',       name: 'Nadia Williams',  avatar: avatar(20), verified: true,  bio: 'Architect ✏️ · lover of light and concrete' },
  { username: 'kai.ocean',     name: 'Kai Nakamura',   avatar: avatar(33), verified: false, bio: '🏄 Surf · dive · repeat\nOcean conservation advocate' },
  { username: 'ella.sun',      name: 'Ella Sun',       avatar: avatar(24), verified: false, bio: 'Yoga teacher 🧘‍♀️ · plant mom 🌿\nGood vibes only' },
  { username: 'marco.p',       name: 'Marco Ponti',    avatar: avatar(51), verified: false, bio: 'Vintage cars & espresso 🏎️☕' },
  { username: 'you',           name: 'You',            avatar: avatar(68), verified: false, bio: 'This is your Moments account ✨\nEdit me from your profile!' },
]

// captions pool per post
const posts = [
  { u: 'alex.rivera', loc: 'Sintra, Portugal',      cap: 'Palácio da Pena never gets old 🏰 The fog rolled in right as the sun hit the towers.', media: [['sintra1'], ['sintra2'], ['sintra3']] },
  { u: 'maya.chen',   loc: 'Studio',                 cap: 'New brand system dropping soon. Grids, gradients, and a whole lot of coffee ☕✨', media: [['design1']] },
  { u: 'leoblanc',    loc: 'Dolomites, Italy',       cap: 'Woke at 4am for this. Worth every shivering minute. ⛰️🌄', media: [['dolo1'], ['dolo2']] },
  { u: 'sofia.k',     loc: 'Little Tokyo',            cap: 'Tonkotsu done right — 18 hour broth, handmade noodles. 🍜', media: [['ramen1']] },
  { u: 'devon.james', loc: 'Shibuya',                 cap: 'Neon dreams and rainy streets. Tokyo hits different at night 🌃', media: [['tokyo1'], ['tokyo2']] },
  { u: 'nadia.w',     loc: 'Barcelona',               cap: 'Gaudí understood light before any of us. Casa Batlló details 🐉', media: [['arch1']] },
  { u: 'kai.ocean',   loc: 'Uluwatu, Bali',           cap: 'Dawn patrol. Glass and empty. The ocean gives back what you put in 🌊🏄', media: [['surf1'], ['surf2']] },
  { u: 'ella.sun',    loc: 'Home studio',             cap: 'Sunrise flow to start the week grounded 🧘‍♀️🌿 Save this for your morning routine.', media: [['yoga1']] },
  { u: 'marco.p',     loc: 'Modena',                  cap: '1967. Still the most beautiful lines ever drawn 🏎️❤️', media: [['car1']] },
  { u: 'alex.rivera', loc: 'Lisbon',                  cap: 'Trams, tiles, and that impossible afternoon glow. 🚋', media: [['lisbon1'], ['lisbon2'], ['lisbon3'], ['lisbon4']] },
  { u: 'maya.chen',   loc: '',                        cap: 'Desk reset ✨ productivity is 90% vibes tbh', media: [['desk1']] },
  { u: 'sofia.k',     loc: 'Rome',                    cap: 'Cacio e pepe in the city that invented it. Simplicity is the ultimate flex 🍝', media: [['pasta1']] },
  { u: 'leoblanc',    loc: 'Chamonix',                cap: 'Above the clouds. My favorite kind of quiet. ❄️', media: [['snow1'], ['snow2']] },
  { u: 'kai.ocean',   loc: 'Great Barrier Reef',      cap: 'Spent the day cataloguing coral health. We protect what we love 🐠💙', media: [['reef1']] },
  { u: 'devon.james', loc: 'Brooklyn',                cap: 'Fit check before the rooftop session 🔥', media: [['street1']] },
  { u: 'nadia.w',     loc: 'Copenhagen',              cap: 'Nordic minimalism. Every line has a reason. 🤍', media: [['arch2'], ['arch3']] },
  { u: 'ella.sun',    loc: '',                        cap: 'New plant baby joined the family 🌱 name suggestions?', media: [['plant1']] },
  { u: 'alex.rivera', loc: 'Faroe Islands',           cap: 'The edge of the world feels like this. 🌫️', media: [['faroe1'], ['faroe2']] },
]

// reels: [user, caption, videoFile, posterSeed, audio]
const reels = [
  ['kai.ocean',   'Dawn patrol edit 🌊 sound on for the wipeout at 0:12',   'ForBiggerFun.mp4',       'reelsurf',  'Original audio · kai.ocean'],
  ['devon.james', 'POV: the city never sleeps and neither do we 🌃',        'ForBiggerJoyrides.mp4',  'reelcity',  'midnight — synthwave'],
  ['sofia.k',     '18-hour ramen in 15 seconds 🍜 patience = flavor',        'ForBiggerBlazes.mp4',    'reelfood',  'kitchen sounds'],
  ['leoblanc',    'Trail running the ridgeline at sunrise ⛰️🏃',             'ForBiggerEscapes.mp4',   'reeltrail', 'Original audio · leoblanc'],
  ['maya.chen',   'How I design a logo — start to finish ✏️',               'ForBiggerMeltdowns.mp4', 'reeldesign','lo-fi beats to design to'],
  ['ella.sun',    '60-second morning stretch — save this 🧘‍♀️',             'Sintel.mp4',             'reelyoga',  'calm — ambient'],
  ['marco.p',     'Cold start. Turn your sound ALL the way up 🏎️🔊',         'SubaruOutbackOnStreetAndDirt.mp4', 'reelcar', 'Original audio · marco.p'],
  ['alex.rivera', 'A minute in Lisbon 🚋 golden hour on repeat',            'TearsOfSteel.mp4',       'reellisbon','saudade — instrumental'],
]

const comments = [
  'This is unreal 😍', 'Okay this is my new wallpaper', 'The colors!! 🔥', 'Adding this to my bucket list',
  'How do you even find these spots', 'Saved instantly 💾', 'Perfection', 'Teach me your ways 🙏',
  'Iconic', 'The vibe is immaculate ✨', 'Stop it this is too good', 'Framed and on my wall',
  'need to go here ASAP', 'you have the best eye', 'literal art', 'obsessed 😭',
]

async function main() {
  console.log('Seeding…')
  const hash = await bcrypt.hash(PASSWORD, 10)

  await tx(async (c) => {
    await c.query(`TRUNCATE users, follows, posts, post_media, likes, comments, comment_likes,
      saves, stories, story_views, conversations, conversation_members, messages, notifications RESTART IDENTITY CASCADE`)

    // Users
    const uid = {}
    for (const u of users) {
      const { rows } = await c.query(
        `INSERT INTO users (username, name, email, password_hash, avatar_url, bio, is_verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [u.username, u.name, `${u.username}@moments.app`, hash, u.avatar, u.bio, u.verified]
      )
      uid[u.username] = rows[0].id
    }
    const ids = Object.values(uid)
    const names = Object.keys(uid)

    // Follows: everyone follows a random-ish subset; "you" follows most
    for (const a of names) {
      for (const b of names) {
        if (a === b) continue
        const follow = a === 'you' ? b !== 'marco.p' : Math.random() < 0.55
        if (follow) {
          await c.query(`INSERT INTO follows (follower_id, following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [uid[a], uid[b]])
        }
      }
    }

    // Posts + media, spread over the last ~20 days
    const postIds = []
    let t = 0
    for (const p of posts) {
      const ago = `${(t += 1 + Math.random() * 1.5).toFixed(2)} days`
      const { rows } = await c.query(
        `INSERT INTO posts (user_id, kind, caption, location, created_at)
         VALUES ($1,'post',$2,$3, now() - $4::interval) RETURNING id`,
        [uid[p.u], p.cap, p.loc, ago]
      )
      const pid = rows[0].id
      postIds.push(pid)
      let pos = 0
      for (const [seed] of p.media) {
        await c.query(
          `INSERT INTO post_media (post_id, url, type, position) VALUES ($1,$2,'image',$3)`,
          [pid, img(seed), pos++]
        )
      }
    }

    // Reels
    const reelIds = []
    for (const [u, cap, file, poster, audio] of reels) {
      const ago = `${(t += 0.6 + Math.random()).toFixed(2)} days`
      const { rows } = await c.query(
        `INSERT INTO posts (user_id, kind, caption, audio, created_at)
         VALUES ($1,'reel',$2,$3, now() - $4::interval) RETURNING id`,
        [uid[u], cap, audio, ago]
      )
      const pid = rows[0].id
      reelIds.push(pid)
      await c.query(
        `INSERT INTO post_media (post_id, url, poster, type, position) VALUES ($1,$2,$3,'video',0)`,
        [pid, `${VID}/${file}`, img(poster, 720, 1280)]
      )
    }

    const allContent = [...postIds, ...reelIds]

    // Likes — each post liked by a random subset
    for (const pid of allContent) {
      for (const id of ids) {
        if (Math.random() < 0.5) {
          await c.query(`INSERT INTO likes (user_id, post_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [id, pid])
        }
      }
    }

    // Comments
    for (const pid of allContent) {
      const n = Math.floor(Math.random() * 4)
      for (let i = 0; i < n; i++) {
        const author = ids[Math.floor(Math.random() * ids.length)]
        const body = comments[Math.floor(Math.random() * comments.length)]
        await c.query(`INSERT INTO comments (post_id, user_id, body) VALUES ($1,$2,$3)`, [pid, author, body])
      }
    }

    // Saves for "you"
    for (const pid of allContent) {
      if (Math.random() < 0.3) {
        await c.query(`INSERT INTO saves (user_id, post_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [uid['you'], pid])
      }
    }

    // Stories — several users, some with a couple frames
    const storySeeds = {
      'alex.rivera': ['story-alex1', 'story-alex2'],
      'maya.chen':   ['story-maya1'],
      'leoblanc':    ['story-leo1', 'story-leo2'],
      'sofia.k':     ['story-sofia1'],
      'kai.ocean':   ['story-kai1', 'story-kai2'],
      'ella.sun':    ['story-ella1'],
      'devon.james': ['story-devon1'],
    }
    for (const [u, frames] of Object.entries(storySeeds)) {
      for (const s of frames) {
        await c.query(
          `INSERT INTO stories (user_id, media_url, type, created_at)
           VALUES ($1,$2,'image', now() - ($3 || ' hours')::interval)`,
          [uid[u], img(s, 720, 1280), Math.floor(Math.random() * 20)]
        )
      }
    }

    // Conversations for "you"
    const chatWith = [
      ['maya.chen', [
        ['maya.chen', 'heyy did you see the new brand deck?? 👀'],
        ['you', 'just opened it — the gradient system is 🔥'],
        ['maya.chen', 'right?! took me forever to get the color ramp right'],
        ['you', 'worth it. shipping it today?'],
        ['maya.chen', 'tonight hopefully 🤞 wish me luck'],
      ]],
      ['leoblanc', [
        ['leoblanc', 'trail run this weekend? weather looks perfect ⛰️'],
        ['you', "i'm in. early start?"],
        ['leoblanc', '5am at the trailhead 😅'],
        ['you', 'brutal but yes. bringing the camera'],
      ]],
      ['kai.ocean', [
        ['kai.ocean', 'swell coming in friday 🌊 you surfing?'],
        ['you', 'trying to! still recovering from last time lol'],
        ['kai.ocean', "haha you'll be fine, dawn patrol?"],
      ]],
    ]
    for (const [other, msgs] of chatWith) {
      const { rows } = await c.query(`INSERT INTO conversations DEFAULT VALUES RETURNING id`)
      const cid = rows[0].id
      await c.query(`INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1,$2),($1,$3)`, [cid, uid['you'], uid[other]])
      let mago = msgs.length + 2
      for (const [sender, body] of msgs) {
        await c.query(
          `INSERT INTO messages (conversation_id, sender_id, body, created_at)
           VALUES ($1,$2,$3, now() - ($4 || ' minutes')::interval)`,
          [cid, uid[sender], body, (mago -= 1 + Math.floor(Math.random() * 60)) < 0 ? 0 : mago]
        )
      }
    }

    // Notifications for "you"
    const others = names.filter((n) => n !== 'you')
    for (let i = 0; i < 12; i++) {
      const actor = others[Math.floor(Math.random() * others.length)]
      const type = ['like', 'comment', 'follow'][Math.floor(Math.random() * 3)]
      const pid = type === 'follow' ? null : postIds[Math.floor(Math.random() * postIds.length)]
      await c.query(
        `INSERT INTO notifications (user_id, actor_id, type, post_id, is_read, created_at)
         VALUES ($1,$2,$3,$4,$5, now() - ($6 || ' hours')::interval)`,
        [uid['you'], uid[actor], type, pid, i > 4, i * 3]
      )
    }
  })

  const counts = await pool.query(`SELECT
    (SELECT count(*) FROM users) users,
    (SELECT count(*) FROM posts WHERE kind='post') posts,
    (SELECT count(*) FROM posts WHERE kind='reel') reels,
    (SELECT count(*) FROM stories) stories,
    (SELECT count(*) FROM messages) messages`)
  console.log('✅ Seed complete:', counts.rows[0])
  console.log(`\n🔑 Log in with any username + password "${PASSWORD}"  (e.g. you / ${PASSWORD})`)
  await pool.end()
}

main().catch((e) => {
  console.error('✗ Seed failed:', e)
  process.exit(1)
})
