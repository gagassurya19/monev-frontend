import { apiClient } from '../api-client';
import {
  CoursesResponse,
  CoursesFilters,
  Course,
  CourseActivitiesResponse,
  ActivitiesFilters,
  ActivityDetailResponse,
} from '../types';
import { API_ENDPOINTS, API_CONFIG } from '../config';

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

    const response = await apiClient.get<CoursesResponse>(API_ENDPOINTS.COURSES, queryParams);
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
      API_ENDPOINTS.COURSE_ACTIVITIES(courseId),
      queryParams
    );
    return response;
  } catch (error) {
    console.error(`Error fetching activities for course ${courseId}:`, error);
    throw error;
  }
}

// get activity detail
export async function getActivityDetail(courseId: number, activityId: number, activityType: string, limit: number): Promise<ActivityDetailResponse> {
  try {
    const response = await apiClient.get<ActivityDetailResponse>(API_ENDPOINTS.ACTIVITY_DETAIL(courseId, activityId, activityType), { limit });
    return response;
  } catch (error) {
    console.error(`Error fetching activity detail for course ${courseId} and activity ${activityId}:`, error);
    throw error;
  }
}