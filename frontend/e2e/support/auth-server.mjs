import { existsSync, readFileSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'

const cwd = fileURLToPath(new URL('../../../backend/', import.meta.url))
if (
  existsSync(
    new URL('../../../backend/bootstrap/cache/config.php', import.meta.url),
  )
) {
  throw new Error('Run php artisan config:clear before identity tests.')
}
const envFile = readFileSync(
  new URL('../../../backend/.env.e2e', import.meta.url),
  'utf8',
)
if (
  !/^APP_ENV=e2e\r?$/m.test(envFile) ||
  !/^DB_DATABASE=notewave_e2e\r?$/m.test(envFile)
) {
  throw new Error(
    'Identity tests require backend/.env.e2e and DB_DATABASE=notewave_e2e.',
  )
}
const env = { ...process.env, APP_ENV: 'e2e' }
if (
  !/^MAIL_HOST=127\.0\.0\.1\r?$/m.test(envFile) ||
  !/^MAIL_PORT=1025\r?$/m.test(envFile)
) {
  throw new Error(
    'Identity tests require the local Mailpit inbox at 127.0.0.1:1025.',
  )
}
// Refuse inherited settings that could redirect tests into the development database.
for (const key of Object.keys(env))
  if (
    /^(DB_|MAIL_|SESSION_|APP_KEY|APP_URL|CACHE_STORE|QUEUE_CONNECTION)/.test(
      key,
    )
  )
    delete env[key]
const migration = spawnSync(
  'php',
  ['artisan', 'migrate', '--env=e2e', '--force'],
  { cwd, env, stdio: 'inherit' },
)
if (migration.status !== 0) process.exit(migration.status ?? 1)
const server = spawn(
  'php',
  ['artisan', 'serve', '--env=e2e', '--host=127.0.0.1', '--port=8001'],
  { cwd, env, stdio: 'inherit' },
)
process.on('SIGTERM', () => server.kill())
process.on('SIGINT', () => server.kill())
server.on('exit', (code) => process.exit(code ?? 0))
