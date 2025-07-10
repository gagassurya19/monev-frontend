// API Response Types
export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
  filters_applied?: Record<string, any>;
  message?: string;
  success?: boolean;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

// Course Types
export interface Course {
  course_id: number;
  course_name: string;
  kelas: string;
  jumlah_aktivitas: number;
  jumlah_mahasiswa: number;
  dosen_pengampu: string;
}

export interface CoursesResponse {
  data: Course[];
  pagination: PaginationInfo;
  filters_applied: {
    search?: string;
    dosen_pengampu?: string;
    activity_type?: string;
  };
}

// Activity Types
export interface ActivitySummary {
  id: number;
  course_id: number;
  section: number;
  activity_id: number;
  activity_type: string;
  activity_name: string;
  accessed_count: number;
  submission_count: number | null;
  graded_count: number | null;
  attempted_count: number | null;
  created_at: string;
}

export interface CourseActivitiesResponse {
  data: ActivitySummary[];
  pagination: PaginationInfo;
  course_info: {
    course_id: number;
    course_name: string;
    kelas: string;
  };
}

// Student Types
export interface StudentDisplayData {
  user_id: number;
  nim: string;
  full_name: string;
  activity_type: string;
  waktu_aktivitas: string;
  durasi_pengerjaan?: string;
  nilai?: number;
  progress?: string;
  email?: string;
  program_studi?: string;
}

export interface ActivityStudentsResponse {
  data: StudentDisplayData[];
  pagination: PaginationInfo;
  activity_info: {
    activity_id: number;
    activity_name: string;
    activity_type: string;
    course_name: string;
  };
  statistics: {
    total_participants: number;
    average_score?: number;
    completion_rate: number;
  };
}

// Filter and Search Types
export interface CoursesFilters {
  page?: number;
  limit?: number;
  search?: string;
  dosen_pengampu?: string;
  activity_type?: string;
  sort_by?: 'course_name' | 'jumlah_mahasiswa' | 'jumlah_aktivitas';
  sort_order?: 'asc' | 'desc';
}

export interface ActivitiesFilters {
  activity_type?: 'resource' | 'assign' | 'quiz';
  activity_id?: number;
  section?: number;
  page?: number;
  limit?: number;
}

export interface StudentsFilters {
  page?: number;
  limit?: number;
  search?: string;
  program_studi?: string;
  sort_by?: 'full_name' | 'nim' | 'nilai' | 'waktu_aktivitas';
  sort_order?: 'asc' | 'desc';
  activity_type: 'resource' | 'assign' | 'quiz';
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ErrorResponse {
  error: ApiError;
  timestamp: string;
  request_id?: string;
}

// JWT Authentication types
export interface JWTPayload {
  sub: string      // username
  name?: string    // name  
  admin?: boolean  // admin flag
  exp: number      // expiration timestamp
  iat?: number     // issued at
}

export interface AuthState {
  isAuthenticated: boolean
  user: {
    username: string
    name?: string
    admin?: boolean
  } | null
  token: string | null
  isLoading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signOut: () => void
  refreshAuth: () => void
} 