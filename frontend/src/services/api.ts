import {
  User,
  DashboardOverview,
  RecentReviewItem,
  Repository,
  RepositorySettings,
  PullRequest,
  Review,
  ReviewFinding,
  TestResult,
  OrganizationMember
} from '@/types';

const API_BASE = '/api/v1';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('mergemate_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ access_token: string; refresh_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, full_name: string, organization_name?: string) {
    return this.request<{ access_token: string; refresh_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, organization_name }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Dashboard
  async getDashboardOverview(): Promise<DashboardOverview> {
    return this.request<DashboardOverview>('/dashboard/overview');
  }

  async getRecentReviews(): Promise<RecentReviewItem[]> {
    return this.request<RecentReviewItem[]>('/dashboard/recent-reviews');
  }

  // Repositories
  async getRepositories(): Promise<Repository[]> {
    return this.request<Repository[]>('/repositories');
  }

  async getRepository(id: string): Promise<Repository> {
    return this.request<Repository>(`/repositories/${id}`);
  }

  async updateRepositorySettings(id: string, settings: Partial<RepositorySettings>): Promise<RepositorySettings> {
    return this.request<RepositorySettings>(`/repositories/${id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  async getRepositoryPullRequests(id: string): Promise<PullRequest[]> {
    return this.request<PullRequest[]>(`/repositories/${id}/pull-requests`);
  }

  // Pull Requests
  async getPullRequests(params?: { state?: string; repository_id?: string; search?: string }): Promise<PullRequest[]> {
    const query = new URLSearchParams();
    if (params?.state) query.set('state', params.state);
    if (params?.repository_id) query.set('repository_id', params.repository_id);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return this.request<PullRequest[]>(`/pull-requests${qs ? `?${qs}` : ''}`);
  }

  async getPullRequest(id: string): Promise<PullRequest> {
    return this.request<PullRequest>(`/pull-requests/${id}`);
  }

  async triggerPullRequestReview(id: string) {
    return this.request<{ message: string; job_id: string; status: string }>(`/pull-requests/${id}/review`, {
      method: 'POST',
    });
  }

  async rerunPullRequestReview(id: string) {
    return this.request<{ message: string; job_id: string; status: string }>(`/pull-requests/${id}/review/rerun`, {
      method: 'POST',
    });
  }

  // Reviews
  async getReviews(pullRequestId?: string): Promise<Review[]> {
    const endpoint = pullRequestId ? `/reviews?pull_request_id=${pullRequestId}` : '/reviews';
    return this.request<Review[]>(endpoint);
  }

  async getReview(id: string): Promise<Review> {
    return this.request<Review>(`/reviews/${id}`);
  }

  async getReviewFindings(id: string): Promise<ReviewFinding[]> {
    return this.request<ReviewFinding[]>(`/reviews/${id}/findings`);
  }

  async getReviewTests(id: string): Promise<TestResult[]> {
    return this.request<TestResult[]>(`/reviews/${id}/tests`);
  }

  async publishReview(id: string) {
    return this.request<{ success: boolean; github_published: boolean; github_review_id: number }>(`/reviews/${id}/publish`, {
      method: 'POST',
    });
  }

  // Findings
  async submitFindingFeedback(findingId: string, action: 'useful' | 'incorrect' | 'ignored', comment?: string) {
    return this.request(`/findings/${findingId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ action, comment }),
    });
  }

  // Team
  async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    return this.request<OrganizationMember[]>(`/organizations/${orgId}/members`);
  }

  async addOrganizationMember(orgId: string, email: string, role: string) {
    return this.request<OrganizationMember>(`/organizations/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async removeOrganizationMember(orgId: string, memberId: string) {
    return this.request(`/organizations/${orgId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Demo
  async seedDemoData() {
    return this.request<{ status: string; message: string }>('/demo/seed', {
      method: 'POST',
    });
  }

  async simulateWebhookReview(): Promise<Review> {
    return this.request<Review>('/demo/simulate-webhook', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
