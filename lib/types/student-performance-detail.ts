export interface SpEtlModuleTypeSummaryResponse {
  success: boolean;
  status: number;
  message: string;
  timestamp: string;
  data: SpEtlModuleTypeSummary;
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

export interface SpEtlModuleTypeSummary {
  total_logs: number;
  total_module_assign: string;
  total_module_quiz: string;
  total_module_forum: string;
  total_module_other: string;
  total_modules: number;
  highest_grade: string;
  lowest_grade: string;
  average_grade: string;
  first_activity: number;
  last_activity: number;
  last_updated: string;
}

export interface SpEtlDetailResponse {
  success: boolean;
  status: number;
  message: string;
  timestamp: string;
  data: SpEtlDetail[];
  pagination: Pagination;
}

export interface SpEtlDetail {
  id: number;
  response_id: number;
  user_id: number;
  course_id: number;
  course_name: string;
  module_type: string;
  module_name: string;
  object_id: number;
  grade: string;
  timecreated: number;
  log_id: number;
  action_type: string;
  extraction_date: string;
  created_at: string;
  updated_at: string;
}
