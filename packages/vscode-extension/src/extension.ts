import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import { scanMcpDocument } from './scanner';
import { McpSecurityCodeActionProvider } from './code-actions';

/** Glob patterns that match known MCP config file locations */
const MCP_CONFIG_GLOBS = [
  '**/.vscode/mcp.json',
  '**/.cursor/mcp.json',
  '**/.mcp.json',
  '**/claude_desktop_config.json',
];

/** Checks if a document is a recognised MCP configuration file */
function isMcpConfigFile(document: vscode.TextDocument): boolean {
  const filePath = document.uri.fsPath;
  const fileName = path.basename(filePath);
  const parentDir = path.basename(path.dirname(filePath));

  if (fileName === 'claude_desktop_config.json') {
    return true;
  }
  if (fileName === 'mcp.json' && (parentDir === '.vscode' || parentDir === '.cursor')) {
    return true;
  }
  if (fileName === '.mcp.json') {
    return true;
  }
  return false;
}

export function activate(context: vscode.ExtensionContext): void {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('mcpGuardian');
  context.subscriptions.push(diagnosticCollection);

  // ---- Scan open document helper ----
  function scanDocument(document: vscode.TextDocument): void {
    const config = vscode.workspace.getConfiguration('mcpGuardian');
    if (!config.get<boolean>('enableRealTimeScanning', true)) {
      return;
    }

    if (!isMcpConfigFile(document)) {
      diagnosticCollection.delete(document.uri);
      return;
    }

    try {
      const diagnostics = scanMcpDocument(document);
      diagnosticCollection.set(document.uri, diagnostics);
    } catch (err) {
      console.error('[MCP Guardian] Error scanning document:', err);
    }
  }

  // ---- Scan already-open editors ----
  for (const editor of vscode.window.visibleTextEditors) {
    scanDocument(editor.document);
  }

  // ---- Real-time: listen for open / change / close ----
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      scanDocument(document);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      scanDocument(event.document);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      diagnosticCollection.delete(document.uri);
    })
  );

  // ---- FileSystemWatcher for workspace MCP config files ----
  for (const glob of MCP_CONFIG_GLOBS) {
    const watcher = vscode.workspace.createFileSystemWatcher(glob);

    const onFileEvent = async (uri: vscode.Uri) => {
      try {
        const document = await vscode.workspace.openTextDocument(uri);
        scanDocument(document);
      } catch {
        // File may have been deleted or be inaccessible
      }
    };

    watcher.onDidCreate(onFileEvent);
    watcher.onDidChange(onFileEvent);
    watcher.onDidDelete((uri) => {
      diagnosticCollection.delete(uri);
    });

    context.subscriptions.push(watcher);
  }

  // ---- Watch well-known home-directory config files ----
  const homeDir = os.homedir();
  const homeConfigPaths = [
    path.join(homeDir, '.config', 'claude', 'claude_desktop_config.json'),
    path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
    path.join(homeDir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'),
  ];

  for (const configPath of homeConfigPaths) {
    try {
      const uri = vscode.Uri.file(configPath);
      const parentPattern = new vscode.RelativePattern(
        vscode.Uri.file(path.dirname(configPath)),
        path.basename(configPath)
      );
      const watcher = vscode.workspace.createFileSystemWatcher(parentPattern);

      const onHomeFileEvent = async () => {
        try {
          const document = await vscode.workspace.openTextDocument(uri);
          const diagnostics = scanMcpDocument(document);
          diagnosticCollection.set(uri, diagnostics);
        } catch {
          // File may not exist on this platform
        }
      };

      watcher.onDidCreate(onHomeFileEvent);
      watcher.onDidChange(onHomeFileEvent);
      watcher.onDidDelete(() => {
        diagnosticCollection.delete(uri);
      });

      context.subscriptions.push(watcher);
    } catch {
      // Ignore errors setting up watchers for paths that don't apply to this OS
    }
  }

  // ---- Code Action Provider (quick fixes) ----
  const codeActionProvider = new McpSecurityCodeActionProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [{ language: 'json' }, { language: 'jsonc' }],
      codeActionProvider,
      {
        providedCodeActionKinds: McpSecurityCodeActionProvider.providedCodeActionKinds,
      }
    )
  );

  // ---- Manual scan command ----
  const scanWorkspaceCommand = vscode.commands.registerCommand(
    'mcpGuardian.scanWorkspace',
    async () => {
      let totalFindings = 0;
      let filesScanned = 0;

      for (const glob of MCP_CONFIG_GLOBS) {
        const uris = await vscode.workspace.findFiles(glob, '**/node_modules/**', 50);
        for (const uri of uris) {
          try {
            const document = await vscode.workspace.openTextDocument(uri);
            const diagnostics = scanMcpDocument(document);
            diagnosticCollection.set(uri, diagnostics);
            totalFindings += diagnostics.length;
            filesScanned++;
          } catch (err) {
            console.error(`[MCP Guardian] Failed to scan ${uri.fsPath}:`, err);
          }
        }
      }

      if (filesScanned === 0) {
        vscode.window.showInformationMessage('MCP Guardian: No MCP config files found in the workspace.');
      } else if (totalFindings === 0) {
        vscode.window.showInformationMessage(
          `MCP Guardian: Scanned ${filesScanned} file(s). No security issues found.`
        );
      } else {
        vscode.window.showWarningMessage(
          `MCP Guardian: Found ${totalFindings} issue(s) across ${filesScanned} file(s). Check the Problems panel for details.`
        );
      }
    }
  );

  context.subscriptions.push(scanWorkspaceCommand);
}

export function deactivate(): void {
  // Cleanup is handled automatically through context.subscriptions
}
