import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '..')
const ARCHIVE_SKILL = join(
  REPO_ROOT,
  '.agents',
  'skills',
  'openspec-archive-change',
  'SKILL.md',
)
const OPENSPEC_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'openspec')

const hasOpenspec = existsSync(OPENSPEC_BIN)

async function writeArchiveFixture(
  rootDir: string,
  changeName: string,
): Promise<void> {
  const changeDir = join(rootDir, 'openspec', 'changes', changeName)
  const specDir = join(changeDir, 'specs', 'widgets')

  await mkdir(specDir, { recursive: true })
  await mkdir(join(rootDir, 'openspec', 'specs'), { recursive: true })

  await writeFile(
    join(changeDir, 'proposal.md'),
    `# Proposal: Add Widget Creation

## Why
Operators need a documented widget creation behavior.

## What Changes
- Add a widget creation requirement.

## Non-goals
- No runtime implementation is included in this fixture.
`,
  )

  await writeFile(
    join(changeDir, 'design.md'),
    `# Design

## Approach
Document the widget creation behavior in the canonical specs.
`,
  )

  await writeFile(
    join(changeDir, 'tasks.md'),
    `# Tasks

- [x] 1. Add widget creation requirement
`,
  )

  await writeFile(
    join(specDir, 'spec.md'),
    `# Widgets Delta

## ADDED Requirements

### Requirement: Widget Creation
The system SHALL document widget creation behavior.

#### Scenario: Create widget
- GIVEN an operator has valid widget details
- WHEN the operator creates a widget
- THEN the widget is available
`,
  )
}

function runArchive(
  rootDir: string,
  changeName: string,
  args: string[] = [],
): string {
  const result = spawnSync(
    OPENSPEC_BIN,
    ['archive', changeName, '--yes', ...args],
    {
      cwd: rootDir,
      encoding: 'utf-8',
    },
  )

  const output = `${result.error?.message ?? ''}\n${result.stderr}${result.stdout}`
  expect(result.status, output).toBe(0)

  return result.stderr + result.stdout
}

describe('OpenSpec archive smoke test', () => {
  test('updates canonical specs and moves the change with the official CLI', async () => {
    if (!hasOpenspec) return

    const tmp = await mkdtemp(join(tmpdir(), 'openspec-archive-'))
    const changeName = 'add-widget-creation'

    try {
      await writeArchiveFixture(tmp, changeName)

      const output = runArchive(tmp, changeName)

      const archiveDate = new Date().toISOString().split('T')[0]
      const archiveDir = join(
        tmp,
        'openspec',
        'changes',
        'archive',
        `${archiveDate}-${changeName}`,
      )
      const canonicalSpec = await readFile(
        join(tmp, 'openspec', 'specs', 'widgets', 'spec.md'),
        'utf-8',
      )

      expect(output).toContain('Specs updated successfully')
      expect(canonicalSpec).toContain('### Requirement: Widget Creation')
      expect(existsSync(join(tmp, 'openspec', 'changes', changeName))).toBe(
        false,
      )
      expect(existsSync(archiveDir)).toBe(true)
      expect(existsSync(join(archiveDir, 'proposal.md'))).toBe(true)
      expect(existsSync(join(archiveDir, 'tasks.md'))).toBe(true)
      expect(existsSync(join(archiveDir, 'design.md'))).toBe(true)
      expect(existsSync(join(archiveDir, 'specs', 'widgets', 'spec.md'))).toBe(
        true,
      )
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  })

  test('can archive without updating canonical specs when skip-specs is explicit', async () => {
    if (!hasOpenspec) return

    const tmp = await mkdtemp(join(tmpdir(), 'openspec-archive-skip-'))
    const changeName = 'document-tooling-change'

    try {
      await writeArchiveFixture(tmp, changeName)

      const output = runArchive(tmp, changeName, ['--skip-specs'])

      const archiveDate = new Date().toISOString().split('T')[0]
      const archiveDir = join(
        tmp,
        'openspec',
        'changes',
        'archive',
        `${archiveDate}-${changeName}`,
      )

      expect(output).toContain('Skipping spec updates')
      expect(
        existsSync(join(tmp, 'openspec', 'specs', 'widgets', 'spec.md')),
      ).toBe(false)
      expect(existsSync(join(tmp, 'openspec', 'changes', changeName))).toBe(
        false,
      )
      expect(existsSync(archiveDir)).toBe(true)
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  })

  test('archive skill delegates to the OpenSpec CLI instead of manual moves', async () => {
    const skill = await readFile(ARCHIVE_SKILL, 'utf-8')

    expect(skill).toContain('openspec archive "<name>" --yes')
    expect(skill).toContain('openspec archive "<name>" --skip-specs --yes')
    expect(skill).toContain('TBD - created by archiving change')
    expect(skill).toContain('openspec validate --all')
    expect(skill).not.toContain('mv openspec/changes')
    expect(skill).not.toContain('mkdir -p openspec/changes/archive')
  })
})
