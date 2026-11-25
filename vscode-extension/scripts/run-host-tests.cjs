const { runTests } = require('@vscode/test-electron');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

async function main() {
  console.log('Preparing isolated VS Code extension host...');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-lab-host-'));
  const root = path.resolve(__dirname, '..');
  process.env.SVG_LAB_TEST_WORKSPACE = path.join(scratch, 'examples');
  fs.mkdirSync(path.join(process.env.SVG_LAB_TEST_WORKSPACE, 'folder.svg'), { recursive: true });
  for (const file of ['nested.svg', 'notes.txt', 'folder.svg/README.txt']) {
    fs.copyFileSync(path.join(root, 'examples', file), path.join(process.env.SVG_LAB_TEST_WORKSPACE, file));
  }
  const settingsDirectory = path.join(scratch, 'profile', 'User');
  fs.mkdirSync(settingsDirectory, { recursive: true });
  fs.writeFileSync(path.join(settingsDirectory, 'settings.json'), JSON.stringify({
    'chat.disableAIFeatures': true,
    'workbench.startupEditor': 'none',
    'workbench.secondarySideBar.defaultVisibility': 'hidden',
    'workbench.colorTheme': 'Default Light Modern',
    'files.autoSave': 'off',
    'workbench.editorAssociations': { '*.svg': 'default' },
    'window.zoomLevel': -1,
    'telemetry.telemetryLevel': 'off',
  }));
  const options = {
    extensionDevelopmentPath: root,
    extensionTestsPath: path.join(root, 'test', 'host', 'index.cjs'),
    launchArgs: [process.env.SVG_LAB_TEST_WORKSPACE, '--disable-extensions', '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust', '--remote-debugging-port=9337', '--user-data-dir', path.join(scratch, 'profile')],
    extensionTestsEnv: {
      SVG_LAB_TEST_WORKSPACE: process.env.SVG_LAB_TEST_WORKSPACE,
      SVG_LAB_EVIDENCE: path.join(root, '..', 'doc', 'lab2'),
    },
  };
  if (process.env.VSCODE_EXECUTABLE_PATH) options.vscodeExecutablePath = process.env.VSCODE_EXECUTABLE_PATH;
  console.log('Starting host:', options.vscodeExecutablePath || 'download stable');
  await runTests(options);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
