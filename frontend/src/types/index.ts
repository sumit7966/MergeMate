export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  github_username?: string;
  is_active: boolean;
  is_superuser: boolean;
  current_organization_id?: string;
  current_role?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  user: User;
  created_at: string;
}

export interface RepositorySettings {
  id: string;
  repository_id: string;
  auto_review_enabled: boolean;
  ai_review_enabled: boolean;
  static_analysis_enabled: boolean;
  security_scanning_enabled: boolean;
  test_execution_enabled: boolean;
  github_publishing_enabled: boolean;
  severity_threshold: string;
  ai_model: string;
  custom_instructions?: string;
  excluded_paths?: string[];
  max_file_size_kb: number;
}

export interface Repository {
  id: string;
  organization_id: string;
  github_repo_id: number;
  name: string;
  full_name: string;
  description?: string;
  is_private: boolean;
  default_branch: string;
  language?: string;
  is_active: boolean;
  settings?: RepositorySettings;
  created_at: string;
}

export interface ChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface PullRequest {
  id: string;
  repository_id: string;
  pr_number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author_username: string;
  author_avatar_url?: string;
  source_branch: string;
  target_branch: string;
  head_sha: string;
  base_sha: string;
  html_url?: string;
  diff_url?: string;
  additions: number;
  deletions: number;
  changed_files_count: number;
  latest_review_verdict?: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  latest_review_status?: string;
  findings_count?: number;
  files?: ChangedFile[];
  created_at: string;
  updated_at: string;
}

export interface UserFeedback {
  id: string;
  finding_id: string;
  user_id: string;
  action: 'useful' | 'incorrect' | 'ignored';
  comment?: string;
  created_at: string;
}

export interface ReviewFinding {
  id: string;
  review_id: string;
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  file_path: string;
  line_start?: number;
  line_end?: number;
  code_evidence?: string;
  why_it_matters: string;
  suggested_fix: string;
  source_engine: string;
  rule_id?: string;
  user_feedbacks?: UserFeedback[];
  created_at: string;
}

export interface TestResult {
  id: string;
  review_id: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  duration_seconds: number;
  passed: boolean;
  container_id?: string;
  raw_output?: string;
  error_summary?: string;
  created_at: string;
}

export interface Review {
  id: string;
  pull_request_id: string;
  review_job_id: string;
  commit_sha: string;
  verdict: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  summary: string;
  explanation?: string;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  confidence_score: number;
  analysis_duration_seconds: number;
  tools_executed?: string[];
  github_published: boolean;
  github_review_id?: number;
  github_published_at?: string;
  created_at: string;
  findings?: ReviewFinding[];
  test_results?: TestResult[];
}

export interface DashboardOverview {
  connected_repositories_count: number;
  total_pull_requests_reviewed: number;
  open_review_jobs_count: number;
  findings_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  findings_by_category: Record<string, number>;
  review_status_distribution: Record<string, number>;
  recent_activity: Array<{
    id: string;
    type: string;
    title: string;
    repo: string;
    pr_number: number;
    author: string;
    state: string;
    timestamp: string;
  }>;
  recent_security_findings: ReviewFinding[];
}

export interface RecentReviewItem {
  id: string;
  pull_request_id: string;
  pr_number: number;
  pr_title: string;
  repository_name: string;
  author: string;
  verdict: string;
  total_findings: number;
  critical_count: number;
  high_count: number;
  created_at: string;
  github_published: boolean;
}
