import { Octokit } from "@octokit/rest";
import { graphql } from "@octokit/graphql";
import type { FileContent } from "@/types/scan";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TreeEntry {
  path: string;
  sha: string;
  size: number;
}

export interface RepoInfo {
  name: string;
  description: string | null;
  stars: number;
  language: string | null;
  defaultBranch: string;
}

// ---------------------------------------------------------------------------
// Lazy-initialised clients (avoid importing env.ts at module level)
// ---------------------------------------------------------------------------

let _octokit: Octokit | null = null;

function getOctokit(): Octokit {
  if (!_octokit) {
    _octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }
  return _octokit;
}

function getGraphql() {
  return graphql.defaults({
    headers: { authorization: `token ${process.env.GITHUB_TOKEN}` },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCANNABLE_EXTENSIONS = new Set([
  ".ts",
  ".js",
  ".py",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
]);

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "vendor",
  "__pycache__",
]);

function isScannable(path: string): boolean {
  const ext = path.slice(path.lastIndexOf("."));
  if (!SCANNABLE_EXTENSIONS.has(ext)) return false;

  const segments = path.split("/");
  for (const seg of segments) {
    if (SKIP_DIRS.has(seg)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// parseGithubUrl
// ---------------------------------------------------------------------------

export function parseGithubUrl(url: string): { owner: string; repo: string } {
  // Normalise: strip trailing slashes, .git suffix, and protocol/host prefix
  let cleaned = url.trim().replace(/\/+$/, "").replace(/\.git$/, "");

  // Remove protocol + host if present
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?github\.com\//, "");
  cleaned = cleaned.replace(/^github\.com\//, "");

  const parts = cleaned.split("/").filter(Boolean);

  if (parts.length < 2) {
    throw new Error(
      `Invalid GitHub URL: "${url}". Expected format: owner/repo or https://github.com/owner/repo`,
    );
  }

  return { owner: parts[0], repo: parts[1] };
}

// ---------------------------------------------------------------------------
// getRepoTree
// ---------------------------------------------------------------------------

export async function getRepoTree(
  owner: string,
  repo: string,
): Promise<TreeEntry[]> {
  const octokit = getOctokit();

  const { data } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: "HEAD",
    recursive: "1",
  });

  return data.tree
    .filter(
      (entry) =>
        entry.type === "blob" &&
        entry.path != null &&
        entry.sha != null &&
        entry.size != null &&
        isScannable(entry.path),
    )
    .map((entry) => ({
      path: entry.path as string,
      sha: entry.sha as string,
      size: entry.size as number,
    }));
}

// ---------------------------------------------------------------------------
// batchFetchFiles
// ---------------------------------------------------------------------------

const BATCH_SIZE = 20;

export async function batchFetchFiles(
  owner: string,
  repo: string,
  paths: string[],
): Promise<FileContent[]> {
  const gql = getGraphql();
  const results: FileContent[] = [];

  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const batch = paths.slice(i, i + BATCH_SIZE);
    const files = await fetchBatch(gql, owner, repo, batch);
    results.push(...files);
  }

  return results;
}

async function fetchBatch(
  gql: typeof graphql,
  owner: string,
  repo: string,
  paths: string[],
): Promise<FileContent[]> {
  // Build aliased object fields: file0, file1, ...
  const objectFields = paths
    .map(
      (p, idx) =>
        `file${idx}: object(expression: "HEAD:${escapeGraphQL(p)}") { ... on Blob { text } }`,
    )
    .join("\n    ");

  const query = `
    query ($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        ${objectFields}
      }
    }
  `;

  const response = await gql<{
    repository: Record<string, { text: string | null } | null>;
  }>(query, { owner, repo });

  const results: FileContent[] = [];

  paths.forEach((p, idx) => {
    const blob = response.repository[`file${idx}`];
    if (blob?.text != null) {
      results.push({ path: p, content: blob.text });
    }
  });

  return results;
}

function escapeGraphQL(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ---------------------------------------------------------------------------
// getRepoInfo
// ---------------------------------------------------------------------------

export async function getRepoInfo(
  owner: string,
  repo: string,
): Promise<RepoInfo> {
  const octokit = getOctokit();

  const { data } = await octokit.repos.get({ owner, repo });

  return {
    name: data.name,
    description: data.description,
    stars: data.stargazers_count,
    language: data.language,
    defaultBranch: data.default_branch,
  };
}
