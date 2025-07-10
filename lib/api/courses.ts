import { apiClient } from '../api-client';
import {
  CoursesResponse,
  CoursesFilters,
  Course,
  CourseActivitiesResponse,
  ActivitiesFilters,
} from '../types';

/**
 * Get all courses with filtering and pagination
 * @param filters - Query parameters for filtering and pagination
 * @returns Promise<CoursesResponse>
 */
export async function getCourses(filters: CoursesFilters = {}): Promise<CoursesResponse> {
  try {
    // Set default values
    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(filters.search && { search: filters.search }),
      ...(filters.dosen_pengampu && { dosen_pengampu: filters.dosen_pengampu }),
      ...(filters.activity_type && { activity_type: filters.activity_type }),
      ...(filters.sort_by && { sort_by: filters.sort_by }),
      ...(filters.sort_order && { sort_order: filters.sort_order }),
    };

    const response = await apiClient.get<CoursesResponse>('/api/courses', queryParams);
    return response;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

/**
 * Get activities for a specific course
 * @param courseId - The course ID
 * @param filters - Query parameters for filtering activities
 * @returns Promise<CourseActivitiesResponse>
 */
export async function getCourseActivities(
  courseId: number,
  filters: ActivitiesFilters = {}
): Promise<CourseActivitiesResponse> {
  try {
    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.activity_type && { activity_type: filters.activity_type }),
      ...(filters.activity_id && { activity_id: filters.activity_id }),
      ...(filters.section && { section: filters.section }),
    };

    const response = await apiClient.get<CourseActivitiesResponse>(
      `/api/courses/${courseId}/activities`,
      queryParams
    );
    return response;
  } catch (error) {
    console.error(`Error fetching activities for course ${courseId}:`, error);
    throw error;
  }
}

/**
 * Get a single course by ID (if needed for future use)
 * @param courseId - The course ID
 * @returns Promise<Course>
 */
export async function getCourse(courseId: number): Promise<Course> {
  try {
    const response = await apiClient.get<Course>(`/api/courses/${courseId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching course ${courseId}:`, error);
    throw error;
  }
}

/**
 * Search courses with debounced search term
 * @param searchTerm - The search term
 * @param additionalFilters - Additional filters to apply
 * @returns Promise<CoursesResponse>
 */
export async function searchCourses(
  searchTerm: string,
  additionalFilters: Omit<CoursesFilters, 'search'> = {}
): Promise<CoursesResponse> {
  return getCourses({
    ...additionalFilters,
    search: searchTerm,
  });
}

/**
 * Get courses with specific sorting
 * @param sortBy - Field to sort by
 * @param sortOrder - Sort order (asc/desc)
 * @param additionalFilters - Additional filters to apply
 * @returns Promise<CoursesResponse>
 */
export async function getSortedCourses(
  sortBy: CoursesFilters['sort_by'],
  sortOrder: CoursesFilters['sort_order'] = 'asc',
  additionalFilters: Omit<CoursesFilters, 'sort_by' | 'sort_order'> = {}
): Promise<CoursesResponse> {
  return getCourses({
    ...additionalFilters,
    sort_by: sortBy,
    sort_order: sortOrder,
  });
} 