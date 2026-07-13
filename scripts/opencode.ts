import { spawn } from 'node:child_process'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')

const prefix = basename(repoRoot)
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '_')

const aliases: Record<string, string> = {
  DATABASE_URL: `${prefix}_DATABASE_URL`,
}

for (const [source, target] of Object.entries(aliases)) {
  const value = process.env[source]
  if (value !== undefined && process.env[target] === undefined) {
    process.env[target] = value
  }
}

const child = spawn('opencode', process.argv.slice(2), {
  stdio: 'inherit',
  env: process.env,
})

child.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'ENOENT') {
    process.stderr.write('opencode: command not found in PATH\n')
    process.exit(127)
  }
  process.stderr.write(`Failed to spawn opencode: ${err.message}\n`)
  process.exit(1)
})

const forwardSignal = (signal: NodeJS.Signals): void => {
  if (!child.killed) {
    child.kill(signal)
  }
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
  process.on(signal, () => forwardSignal(signal))
}

child.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
  if (signal !== null) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
