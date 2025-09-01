import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/config";
import {
  SpEtlSummaryResponse,
  SpEtlSummaryDetailResponse,
} from "@/lib/types/student-performance";
import {
  SpEtlModuleTypeSummaryResponse,
  SpEtlDetailResponse,
} from "../types/student-performance-detail";

export async function getSPSummary(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  sort_by: string = "created_at",
  sort_order: string = "desc"
): Promise<SpEtlSummaryResponse> {
  try {
    const response = await apiClient.get<SpEtlSummaryResponse>(
      API_ENDPOINTS.SP.ETL.SUMMARIES,
      {
        page,
        limit,
        search,
        sort_by,
        sort_order,
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching ETL status:", error);
    throw error;
  }
}

export async function getSPSummaryDetail(
  user_id: number,
  course_id: number
): Promise<SpEtlSummaryDetailResponse> {
  try {
    const response = await apiClient.get<SpEtlSummaryDetailResponse>(
      API_ENDPOINTS.SP.ETL.SUMMARIES_DETAIL,
      { user_id, course_id }
    );
    return response;
  } catch (error) {
    console.error("Error fetching ETL status:", error);
    throw error;
  }
}

export async function getSPModuleTypeSummary(
  user_id: number,
  course_id: number
): Promise<SpEtlModuleTypeSummaryResponse> {
  try {
    const response = await apiClient.get<SpEtlModuleTypeSummaryResponse>(
      API_ENDPOINTS.SP.ETL.MODULE_TYPE_SUMMARY,
      { user_id, course_id }
    );
    return response;
  } catch (error) {
    console.error("Error fetching ETL status:", error);
    throw error;
  }
}

export async function getSPDetail(
  user_id: number,
  course_id: number,
  page: number = 1,
  limit: number = 10,
  search: string = ""
): Promise<SpEtlDetailResponse> {
  try {
    const response = await apiClient.get<SpEtlDetailResponse>(
      API_ENDPOINTS.SP.ETL.DETAIL,
      { user_id, course_id, page, limit, search }
    );
    return response;
  } catch (error) {
    console.error("Error fetching ETL status:", error);
    throw error;
  }
}
