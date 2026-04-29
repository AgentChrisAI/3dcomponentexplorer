export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
}

export interface Component {
  id: string;
  name: string;
  path: string;
  description: string;
  props: ComponentProp[];
  sandpackExample?: string;
  tags: string[];
  source?: string;
}

export type RepoCategory =
  | 'primitives'
  | 'styled-system'
  | 'enterprise'
  | 'framework'
  | 'utility'
  | 'collections'
  | 'other';

export interface SandpackConfig {
  dependencies: Record<string, string>;
  entry: string;
  cssImports?: string[];
  customSetup?: object;
}

export interface Repo {
  id: string;
  name: string;
  githubUrl: string;
  localPath: string;
  category: RepoCategory;
  description: string;
  version: string;
  stars?: number;
  components: Component[];
  orbPosition: [number, number, number];
  orbSize: number;
  sandpackConfig: SandpackConfig;
  lastDiscovered: string;
  addedAt: string;
}

export interface SearchEntry {
  repoId: string;
  repoName: string;
  componentId: string;
  componentName: string;
  description: string;
  tags: string[];
  category: RepoCategory;
}

export interface Manifest {
  version: string;
  generatedAt: string;
  totalRepos: number;
  totalComponents: number;
  repos: Repo[];
  searchIndex: SearchEntry[];
}
