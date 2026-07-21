import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let terminal: vscode.Terminal | null = null;

  let disposable = vscode.commands.registerCommand('dblens.startLocal', async () => {
    // Check if terminal already exists
    if (!terminal || terminal.exitStatus !== undefined) {
      // Find the root workspace folder (assuming DBLens is in the first workspace folder)
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("DBLens requires an open workspace.");
        return;
      }

      terminal = vscode.window.createTerminal({
        name: "DBLens Server",
        cwd: workspaceFolders[0].uri.fsPath
      });
      
      terminal.show();
      // Start the Next.js dev server
      terminal.sendText('npm run dev');
    } else {
      terminal.show();
    }

    // Notify user and give them a button to open it
    const action = await vscode.window.showInformationMessage(
      'DBLens local server is starting on port 3000.',
      'Open Dashboard'
    );

    if (action === 'Open Dashboard') {
      vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000/dashboard'));
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
