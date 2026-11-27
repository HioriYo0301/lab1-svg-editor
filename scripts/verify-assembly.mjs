import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureDir = join(root, 'doc', 'transcript');
const tsx = join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const scratch = mkdtempSync(join(tmpdir(), 'svg-assembly-'));
const record = process.argv.includes('--record');
const messages = [];
function run(entry, cwd, input, args = []) {
  const result = spawnSync(process.execPath, [tsx, entry, ...args], { cwd, input, timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, result.stderr?.toString());
  return result.stdout;
}
function snapshot(cwd) {
  return readdirSync(cwd, { withFileTypes: true }).map((entry) => [entry.name, entry.isDirectory() ? 'directory' : readFileSync(join(cwd, entry.name)).toString('base64')]);
}
try {
  for (const session of ['cli-1', 'cli-box', 'cli-commands']) {
    const cwd = join(scratch, session); mkdirSync(cwd);
    mkdirSync(join(cwd, 'docs')); mkdirSync(join(cwd, 'plugins'));
    writeFileSync(join(cwd, '.hidden'), 'hidden fixture\n');
    writeFileSync(join(cwd, 'package.json'), '{"private":true}\n');
    copyFileSync(join(fixtureDir, 'other.svg'), join(cwd, 'other.svg'));
    const input = readFileSync(join(fixtureDir, `${session}.txt`));
    const before = snapshot(cwd);
    const code = run(join(root, 'src', 'main.ts'), cwd, input);
    const config = run(join(root, 'src', 'main.ts'), cwd, input, ['--config', join(root, 'plugins.config.json')]);
    assert.ok(code.equals(config), `${session}: code/config output differs`);
    if (session === 'cli-commands') assert.deepEqual(snapshot(cwd), before, 'dir session must leave cwd unchanged');
    const expectedPath = join(fixtureDir, `${session}.expected.txt`);
    if (record) writeFileSync(expectedPath, code);
    assert.ok(existsSync(expectedPath), `Missing expected output: ${expectedPath}`);
    assert.ok(code.equals(readFileSync(expectedPath)), `${session}: expected output differs (do not auto-update expectations)`);
    messages.push(`PASS ${session}: code/config output byte-identical; expected output matched`);
  }

  // Materialize the immutable Phase 1 tag outside the worktree; never checkout/reset it.
  const baseline = join(scratch, 'baseline'); mkdirSync(baseline);
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', 'final', '--', 'src', 'package.json'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/);
  for (const file of files) {
    const target = join(baseline, file); mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, execFileSync('git', ['show', `final:${file}`], { cwd: root }));
  }
  symlinkSync(join(root, 'node_modules'), join(baseline, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const cwd = join(scratch, 'baseline-cwd'); mkdirSync(cwd);
  copyFileSync(join(fixtureDir, 'other.svg'), join(cwd, 'other.svg'));
  const input = readFileSync(join(fixtureDir, 'cli-1.txt'));
  const legacy = run(join(baseline, 'src', 'main.ts'), cwd, input);
  const current = run(join(root, 'src', 'main.ts'), cwd, input, ['--config', join(root, 'plugins.disabled.config.json')]);
  assert.ok(legacy.equals(current), 'Optional plugins disabled: output differs from final');
  const expectedPath = join(fixtureDir, 'cli-1.final.expected.txt');
  if (record) writeFileSync(expectedPath, legacy);
  assert.ok(legacy.equals(readFileSync(expectedPath)), 'final baseline expected output differs');
  messages.push('PASS final baseline: optional plugins disabled, output byte-identical to final tag');
  console.log(messages.join('\n'));
} finally {
  // Only our exact mkdtemp-owned directory; the junction is removed, never its target.
  rmSync(scratch, { recursive: true, force: true });
}
