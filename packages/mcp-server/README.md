# @mcp-scanner/security-checker

An MCP (Model Context Protocol) server that gives AI assistants the ability to audit MCP configurations for security vulnerabilities. It exposes five tools that check for hardcoded secrets, dangerous commands, typosquatting, prompt injection, and more.

## What it does

When connected to an AI assistant (Claude, Cursor, VS Code Copilot, etc.), this server provides tools that can:

- **Scan MCP config files** for hardcoded API keys, dangerous commands, insecure URLs, shell injection vectors, privilege escalation, and tunneling services
- **Discover all MCP config files** on the local machine across Claude Desktop, Claude Code, Cursor, Windsurf, and VS Code
- **Vet npm packages** used as MCP servers by checking age, maintainers, download counts, install scripts, and more
- **Detect typosquatting** by comparing package names against known legitimate MCP packages using Levenshtein distance and scope confusion checks
- **Analyze tool definitions** for prompt injection patterns, dangerous parameter names, unrestricted file paths, and SSRF-enabling URL parameters

## Installation

Run directly with npx (no install needed):

```bash
npx @mcp-scanner/security-checker
```

Or install globally:

```bash
npm install -g @mcp-scanner/security-checker
```

## Configuration

### Claude Desktop

Add to your Claude Desktop config file:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "security-checker": {
      "command": "npx",
      "args": ["-y", "@mcp-scanner/security-checker"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "security-checker": {
      "command": "npx",
      "args": ["-y", "@mcp-scanner/security-checker"]
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "security-checker": {
      "command": "npx",
      "args": ["-y", "@mcp-scanner/security-checker"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "security-checker": {
      "command": "npx",
      "args": ["-y", "@mcp-scanner/security-checker"]
    }
  }
}
```

## Tools

### check_mcp_security

Reads an MCP configuration file and analyzes it for security issues.

**Input:**
- `filePath` (string) -- absolute path to the MCP config JSON file

**Checks performed:**
- Hardcoded secrets (OpenAI, GitHub, AWS, Anthropic, Slack, Stripe, Google, and more)
- Dangerous commands (rm -rf, wget, curl, eval, etc.)
- Sudo / privilege escalation
- Tunneling services (ngrok, localtunnel, cloudflared, etc.)
- Non-HTTPS URLs (excluding localhost)
- Shell injection via arguments
- Excessive environment variables

### discover_mcp_configs

Searches known locations for MCP configuration files across all supported applications.

**Input:** None

**Returns:** List of config file locations, whether they exist, and what servers each contains.

### check_npm_package_trust

Evaluates the trustworthiness of an npm package that is used (or being considered) as an MCP server.

**Input:**
- `packageName` (string) -- npm package name

**Checks performed:**
- Package age (< 30 days = high risk)
- Number of maintainers
- Number of published versions
- Presence of install lifecycle scripts (preinstall/postinstall)
- Repository link in metadata
- Weekly download count
- Deprecation status

### check_typosquatting

Detects whether a package name might be a typosquatting attempt targeting a known MCP package.

**Input:**
- `packageName` (string) -- npm package name to check

**Checks performed:**
- Levenshtein distance against known MCP packages (threshold: 2)
- Scope confusion (same unscoped name under different scope)
- Unscoped variants of scoped packages

### analyze_tool_descriptions

Analyzes MCP tool definitions for security red flags.

**Input:**
- `tools` (array) -- array of objects with `name`, `description`, and optional `inputSchema`

**Checks performed:**
- Prompt injection patterns in descriptions
- Unusually long descriptions (potential hidden instructions)
- Dangerous parameter names suggesting code execution
- Unrestricted file path parameters
- SSRF-enabling URL parameters

## License

MIT
