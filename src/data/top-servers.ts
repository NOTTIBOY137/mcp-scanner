export interface SeedServer {
  repoUrl: string;
  priority: 1 | 2 | 3;
  category: string;
}

export const TOP_SERVERS: SeedServer[] = [
  // ---------------------------------------------------------------------------
  // Priority 1: Official + Most Popular MCP Servers (verified)
  // ---------------------------------------------------------------------------
  { repoUrl: "https://github.com/modelcontextprotocol/servers", priority: 1, category: "official" },
  { repoUrl: "https://github.com/upstash/context7", priority: 1, category: "popular" },
  { repoUrl: "https://github.com/executeautomation/mcp-playwright", priority: 1, category: "popular" },
  { repoUrl: "https://github.com/tavily-ai/tavily-mcp", priority: 1, category: "popular" },
  { repoUrl: "https://github.com/supabase-community/supabase-mcp", priority: 1, category: "popular" },
  { repoUrl: "https://github.com/stripe/agent-toolkit", priority: 1, category: "popular" },
  { repoUrl: "https://github.com/exa-labs/exa-mcp-server", priority: 1, category: "popular" },
  { repoUrl: "https://github.com/fireproof-storage/mcp-database-server", priority: 1, category: "database" },

  // ---------------------------------------------------------------------------
  // Priority 2: Known MCP ecosystem servers & SDKs (verified)
  // ---------------------------------------------------------------------------
  { repoUrl: "https://github.com/ferrislucas/mcp-server-commands", priority: 2, category: "tools" },
  { repoUrl: "https://github.com/mark3labs/mcp-filesystem-server", priority: 2, category: "filesystem" },
  { repoUrl: "https://github.com/heimerdev/mcp-server-ssh", priority: 2, category: "tools" },
  { repoUrl: "https://github.com/JetBrains/mcp-kotlin", priority: 2, category: "sdk" },
  { repoUrl: "https://github.com/langchain-ai/langchain-mcp-adapters", priority: 2, category: "sdk" },
  { repoUrl: "https://github.com/cline/MCP", priority: 2, category: "tools" },

  // ---------------------------------------------------------------------------
  // Priority 3: From the official MCP Registry (registry.modelcontextprotocol.io)
  // Additional servers are discovered via the registry sync cron job.
  // ---------------------------------------------------------------------------
  { repoUrl: "https://github.com/explorium-ai/mcp-explorium", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/Artin0123/gemini-vision-mcp", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/Artin0123/gemini-image-mcp-server", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/Kubit-AI/mcp-server", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/Ludo-AI/ludo-mcp", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/obris-dev/obris-mcp", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/agentskills/agentskills", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/parallel-web/search-mcp", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/parallel-web/task-mcp", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/embeddedlayers/mcp-analytics", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/la-rebelion/hapimcp", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/the-basilisk-ai/squad-mcp", priority: 3, category: "registry" },
  { repoUrl: "https://github.com/mcpcap/mcpcap", priority: 3, category: "registry" },
];
