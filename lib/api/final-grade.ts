import { apiClient } from "@/lib/api-client";
import {
  ApiResponse,
  FinalGradeData,
  FinalGradeCourse,
  Faculty,
  Prodi,
  KampusItem,
} from "@/lib/types";
import { API_ENDPOINTS, API_CONFIG } from "@/lib/config";
import { ApiError } from "@/lib/api-client";

export async function getProdisList(
  facultyId: string,
  kampusId: string
): Promise<ApiResponse<Prodi[]>> {
  if (!facultyId || !kampusId) {
    console.error("Invalid parameters for getProdisList:", {
      facultyId,
      kampusId,
    });
    return {
      data: [],
      status: false,
      message: "facultyId and kampusId are required",
    };
  }
  try {
    const response = await apiClient.get<{
      data: Prodi[];
      status: boolean;
      message?: string;
    }>(API_ENDPOINTS.SAS.FILTER.PROGRAM_STUDI, { facultyId, kampusId });
    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  } catch (error) {
    console.error("Error fetching prodis list:", error);
    return { data: [], status: false, message: "Failed to fetch prodis list" };
  }
}

export async function getFinalGradesData(params: {
  kampusId: string;
  facultyId?: string;
  prodiId?: string;
}): Promise<ApiResponse<FinalGradeData[]>> {
  try {
    console.log(
      "Requesting final grades from:",
      `${API_CONFIG.BASE_URL}${API_ENDPOINTS.FINAL_GRADE.BASE}`,
      params
    );
    const response = await apiClient.get<{
      data: FinalGradeData[];
      status: boolean;
      message?: string;
    }>(API_ENDPOINTS.FINAL_GRADE.BASE, {
      kampusId: params.kampusId,
      facultyId: params.facultyId,
      prodiId: params.prodiId,
    });
    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  } catch (error: any) {
    console.error("Error fetching final grades:", error.message);
    return {
      data: [],
      status: false,
      message: `Failed to fetch final grades: ${error.message}`,
    };
  }
}

export async function getKampusList(): Promise<ApiResponse<KampusItem[]>> {
  try {
    console.log(
      "Requesting kampus list from:",
      `${API_CONFIG.BASE_URL}/kampus`
    );
    const response = await apiClient.get<{
      data: KampusItem[];
      status: boolean;
      message?: string;
    }>("/kampus");
    console.log("Raw Kampus response from API:", response);
    if (response.status && Array.isArray(response.data)) {
      return { data: response.data, status: true };
    } else if (!response.status && response.message) {
      console.warn("Kampus request failed:", response.message);
      return {
        data: [],
        status: false,
        message: response.message || "Unknown error",
      };
    }
    throw new Error("Unexpected response format for kampus list");
  } catch (error) {
    console.error("Error fetching kampus list - Details:", error);
    if (error instanceof ApiError) {
      console.error(
        "API Error - Status:",
        error.status,
        "Message:",
        error.message
      );
    } else if (error instanceof Error) {
      console.error("General Error - Message:", error.message);
    }
    return {
      data: [],
      status: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch kampus list",
    };
  }
}

export async function getFacultiesList(
  kampusId: string
): Promise<ApiResponse<Faculty[]>> {
  if (!kampusId) {
    console.error("Invalid kampusId for getFacultiesList:", kampusId);
    return { data: [], status: false, message: "kampusId is required" };
  }
  try {
    console.log(
      "Requesting faculties list from:",
      `${API_CONFIG.BASE_URL}/faculties?kampusId=${kampusId}`
    );
    const response = await apiClient.get<{
      data: Faculty[];
      status: boolean;
      message?: string;
    }>("/faculties", { kampusId });
    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  } catch (error) {
    console.error("Error fetching faculties list:", error);
    return {
      data: [],
      status: false,
      message: "Failed to fetch faculties list",
    };
  }
}

export async function getCoursesList(
  prodiId: string,
  kampusId: string
): Promise<ApiResponse<FinalGradeCourse[]>> {
  if (!prodiId || !kampusId) {
    console.error("Invalid parameters for getCoursesList:", {
      prodiId,
      kampusId,
    });
    return {
      data: [],
      status: false,
      message: "prodiId and kampusId are required",
    };
  }
  try {
    console.log(
      "Requesting courses from:",
      `${API_CONFIG.BASE_URL}${API_ENDPOINTS.FINAL_GRADE.COURSES}?prodiId=${prodiId}&kampusId=${kampusId}`
    );
    const response = await apiClient.get<{
      data: FinalGradeCourse[];
      status: boolean;
      message?: string;
    }>(API_ENDPOINTS.FINAL_GRADE.COURSES, { prodiId, kampusId });
    console.log("Courses response from courses:", response);
    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  } catch (error: any) {
    console.error("Error fetching courses list:", error.message, error.details);
    return { data: [], status: false, message: "Failed to fetch courses list" };
  }
}

export async function getCoursesListFromCourses(params: {
  search?: string;
}): Promise<ApiResponse<FinalGradeCourse[]>> {
  try {
    console.log("Requesting courses from courses with params:", params);
    const response = await apiClient.get<{
      data: FinalGradeCourse[];
      status: boolean;
      message?: string;
    }>(API_ENDPOINTS.CP.COURSES, { search: params.search });
    console.log("Courses response from courses:", response);
    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  } catch (error) {
    console.error("Error fetching courses list from courses:", error);
    return {
      data: [],
      status: false,
      message: "Failed to fetch courses list from courses",
    };
  }
}
