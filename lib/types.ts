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

// Activity Detail Types
export interface ActivityDetailResponse {
  info: {
    activity: {
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
    };
    course: {
      course_id: number;
      course_name: string;
      kelas: string;
      jumlah_aktivitas: number;
      jumlah_mahasiswa: number;
      dosen_pengampu: string;
    };
  };
  students: {
    data: {
      id: number;
      user_id: number;
      nim: string;
      full_name: string;
      program_studi: string | null;
      waktu_mulai: string;
      waktu_selesai: string;
      durasi_pengerjaan: string;
      jumlah_soal: number;
      jumlah_dikerjakan: number;
      nilai: string;
      waktu_aktivitas: string;
    };
    pagination: PaginationInfo;
    statistics: {
      total_participants: number;
      average_score: string;
      completion_rate: number;
    };
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
  students: any;
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

// Filter API Response Types
export interface FilterOption {
  category_id: number;
  category_name: string;
}

export interface FilterResponse {
  status: boolean;
  dataUser: {
    sub: string;
    name: string;
    kampus: string;
    fakultas: string;
    prodi: string;
    admin: boolean;
    token: string;
    isValid: boolean;
    exp: number;
    iat: number;
  };
  data: FilterOption[];
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
}

export interface MatkulFilterOption {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  curriculum_year: number;
}

export interface MatkulFilterResponse {
  status: boolean;
  dataUser: {
    sub: string;
    name: string;
    kampus: string;
    fakultas: string;
    prodi: string;
    admin: boolean;
    token: string;
    isValid: boolean;
    exp: number;
    iat: number;
  };
  data: MatkulFilterOption[];
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
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
  id?: string | number;
  username?: string;
  sub: string;
  name?: string;
  admin?: boolean | number; // Allow both boolean and number (0/1) for backend compatibility
  kampus?: string;
  fakultas?: string;
  prodi?: string;
  exp: number;
  iat?: number;
}

export interface AuthState {
  isAuthenticated: boolean
  user: {
    username: string
    name?: string
    admin?: boolean
    kampus?: string
    fakultas?: string
    prodi?: string
  } | null
  token: string | null
  isLoading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signOut: () => void
  refreshAuth: () => void
}

// ETL Chart Types
export interface ETLLog {
  id: string;
  start_date: string;
  end_date: string;
  duration: string;
  status: string;
  total_records: string;
  offset: string;
  created_at: string;
}

export interface ETLLogsResponse {
  status: boolean;
  data: {
    logs: ETLLog[];
    pagination: {
      total: string;
      limit: number;
      offset: number;
      current_page: number;
      total_pages: number;
    };
  };
}

export interface ETLStartResponse {
  status: boolean;
  message: string;
  info: string;
}

export interface ETLClearStuckResponse {
  status: boolean;
  message: string;
}

export interface ETLStreamData {
  timestamp: string;
  message: string;
  level: 'info' | 'error' | 'warning' | 'success';
} 