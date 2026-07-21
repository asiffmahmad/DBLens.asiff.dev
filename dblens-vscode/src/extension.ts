import * as vscode from 'vscode';

let terminal: vscode.Terminal | null = null;

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('dblens.startLocal', async () => {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("DBLens requires an open workspace folder.");
        return;
      }

      const rootPath = workspaceFolders[0].uri.fsPath;

      if (!terminal || terminal.exitStatus !== undefined) {
        terminal = vscode.window.createTerminal({
          name: "DBLens Server",
          cwd: rootPath
        });
        
        terminal.show();
        terminal.sendText('npm run dev');
      } else {
        terminal.show();
      }

      const action = await vscode.window.showInformationMessage(
        'DBLens local server is starting on port 3000.',
        'Open Dashboard'
      );

      if (action === 'Open Dashboard') {
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000/dashboard'));
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to start DBLens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  context.subscriptions.push(disposable);
  
  // Clean up terminal on deactivate
  context.subscriptions.push({
    dispose: () => {
      if (terminal) {
        terminal.dispose();
      }
    }
  });
}

export function deactivate() {
  if (terminal) {
    terminal.dispose();
  }
}
