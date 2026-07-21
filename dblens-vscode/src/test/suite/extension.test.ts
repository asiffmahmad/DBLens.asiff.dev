import * as assert from 'assert';
import * as vscode from 'vscode';

suite('DBLens Extension Test Suite', () => {
  suiteSetup(async () => {
    // Ensure extension is activated before testing
    await vscode.extensions.getExtension('asiff.dblens-vscode')?.activate();
  });

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('asiff.dblens-vscode'));
  });

  test('dblens.startLocal command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('dblens.startLocal'), 'Command dblens.startLocal is not registered');
  });
});
