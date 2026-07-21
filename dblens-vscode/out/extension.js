"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    let terminal = null;
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
        }
        else {
            terminal.show();
        }
        // Notify user and give them a button to open it
        const action = await vscode.window.showInformationMessage('DBLens local server is starting on port 3000.', 'Open Dashboard');
        if (action === 'Open Dashboard') {
            vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000/dashboard'));
        }
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map