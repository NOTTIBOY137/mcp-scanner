export interface Server {
  id: string;
  name: string;
  repoUrl: string;
  owner: string;
  repo: string;
  description: string | null;
  stars: number;
  language: string | null;
  latestGrade: string | null;
  latestScore: number | null;
  latestScanId: string | null;
  isVerified: boolean;
  registrySlug: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerListItem {
  id: string;
  name: string;
  owner: string;
  repo: string;
  description: string | null;
  stars: number | null;
  latestGrade: string | null;
  latestScore: number | null;
  findingsCount?: number | null;
  lastScannedAt?: Date | null;
}

export interface ServerDetail extends Server {
  scanHistory: ScanSummary[];
}

export interface ScanSummary {
  id: string;
  grade: string | null;
  score: number | null;
  findingsCount: number;
  createdAt: Date;
  commitSha: string | null;
}
