import * as vscode from "vscode";

export class McpSecurityCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source !== "MCP Guardian") continue;

      if (
        diagnostic.message.includes("hardcoded") ||
        diagnostic.message.includes("secret") ||
        diagnostic.message.includes("API Key")
      ) {
        const fix = new vscode.CodeAction(
          "Replace with environment variable reference",
          vscode.CodeActionKind.QuickFix
        );
        fix.edit = new vscode.WorkspaceEdit();
        const envMatch = diagnostic.message.match(/env var "([^"]+)"/);
        const envName = envMatch ? envMatch[1] : "SECRET_VALUE";
        fix.edit.replace(document.uri, diagnostic.range, `"\${env:${envName}}"`);
        fix.isPreferred = true;
        fix.diagnostics = [diagnostic];
        actions.push(fix);
      }

      if (diagnostic.message.includes("dangerous command")) {
        const fix = new vscode.CodeAction(
          'Replace command with "node"',
          vscode.CodeActionKind.QuickFix
        );
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.replace(document.uri, diagnostic.range, '"node"');
        fix.diagnostics = [diagnostic];
        actions.push(fix);
      }

      if (diagnostic.message.includes("without pinned version")) {
        const fix = new vscode.CodeAction(
          "Add @latest version pin",
          vscode.CodeActionKind.QuickFix
        );
        fix.edit = new vscode.WorkspaceEdit();
        const text = document.getText(diagnostic.range).replace(/^["']|["']$/g, "");
        fix.edit.replace(document.uri, diagnostic.range, `"${text}@latest"`);
        fix.diagnostics = [diagnostic];
        actions.push(fix);
      }
    }

    return actions;
  }
}
