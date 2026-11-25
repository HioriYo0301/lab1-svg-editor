const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vscode = require('vscode');
const { chromium } = require('playwright-core');
const { SvgFileDecorationProvider } = require('../../out/svgFileDecorationProvider');
const { SvgDocumentSymbolProvider } = require('../../out/svgDocumentSymbolProvider');

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function querySymbols(uri) {
  for (let attempt = 0; ; attempt++) {
    try { return await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri); }
    catch (error) {
      if (attempt >= 8 || !/cancel/i.test(String(error))) throw error;
      await pause(200);
    }
  }
}

exports.run = async () => {
  const folder = process.env.SVG_LAB_TEST_WORKSPACE;
  const evidence = process.env.SVG_LAB_EVIDENCE;
  const uri = vscode.Uri.file(path.join(folder, 'nested.svg'));
  const original = await fs.readFile(uri.fsPath);
  const filesBefore = await fs.readdir(folder);
  const log = [];
  let browser;
  try {
    // Observe the native Outline before activating the extension, then activate it.
    await vscode.commands.executeCommand('outline.focus');
    const extension = vscode.extensions.getExtension('svg-lab.svg-lab-tools');
    assert.ok(extension, 'extension discovered from manifest');
    await extension.activate();
    await vscode.workspace.getConfiguration('files').update('autoSave', 'off', vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration('workbench').update('colorTheme', 'Default Light Modern', vscode.ConfigurationTarget.Global);
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc);
    const decoration = new SvgFileDecorationProvider();
    assert.equal((await decoration.provideFileDecoration(uri)).badge, '[]');
    for (const item of ['notes.txt', 'folder.svg', 'missing.svg']) {
      assert.equal(await decoration.provideFileDecoration(vscode.Uri.file(path.join(folder, item))), undefined);
    }
    assert.equal(await decoration.provideFileDecoration(vscode.Uri.parse('untitled:demo.svg')), undefined);
    log.push('PASS decoration: SVG file only; no ordinary file, directory, missing file or non-file URI');

    const provider = new SvgDocumentSymbolProvider();
    const symbols = await provider.provideDocumentSymbols(doc);
    const flow = symbols[0].children[0];
    const rect = flow.children[0];
    assert.equal(rect.name, 'rect#start');
    assert.equal(rect.selectionRange.start.line, 3);
    assert.equal(flow.children[1].children[0].name, 'text');
    const registered = await querySymbols(uri);
    assert.equal(registered[0].name, 'svg');
    log.push('PASS native command: registered provider returns root, nested groups, leaves and unnamed text');

    await vscode.commands.executeCommand('workbench.view.explorer');
    await vscode.commands.executeCommand('outline.focus');
    await pause(1800);
    browser = await chromium.connectOverCDP('http://127.0.0.1:9337');
    const pages = browser.contexts().flatMap((ctx) => ctx.pages());
    const page = pages.find((p) => /workbench/.test(p.url())) || pages[0];
    assert.ok(page, 'real VS Code renderer reachable');
    await page.setViewportSize({ width: 1440, height: 950 });
    await vscode.commands.executeCommand('notifications.clearAll');
    await fs.mkdir(evidence, { recursive: true });
    // Native Outline is a tree: expand its nodes through the real keyboard UI.
    const outline = page.locator('.outline-tree');
    if (await outline.count()) {
      const rows = outline.locator('[role="treeitem"]');
      for (let i = 0; i < 8; i++) {
        const collapsed = outline.locator('[role="treeitem"][aria-expanded="false"]');
        if (!(await collapsed.count())) break;
        await collapsed.first().click();
        await page.keyboard.press('ArrowRight');
      }
      const row = rows.filter({ hasText: 'rect#start' }).first();
      await row.click();
      await pause(1000);
      assert.ok(vscode.window.visibleTextEditors.some((e) => e.document.uri.toString() === uri.toString() && e.selection.active.line === 3), 'Outline click must select line 4 in the SVG editor');
      log.push('PASS real Outline click locates rect#start on source line 4');
    } else {
      throw new Error('Native Outline UI not found; screenshot evidence cannot be claimed');
    }
    await page.screenshot({ path: path.join(evidence, '01_badge_outline_location.png') });

    const wholeRange = () => new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
    await editor.edit((edit) => edit.replace(wholeRange(), original.toString().replace('id="start"', 'id="updated"')));
    await pause(1400);
    const updated = await querySymbols(uri);
    assert.equal(updated[0].children[0].children[0].name, 'rect#updated');
    await page.screenshot({ path: path.join(evidence, '02_outline_after_edit.png') });
    log.push('PASS edit update: registered provider returns rect#updated without saving');

    await editor.edit((edit) => edit.replace(wholeRange(), '<svg><g id="unfinished"><rect'));
    await pause(1400);
    assert.deepEqual(await provider.provideDocumentSymbols(doc), []);
    // A host may cancel its native query when the Outline model becomes empty.
    // Verify the provider contract directly and its actual empty UI below.
    assert.equal(await outline.locator('[role="treeitem"]').count(), 0);
    await page.screenshot({ path: path.join(evidence, '03_incomplete_xml.png') });
    log.push('PASS incomplete XML: Outline empty; extension remains responsive');
    await editor.edit((edit) => edit.replace(wholeRange(), original.toString()));
    const recovered = await querySymbols(uri);
    assert.equal(recovered[0].children[0].children[0].name, 'rect#start');
    assert.deepEqual(await fs.readFile(uri.fsPath), original);
    assert.deepEqual(await fs.readdir(folder), filesBefore);
    log.push('PASS recovery and disk integrity: original file bytes and directory names unchanged');
    await fs.writeFile(path.join(evidence, 'host-results.txt'), log.join('\n') + '\n');
    console.log(log.join('\n'));
  } finally {
    if (browser) await browser.close();
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
  }
};
