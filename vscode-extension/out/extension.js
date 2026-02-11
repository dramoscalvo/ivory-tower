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
exports.IvoryTowerEditorProvider = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function getNonce() {
    return crypto.randomBytes(16).toString('hex');
}
/**
 * Ivory Tower custom editor provider
 * Opens architecture.json files in a visual editor webview
 */
class IvoryTowerEditorProvider {
    static register(context) {
        const provider = new IvoryTowerEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(IvoryTowerEditorProvider.viewType, provider, {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
            supportsMultipleEditorsPerDocument: false,
        });
        return providerRegistration;
    }
    constructor(context) {
        this.context = context;
    }
    /**
     * Called when a custom editor is opened
     */
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        // Set up webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
        };
        // Set the HTML content
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        // Set up message handling
        this.setupMessageHandling(document, webviewPanel);
        // Send initial content
        this.sendContentToWebview(document, webviewPanel);
    }
    /**
     * Set up bidirectional message handling between webview and extension
     */
    setupMessageHandling(document, webviewPanel) {
        const disposables = [];
        // Handle messages from webview
        webviewPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'ready':
                    // Webview is ready, send current content
                    this.sendContentToWebview(document, webviewPanel);
                    break;
                case 'contentChanged':
                    // Content changed in webview, update document
                    if (message.content) {
                        await this.updateDocument(document, message.content);
                    }
                    break;
                case 'requestSave':
                    // Webview requested a save
                    await document.save();
                    break;
            }
        }, undefined, disposables);
        // Listen for document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() === document.uri.toString()) {
                this.sendContentToWebview(document, webviewPanel);
            }
        });
        disposables.push(changeDocumentSubscription);
        // Clean up when panel is disposed
        webviewPanel.onDidDispose(() => {
            disposables.forEach(d => d.dispose());
        });
    }
    /**
     * Send current document content to the webview
     */
    sendContentToWebview(document, webviewPanel) {
        const content = document.getText();
        // Try to parse as Ivory Tower format
        let architecture = content;
        let useCases = '[]';
        try {
            const parsed = JSON.parse(content);
            if (parsed.useCases) {
                useCases = JSON.stringify(parsed.useCases, null, 2);
                // Remove useCases from architecture for separate handling
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { useCases: _unused, ...archWithoutUC } = parsed;
                architecture = JSON.stringify(archWithoutUC, null, 2);
            }
        }
        catch {
            // Invalid JSON, send as-is
        }
        webviewPanel.webview.postMessage({
            type: 'fileContent',
            content: {
                architecture,
                useCases,
            },
        });
    }
    /**
     * Update the document with new content from webview
     */
    async updateDocument(document, content) {
        try {
            // Merge architecture and use cases
            const arch = JSON.parse(content.architecture);
            const uc = JSON.parse(content.useCases);
            const merged = { ...arch, useCases: uc };
            const mergedText = JSON.stringify(merged, null, 2);
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
            edit.replace(document.uri, fullRange, mergedText);
            await vscode.workspace.applyEdit(edit);
        }
        catch (e) {
            console.error('Failed to update document:', e);
            vscode.window.showErrorMessage('Failed to update document: Invalid JSON format');
        }
    }
    /**
     * Generate HTML for the webview
     */
    getHtmlForWebview(webview) {
        // Get paths to built web app
        const distPath = vscode.Uri.joinPath(this.context.extensionUri, 'dist');
        // Read the built index.html
        const indexPath = path.join(this.context.extensionPath, 'dist', 'index.html');
        let html;
        try {
            html = fs.readFileSync(indexPath, 'utf8');
        }
        catch {
            // Fallback if dist folder doesn't exist
            return this.getFallbackHtml();
        }
        const nonce = getNonce();
        // Add CSP meta tag
        const csp = [
            `default-src 'none'`,
            `img-src ${webview.cspSource} data:`,
            `style-src ${webview.cspSource} 'unsafe-inline'`,
            `script-src 'nonce-${nonce}'`,
            `font-src ${webview.cspSource}`,
        ].join('; ');
        html = html.replace('</head>', `<meta http-equiv="Content-Security-Policy" content="${csp}"></head>`);
        // Replace script src paths with webview URIs and add nonce
        html = html.replace(/<script\b([^>]*)src="\.\/([^"]+)"([^>]*)>/g, (_match, before, filePath, after) => {
            const uri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, filePath));
            return `<script${before}src="${uri}"${after} nonce="${nonce}">`;
        });
        // Replace CSS/link href paths with webview URIs
        html = html.replace(/href="\.\/([^"]+)"/g, (_match, filePath) => {
            const uri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, filePath));
            return `href="${uri}"`;
        });
        return html;
    }
    /**
     * Fallback HTML when dist folder is not found
     */
    getFallbackHtml() {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 20px;
      color: var(--vscode-foreground);
    }
    .error {
      color: var(--vscode-errorForeground);
    }
  </style>
</head>
<body>
  <h1>Ivory Tower Editor</h1>
  <p class="error">Error: Could not load the editor. Please ensure the extension is properly built.</p>
  <p>Run <code>pnpm build</code> in the extension directory to build the web app.</p>
</body>
</html>`;
    }
}
exports.IvoryTowerEditorProvider = IvoryTowerEditorProvider;
IvoryTowerEditorProvider.viewType = 'ivory-tower.editor';
/**
 * Extension activation
 */
function activate(context) {
    console.log('Ivory Tower extension is now active');
    // Register the custom editor provider
    context.subscriptions.push(IvoryTowerEditorProvider.register(context));
    // Register command to open files in Ivory Tower
    context.subscriptions.push(vscode.commands.registerCommand('ivory-tower.openEditor', () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            vscode.commands.executeCommand('vscode.openWith', activeEditor.document.uri, IvoryTowerEditorProvider.viewType);
        }
    }));
}
/**
 * Extension deactivation
 */
function deactivate() {
    console.log('Ivory Tower extension is now deactivated');
}
//# sourceMappingURL=extension.js.map