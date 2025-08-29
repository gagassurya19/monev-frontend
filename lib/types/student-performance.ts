export interface SpEtlSummary {
  id: number;
  response_id: number;
  user_id: number;
  username: string;
  firstname: string;
  lastname: string;
  total_course: number;
  total_login: number;
  total_activities: number;
  extraction_date: string;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  current_page: number;
  total_pages: number;
  total_records: number;
  limit: number;
  has_next_page: boolean;
  has_prev_page: boolean;
  next_page: number | null;
  prev_page: number | null;
}

export interface SpEtlSummaryResponse {
  success: boolean;
  status: number;
  message: string;
  timestamp: string;
  data: SpEtlSummary[];
  pagination: Pagination;
}

export interface SpEtlSummaryDetailResponse {
  success: boolean;
  status: number;
  message: string;
  timestamp: string;
  data: SpEtlSummaryDetail[];
}

export interface SpEtlSummaryDetail {
  user_id: number;
  course_id: number;
  course_name: string;
  total_logs: number;
  total_module_types: number;
  total_modules: number;
  highest_grade: string;
  lowest_grade: string;
  average_grade: string;
  last_activity: number;
  first_activity: number;
  last_updated: string;
}
