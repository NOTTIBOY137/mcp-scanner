export interface RegistryServer {
  slug: string;
  name: string;
  description: string;
  repository: {
    url: string;
    owner: string;
    repo: string;
  };
  category: string;
  stars: number;
  verified: boolean;
}

export interface RegistryResponse {
  servers: RegistryServer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SearchParams {
  query?: string;
  grade?: string;
  category?: string;
  sort?: "score" | "stars" | "name" | "recent";
  page?: number;
  pageSize?: number;
}
