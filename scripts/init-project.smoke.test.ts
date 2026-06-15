import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

type Components = 'webapp' | 'mobile' | 'webapp,mobile' | 'none'

const REPO_ROOT = join(import.meta.dir, '..')
const INIT_SCRIPT = join(REPO_ROOT, 'scripts', 'init-project.ts')

const IGNORED_ENTRIES = new Set(['node_modules', '.git', 'dist', 'build', '.turbo', '.next'])

async function copyTemplate(dest: string): Promise<void> {
  await cp(REPO_ROOT, dest, {
    recursive: true,
    filter: (src) => !IGNORED_ENTRIES.has(src.split('/').pop() ?? '')
  })
}

function runInit(cwd: string, components: Components): { status: number; stderr: string } {
  const args = [
    'run',
    INIT_SCRIPT,
    '-n',
    'smoke-test',
    '-i',
    '@smoke',
    '--components',
    components,
    '--skip-git-check',
    '--no-backup'
  ]
  const result = spawnSync('bun', args, { cwd, encoding: 'utf-8' })
  return { status: result.status ?? -1, stderr: result.stderr + result.stdout }
}

interface PackageJson {
  scripts?: Record<string, string>
  workspaces?: { packages?: string[] } | string[]
}

async function readPkg(dir: string): Promise<PackageJson> {
  return JSON.parse(await readFile(join(dir, 'package.json'), 'utf-8')) as PackageJson
}

function workspacePackages(pkg: PackageJson): string[] {
  if (!pkg.workspaces) return []
  if (Array.isArray(pkg.workspaces)) return pkg.workspaces
  return pkg.workspaces.packages ?? []
}

async function workspaceNames(rootDir: string, pkg: PackageJson): Promise<Set<string>> {
  const names = new Set<string>()
  for (const pattern of workspacePackages(pkg)) {
    const candidates: string[] = []
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2)
      const baseDir = join(rootDir, base)
      if (existsSync(baseDir)) {
        const { readdir } = await import('node:fs/promises')
        const entries = await readdir(baseDir, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isDirectory()) candidates.push(join(base, entry.name))
        }
      }
    } else {
      candidates.push(pattern)
    }
    for (const rel of candidates) {
      const pkgPath = join(rootDir, rel, 'package.json')
      if (existsSync(pkgPath)) {
        const subPkg = JSON.parse(await readFile(pkgPath, 'utf-8')) as { name?: string }
        if (subPkg.name) names.add(subPkg.name)
      }
    }
  }
  return names
}

function extractWorkspaceTarget(script: string): string | null {
  const match = script.match(/bun run(?:\s+--[\w:=-]+)*\s+-F\s+(\S+)/)
  return match ? match[1] : null
}

function extractConcurrentlyScripts(script: string): string[] {
  return [...script.matchAll(/"bun run ([\w:-]+)"/g)].map((m) => m[1])
}

async function validateGeneratedProject(
  rootDir: string,
  expectedApps: Set<'api' | 'webapp' | 'mobile'>
): Promise<void> {
  const pkg = await readPkg(rootDir)
  const scripts = pkg.scripts ?? {}
  const names = await workspaceNames(rootDir, pkg)

  for (const [name, command] of Object.entries(scripts)) {
    const target = extractWorkspaceTarget(command)
    if (target) {
      expect(
        names.has(target),
        `Script "${name}" targets missing workspace "${target}". Command: ${command}`
      ).toBe(true)
    }
    for (const ref of extractConcurrentlyScripts(command)) {
      expect(
        scripts[ref] !== undefined,
        `Script "${name}" runs "bun run ${ref}" but "${ref}" is not defined`
      ).toBe(true)
    }
  }

  for (const app of ['api', 'webapp', 'mobile'] as const) {
    const appDir = join(rootDir, 'apps', app)
    const shouldExist = expectedApps.has(app)
    expect(existsSync(appDir), `apps/${app} presence (expected ${shouldExist})`).toBe(shouldExist)
  }
}

