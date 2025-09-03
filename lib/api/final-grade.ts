import { apiClient } from '@/lib/api-client';
import { ApiResponse, FinalGradeData, Faculty, Prodi, KampusItem, FinalGradeCourse } from '@/lib/types';

export async function getProdisList(facultyId: string, kampusId: string): Promise<ApiResponse<Prodi[]>> {
  if (!facultyId || !kampusId) {
    console.error('Invalid parameters for getProdisList:', { facultyId, kampusId });
    return { data: [], status: false, message: 'facultyId and kampusId are required' };
  }
  try {
    console.log('Sending request to /api/v1/cp/prodis with params:', { facultyId, kampusId });
    const response = await apiClient.get<Prodi[]>('/api/v1/cp/prodis', {
      params: { facultyId, kampusId },
    });
    console.log('Prodis response from API:', response);
    return { data: response, status: true };
  } catch (error) {
    console.error('Error fetching prodis list:', error);
    throw error;
  }
}

export async function getFinalGradesData(params: {
  courseId: string;
  kampusId?: string;
  facultyId?: string;
  prodiId?: string;
}): Promise<ApiResponse<FinalGradeData[]>> {
  try {
    console.log('Sending request to /api/v1/cp/final-grades with params:', params);
    const response = await apiClient.get<FinalGradeData[]>('/api/v1/cp/final-grades', {
      params: {
        courseId: params.courseId,
        kampusId: params.kampusId,
        facultyId: params.facultyId,
        prodiId: params.prodiId,
      },
    });
    console.log('Final grades response from API:', response);
    return { data: response, status: true };
  } catch (error) {
    console.error('Error fetching final grades:', error);
    throw error;
  }
}

export async function getKampusList(): Promise<ApiResponse<KampusItem[]>> {
  try {
    console.log('Sending request to /api/v1/cp/kampus');
    const response = await apiClient.get<KampusItem[]>('/api/v1/cp/kampus');
    console.log('Kampus response from API:', response);
    return { data: response, status: true };
  } catch (error) {
    console.error('Error fetching kampus list:', error);
    throw error;
  }
}

export async function getFacultiesList(kampusId: string): Promise<ApiResponse<Faculty[]>> {
  if (!kampusId) {
    console.error('Invalid kampusId for getFacultiesList:', kampusId);
    return { data: [], status: false, message: 'kampusId is required' };
  }
  try {
    console.log('Sending request to /api/v1/cp/faculties with kampusId:', kampusId);
    const response = await apiClient.get<Faculty[]>('/api/v1/cp/faculties', {
      params: { kampusId },
    });
    console.log('Faculties response from API:', response);
    return { data: response, status: true };
  } catch (error) {
    console.error('Error fetching faculties list:', error);
    throw error;
  }
}

export async function getCoursesList(prodiId: string, kampusId: string): Promise<ApiResponse<FinalGradeCourse[]>> {
  if (!prodiId || !kampusId) {
    console.error('Invalid parameters for getCoursesList:', { prodiId, kampusId });
    return { data: [], status: false, message: 'prodiId and kampusId are required' };
  }
  try {
    console.log('Sending request to /api/v1/cp/final-grade/courses with params:', { prodiId, kampusId });
    const response = await apiClient.get<FinalGradeCourse[]>('/api/v1/cp/final-grade/courses', {
      params: { prodiId, kampusId },
    });
    console.log('Courses response from API:', response);
    return { data: response, status: true };
  } catch (error) {
    console.error('Error fetching courses list:', error);
    throw error;
  }
}

export async function getCoursesListFromCourses(params: {
  search?: string;
}): Promise<ApiResponse<FinalGradeCourse[]>> {
  try {
    console.log('Sending request to /api/v1/cp/final-grade/courses with params:', params);
    const response = await apiClient.get<FinalGradeCourse[]>('/api/v1/cp/final-grade/courses', {
      params: { search: params.search },
    });
    console.log('Courses response from API:', response);
    return { data: response, status: true };
  } catch (error) {
    console.error('Error fetching courses list from courses:', error);
    throw error;
  }
}