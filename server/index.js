import dotenv from 'dotenv'
import { createApp } from './app.js'

dotenv.config()

const app = createApp()
const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`\n🚀 Moments API running at http://localhost:${PORT}/api`)
  console.log(`   Health: http://localhost:${PORT}/api/health\n`)
})