describe('init-project smoke test', () => {
  const components: Array<{ label: Components; apps: Set<'api' | 'webapp' | 'mobile'> }> = [
    { label: 'webapp,mobile', apps: new Set(['api', 'webapp', 'mobile']) },
    { label: 'webapp', apps: new Set(['api', 'webapp']) },
    { label: 'mobile', apps: new Set(['api', 'mobile']) },
    { label: 'none', apps: new Set() }
  ]

  for (const { label, apps } of components) {
    test(`--components ${label} produces a consistent project`, async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'init-smoke-'))
      try {
        const workDir = join(tmp, 'project')
        await copyTemplate(workDir)

        const { status, stderr } = runInit(workDir, label)
        expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

        await validateGeneratedProject(workDir, apps)
      } finally {
        await rm(tmp, { recursive: true, force: true })
      }
    }, 120_000)
  }

  test('detects no template residue after initialization', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-postflight-clean-'))
    try {
      await copyTemplate(tmp)

      const { status, stderr } = runInit(tmp, 'webapp')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      expect(stderr).not.toContain('Template residue detected')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)
})

describe('init with --target-dir', () => {
  const FIXTURE_DIR = join(REPO_ROOT, 'scripts', 'fixtures', 'template-minimal')

  function runInitWithTargetDir(args: string[]): {
    status: number
    stdout: string
    stderr: string
  } {
    const baseArgs = ['run', INIT_SCRIPT, ...args]
    const result = spawnSync('bun', baseArgs, { encoding: 'utf-8' })
    return {
      status: result.status ?? -1,
      stdout: result.stdout,
      stderr: result.stderr
    }
  }

  test('creates and clones into non-existent directory', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-target-'))
    const targetDir = join(tmp, 'new-project')

    try {
      // Mock git clone by copying fixture
      const result = runInitWithTargetDir([
        '-n',
        'test-project',
        '-i',
        '@test',
        '--target-dir',
        targetDir,
        '--template-url',
        FIXTURE_DIR,
        '--components',
        'none',
        '--skip-git-check'
      ])

      expect(result.status, `init failed:\n${result.stderr}`).toBe(0)
      expect(existsSync(targetDir), 'target directory should exist').toBe(true)
      expect(existsSync(join(targetDir, 'package.json')), 'package.json should exist').toBe(true)
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('clones into empty directory', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-target-'))
    const targetDir = join(tmp, 'empty-project')

    try {
      // Create empty directory
      await import('node:fs/promises').then((fs) => fs.mkdir(targetDir))

      const result = runInitWithTargetDir([
        '-n',
        'test-project',
        '-i',
        '@test',
        '--target-dir',
        targetDir,
        '--template-url',
        FIXTURE_DIR,
        '--components',
        'none',
        '--skip-git-check'
      ])

      expect(result.status, `init failed:\n${result.stderr}`).toBe(0)
      expect(existsSync(join(targetDir, 'package.json')), 'package.json should exist').toBe(true)
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('fails on non-empty directory without --force', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-target-'))
    const targetDir = join(tmp, 'non-empty')

    try {
      // Create directory with a file
      await import('node:fs/promises').then(async (fs) => {
        await fs.mkdir(targetDir)
        await fs.writeFile(join(targetDir, 'existing.txt'), 'content')
      })

      const result = runInitWithTargetDir([
        '-n',
        'test-project',
        '-i',
        '@test',
        '--target-dir',
        targetDir,
        '--template-url',
        FIXTURE_DIR,
        '--components',
        'none',
        '--skip-git-check'
      ])

      expect(result.status, 'should exit with error code').toBe(1)
      expect(result.stderr, 'should mention not empty').toContain('not empty')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('proceeds on non-empty directory with --force', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-target-'))
    const targetDir = join(tmp, 'non-empty-force')

    try {
      // Create directory with a file
      await import('node:fs/promises').then(async (fs) => {
        await fs.mkdir(targetDir)
        await fs.writeFile(join(targetDir, 'existing.txt'), 'content')
      })

      const result = runInitWithTargetDir([
        '-n',
        'test-project',
        '-i',
        '@test',
        '--target-dir',
        targetDir,
        '--template-url',
        FIXTURE_DIR,
        '--components',
        'none',
        '--skip-git-check',
        '--force'
      ])

      expect(result.status, `init should succeed with --force:\n${result.stderr}`).toBe(0)
      expect(result.stderr, 'should emit warning').toContain('not empty')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('provides machine-readable output when quiet mode succeeds', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-target-'))
    const targetDir = join(tmp, 'quiet-success')

    try {
      const result = runInitWithTargetDir([
        '-n',
        'test-project',
        '-i',
        '@test',
        '--target-dir',
        targetDir,
        '--template-url',
        FIXTURE_DIR,
        '--components',
        'none',
        '--skip-git-check',
        '--quiet'
      ])

      expect(result.status, `init failed:\n${result.stderr}`).toBe(0)

      // Parse JSON output
      const json = JSON.parse(result.stdout)
      expect(json.status).toBe('ok')
      expect(json.projectName).toBe('test-project')
      expect(json.projectIdentifier).toBe('@test')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('provides machine-readable error when quiet mode fails', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-target-'))
    const targetDir = join(tmp, 'quiet-error')

    try {
      // Create non-empty directory
      await import('node:fs/promises').then(async (fs) => {
        await fs.mkdir(targetDir)
        await fs.writeFile(join(targetDir, 'existing.txt'), 'content')
      })

      const result = runInitWithTargetDir([
        '-n',
        'test-project',
        '-i',
        '@test',
        '--target-dir',
        targetDir,
        '--template-url',
        FIXTURE_DIR,
        '--components',
        'none',
        '--skip-git-check',
        '--quiet'
      ])

      expect(result.status, 'should exit with error code').toBe(1)

      // Parse JSON output
      const json = JSON.parse(result.stdout)
      expect(json.status).toBe('error')
      expect(json.error).toBeDefined()
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('starts with fresh git history containing only initialization commit', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-target-'))
    const targetDir = join(tmp, 'git-reset')

    try {
      const result = runInitWithTargetDir([
        '-n',
        'test-project',
        '-i',
        '@test',
        '--target-dir',
        targetDir,
        '--template-url',
        FIXTURE_DIR,
        '--components',
        'none',
        '--skip-git-check'
      ])

      expect(result.status, `init failed:\n${result.stderr}`).toBe(0)

      // Check git history
      const gitLog = spawnSync('git', ['log', '--oneline'], {
        cwd: targetDir,
        encoding: 'utf-8'
      })

      const commits = gitLog.stdout.trim().split('\n')
      expect(commits.length).toBe(1)
      expect(commits[0]).toContain('initialize from ddd-fullstack-starter')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('initializes in current directory when no target directory specified', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-compat-'))
    try {
      const workDir = join(tmp, 'project')
      await copyTemplate(workDir)

      const { status, stderr } = runInit(workDir, 'none')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      await validateGeneratedProject(workDir, new Set())
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)
})

describe('Template residue fixes', () => {
  test('replaces template identifiers in GitHub workflow files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-github-'))
    try {
      await copyTemplate(tmp)

      const { status, stderr } = runInit(tmp, 'webapp')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      const workflowPath = join(tmp, '.github/workflows/typecheck.yml')
      const content = await readFile(workflowPath, 'utf-8')
      expect(content).toContain('@smoke/database')
      expect(content).not.toContain('@dfs/database')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('replaces template identifiers in Cursor configuration', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-cursor-'))
    try {
      await copyTemplate(tmp)

      const { status, stderr } = runInit(tmp, 'webapp')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      const rulesPath = join(tmp, '.cursor/.rules/project-info.mdc')
      const content = await readFile(rulesPath, 'utf-8')
      expect(content).toContain('@smoke')
      expect(content).not.toContain('@dfs')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('replaces template identifiers in agent skill files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-agents-'))
    try {
      await copyTemplate(tmp)

      const { status, stderr } = runInit(tmp, 'webapp')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      const skillPath = join(tmp, '.agents/skills/guidelines/frontend-patterns/SKILL.md')
      const content = await readFile(skillPath, 'utf-8')
      expect(content).toContain('@smoke')
      expect(content).not.toContain('@dfs')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('replaces Title Case template name', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-titlecase-'))
    try {
      await copyTemplate(tmp)

      const { status, stderr } = runInit(tmp, 'webapp')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      const agentsPath = join(tmp, 'AGENTS.md')
      const content = await readFile(agentsPath, 'utf-8')
      expect(content).toContain('# Smoke Test')
      expect(content).not.toContain('DDD Fullstack Starter')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('replaces fullstack-starter slug', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-slug-'))
    try {
      await copyTemplate(tmp)

      const { status, stderr } = runInit(tmp, 'webapp')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      const docsPath = join(tmp, 'docs/conventions/readme.md')
      const content = await readFile(docsPath, 'utf-8')
      expect(content).toContain('smoke-test')
      expect(content).not.toContain('fullstack-starter')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('replaces bare identifier with hyphen', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-bare-hyphen-'))
    try {
      await copyTemplate(tmp)

      const { status, stderr } = runInit(tmp, 'webapp')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      const renderPath = join(tmp, 'render.yaml')
      const content = await readFile(renderPath, 'utf-8')
      expect(content).toContain('smoke-test-webapp')
      expect(content).toContain('smoke-test-db')
      expect(content).not.toContain('dfs-webapp')
      expect(content).not.toContain('dfs-db')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('replaces bare identifier with underscore', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-bare-underscore-'))
    try {
      await copyTemplate(tmp)

      const { status, stderr } = runInit(tmp, 'webapp')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      const renderPath = join(tmp, 'render.yaml')
      const content = await readFile(renderPath, 'utf-8')
      expect(content).toContain('smoke-test_user')
      expect(content).toContain('smoke_test')
      expect(content).not.toContain('dfs_user')
      expect(content).not.toContain('ddd_fullstack_starter')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('replaces template README with skeleton', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-readme-'))
    try {
      await copyTemplate(tmp)

      const { status, stderr } = runInit(tmp, 'webapp')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      const readmePath = join(tmp, 'README.md')
      const content = await readFile(readmePath, 'utf-8')
      expect(content).toContain('# smoke-test')
      expect(content).toContain('bun install')
      expect(content).toContain('bun run webapp')
      expect(content).not.toContain('What the Init Script Does')
      expect(content).not.toContain('use this template')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('preserves custom README', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-custom-readme-'))
    try {
      await copyTemplate(tmp)

      // Replace README with custom content
      const customContent = '# My Custom Project\n\nThis is my project.'
      const readmePath = join(tmp, 'README.md')
      await writeFile(readmePath, customContent, 'utf-8')

      const { status, stderr } = runInit(tmp, 'webapp')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      const content = await readFile(readmePath, 'utf-8')
      expect(content).toBe(customContent)
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('removes wizard files after init', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'init-wizard-'))
    try {
      await copyTemplate(tmp)

      const { status, stderr } = runInit(tmp, 'webapp')
      expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

      // Verify wizard files are removed
      expect(existsSync(join(tmp, '.agents/skills/init'))).toBe(false)
      expect(existsSync(join(tmp, 'scripts/init-project.ts'))).toBe(false)
      expect(existsSync(join(tmp, 'scripts/init-project.smoke.test.ts'))).toBe(false)

      // Verify init script removed from package.json
      const pkg = JSON.parse(await readFile(join(tmp, 'package.json'), 'utf-8'))
      expect(pkg.scripts.init).toBeUndefined()
      expect(pkg.scripts.dev).toBeDefined() // Other scripts preserved
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)
})
