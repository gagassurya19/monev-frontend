import { apiClient } from '../api-client';
import { API_CONFIG, API_ENDPOINTS } from '../config';
import { ETLStatus } from '../etl-types';
import {
  ActivityStudentsResponse,
  StudentsFilters,
  ActivitySummary,
  FilterResponse,
  MatkulFilterResponse
} from '../types';

export interface KampusItem {
  id: string;
  name: string;
  code: string;
}

export interface KampusResponse {
  data: KampusItem[];
  success: boolean;
  message: string;
}

export async function getFakultas(search = '', page = 1, limit = 20): Promise<FilterResponse> {
  try {
    const queryParams: Record<string, any> = {
      page: page.toString(),
      limit: limit.toString(),
    };
    if (search) queryParams.search = search;
    
    const response = await apiClient.get<FilterResponse>(API_ENDPOINTS.SAS.FILTER.FAKULTAS, queryParams);
    return response;
  } catch (error) {
    console.error('Error fetching fakultas:', error);
    throw error;
  }
}

export async function getProdi(fakultas: string | number, kampus = 'bdg', search = '', page = 1, limit = 20): Promise<FilterResponse> {
  try {
    const queryParams: Record<string, any> = {
      fakultas: fakultas.toString(),
      kampus,
      page: page.toString(),
      limit: limit.toString(),
    };
    if (search) queryParams.search = search;
    
    const response = await apiClient.get<FilterResponse>(API_ENDPOINTS.SAS.FILTER.PROGRAM_STUDI, queryParams);
    return response;
  } catch (error) {
    console.error('Error fetching prodi:', error);
    throw error;
  }
}

export async function getMatkul(prodi: string | number, search = '', page = 1, limit = 20): Promise<MatkulFilterResponse> {
  try {
    const queryParams: Record<string, any> = {
      prodi: prodi.toString(),
      page: page.toString(),
      limit: limit.toString(),
    };
    if (search) queryParams.search = search;
    
    const response = await apiClient.get<MatkulFilterResponse>(API_ENDPOINTS.SAS.FILTER.MATA_KULIAH, queryParams);
    return response;
  } catch (error) {
    console.error('Error fetching matkul:', error);
    throw error;
  }
}

/**
 * Get students participating in a specific activity
 * @param activityId - The activity ID
 * @param filters - Query parameters for filtering students
 * @returns Promise<ActivityStudentsResponse>
 */
export async function getActivityStudents(
  activityId: number,
  activity_type: StudentsFilters['activity_type'],
  filters: StudentsFilters
): Promise<ActivityStudentsResponse> {
  try {
    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(filters.search && { search: filters.search }),
      ...(filters.program_studi && { program_studi: filters.program_studi }),
      ...(filters.sort_by && { sort_by: filters.sort_by }),
      ...(filters.sort_order && { sort_order: filters.sort_order }),
    };

    const response = await apiClient.get<ActivityStudentsResponse>(
      `/api/analytics/activities/${activityId}/${activity_type}/students`,
      queryParams
    );
    return response;
  } catch (error) {
    console.error(`Error fetching students for activity ${activityId}:`, error);
    throw error;
  }
}

/**
 * Get activity details by ID (if needed for future use)
 * @param activityId - The activity ID
 * @returns Promise<ActivitySummary>
 */
export async function getActivity(activityId: number): Promise<ActivitySummary> {
  try {
    const response = await apiClient.get<ActivitySummary>(`/api/activities/${activityId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching activity ${activityId}:`, error);
    throw error;
  }
}

/**
 * Search students in an activity with debounced search term
 * @param activityId - The activity ID
 * @param searchTerm - The search term (name/NIM)
 * @param additionalFilters - Additional filters to apply
 * @returns Promise<ActivityStudentsResponse>
 */
export async function searchActivityStudents(
  activityId: number,
  searchTerm: string,
  activity_type: StudentsFilters['activity_type'],
  additionalFilters: Omit<StudentsFilters, 'search'> = {
    activity_type: 'resource' as StudentsFilters['activity_type']
  }
): Promise<ActivityStudentsResponse> {
  return getActivityStudents(activityId, activity_type, {
    ...additionalFilters,
    search: searchTerm,
  });
}

/**
 * Get students with specific sorting
 * @param activityId - The activity ID
 * @param sortBy - Field to sort by
 * @param sortOrder - Sort order (asc/desc)
 * @param additionalFilters - Additional filters to apply
 * @returns Promise<ActivityStudentsResponse>
 */
export async function getSortedActivityStudents(
  activityId: number,
  sortBy: StudentsFilters['sort_by'],
  sortOrder: StudentsFilters['sort_order'] = 'asc',
  activity_type: StudentsFilters['activity_type'],
  additionalFilters: Omit<StudentsFilters, 'sort_by' | 'sort_order'> = {
    activity_type: 'resource' as StudentsFilters['activity_type']
  }
): Promise<ActivityStudentsResponse> {
  return getActivityStudents(activityId, activity_type, {
    ...additionalFilters,
    sort_by: sortBy,
    sort_order: sortOrder,
  });
}

/**
 * Get students filtered by program studi
 * @param activityId - The activity ID
 * @param programStudi - Program studi to filter by
 * @param additionalFilters - Additional filters to apply
 * @returns Promise<ActivityStudentsResponse>
 */
export async function getActivityStudentsByProgram(
  activityId: number,
  programStudi: string,
  activity_type: StudentsFilters['activity_type'],
  additionalFilters: Omit<StudentsFilters, 'program_studi'> = {
    activity_type: 'resource' as StudentsFilters['activity_type']
  }
): Promise<ActivityStudentsResponse> {
  return getActivityStudents(activityId, activity_type, {
    ...additionalFilters,
    program_studi: programStudi,
  });
}

export async function getKampus(): Promise<KampusResponse> {
  try {
    // Return static kampus data as per the UI
    const kampusData: KampusItem[] = [
      { id: 'bdg', name: 'TELYU Bandung', code: 'bdg' },
      { id: 'pwt', name: 'TELYU Purwokerto', code: 'pwt' },
    ];
    
    return {
      data: kampusData,
      success: true,
      message: 'Kampus data retrieved successfully',
    };
  } catch (error) {
    console.error('Error fetching kampus:', error);
    throw error;
  }
}

/**
 * Get ETL status for Student Activities Summary
 * @returns Promise<ETLStatus>
 */
export async function getETLSASStatus(): Promise<ETLStatus> {
  try {
    // ETL endpoint uses special webhook token, not auth token
    const response = await apiClient.get<ETLStatus>(API_ENDPOINTS.SAS.ETL.STATUS);
    return response;
  } catch (error) {
    console.error('Error fetching ETL status:', error);
    throw error;
  }
}