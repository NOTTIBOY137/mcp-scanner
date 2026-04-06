# @mcp-scanner/github-app

A GitHub App built with [Probot](https://probot.github.io/) that automatically scans pull requests for insecure MCP (Model Context Protocol) configuration files.

## What it does

When a PR is opened or updated, this app:

1. Detects MCP config files in the changeset (`.vscode/mcp.json`, `.cursor/mcp.json`, `claude_desktop_config.json`, `.mcp.json`)
2. Parses each config and runs security analysis against inline detection rules
3. Posts an inline PR review with findings, referencing OWASP MCP Top 10
4. Optionally creates an auto-fix PR that replaces hardcoded secrets with `${env:VAR_NAME}` references

### Security checks

- Dangerous commands (`sh`, `bash`, `sudo`, `curl | sh`, etc.)
- Shell metacharacters and injection patterns in arguments
- Hardcoded secrets (API keys matching `sk-`, `ghp_`, `AKIA`, etc.)
- Non-HTTPS URLs
- Unpinned `npx` packages
- Excessive environment variable exposure

## Setup

### Prerequisites

- Node.js >= 18
- A GitHub App (create one at https://github.com/settings/apps/new or use the manifest in `app.yml`)

### 1. Register the GitHub App

Create a GitHub App with the permissions listed in `app.yml`:

| Permission     | Access |
|----------------|--------|
| Pull requests  | Write  |
| Contents       | Write  |
| Checks         | Write  |
| Metadata       | Read   |

Subscribe to the **Pull request** event.

### 2. Configure environment

Create a `.env` file in the project root:

```env
APP_ID=<your-app-id>
PRIVATE_KEY_PATH=<path-to-your-private-key.pem>
WEBHOOK_SECRET=<your-webhook-secret>
# Optional: WEBHOOK_PROXY_URL=https://smee.io/your-channel
```

### 3. Install dependencies and build

```bash
npm install
npm run build
```

### 4. Run locally

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### 5. Deploy to Vercel

The `src/vercel.ts` file provides a serverless entry point. Deploy with:

```bash
vercel deploy
```

Set the environment variables (`APP_ID`, `PRIVATE_KEY`, `WEBHOOK_SECRET`) in your Vercel project settings.

## Architecture

```
src/
  index.ts      - Main Probot application (event handlers, analysis, review posting)
  vercel.ts     - Vercel serverless adapter
```

## License

ISC
