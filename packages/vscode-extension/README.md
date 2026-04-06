# MCP Config Guardian

Real-time security scanner for Model Context Protocol (MCP) configuration files. Detects hardcoded secrets, dangerous commands, and insecure server configurations directly in your editor.

## Features

- **Real-time scanning** -- diagnostics appear as you edit MCP config files
- **Hardcoded secret detection** -- identifies OpenAI, Anthropic, GitHub, AWS, Slack, Google, GitLab, SendGrid, and Square tokens, plus JWTs and private keys
- **Dangerous command warnings** -- flags shells (`bash`, `sh`, `cmd`), privilege escalation (`sudo`), and network tools (`curl`, `wget`, `nc`)
- **Shell injection detection** -- catches metacharacters, pipes, command substitution, and redirections in server arguments
- **Insecure URL detection** -- warns when server URLs use plain HTTP instead of HTTPS
- **Unpinned npx packages** -- flags npx-based servers without version pinning to prevent supply-chain attacks
- **Sensitive path detection** -- alerts when configs reference `.ssh/`, `.aws/`, `/etc/passwd`, and other sensitive locations
- **Quick fixes** -- one-click replacements: swap secrets for `${env:VAR_NAME}` references, upgrade HTTP to HTTPS, pin npx versions, replace dangerous commands

## Supported Config Files

| File | Tool |
|------|------|
| `.vscode/mcp.json` | VS Code |
| `.cursor/mcp.json` | Cursor |
| `.mcp.json` | Generic MCP |
| `claude_desktop_config.json` | Claude Desktop |

Home-directory config files (Claude Desktop on macOS, Windows, and Linux) are also monitored.

## Installation

1. Clone the repository and navigate to the extension directory:

```
cd packages/vscode-extension
npm install
npm run compile
```

2. Press **F5** in VS Code to launch an Extension Development Host, or package with:

```
npx @vscode/vsce package
```

Then install the resulting `.vsix` file via **Extensions > Install from VSIX**.

## Usage

The extension activates automatically when you open a JSON file or when your workspace contains an MCP config file.

- **Automatic scanning**: Issues appear in the Problems panel as you type
- **Manual scan**: Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run **MCP Guardian: Scan Workspace for MCP Config Issues**
- **Quick fixes**: Click the lightbulb icon on any diagnostic, or press `Ctrl+.` / `Cmd+.`

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `mcpGuardian.enableRealTimeScanning` | `true` | Enable or disable real-time scanning of MCP config files |

## License

MIT
