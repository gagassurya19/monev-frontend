import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/config";
import {
  TpEtlSummary,
  TpEtlUserCourses,
  TpEtlDetail,
  TpEtlDetailSummary,
} from "@/lib/types/teacher-performance";
import { ApiResponse } from "@/lib/types/api";

export async function getTPEtlSummary(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  sort_by: string = "created_at",
  sort_order: string = "desc"
): Promise<ApiResponse<TpEtlSummary[]>> {
  const response = await apiClient.get<ApiResponse<TpEtlSummary[]>>(
    API_ENDPOINTS.TP.ETL.SUMMARIES,
    { page, limit, search, sort_by, sort_order }
  );
  return response;
}

export async function getTPEtlUserCourses(
  user_id: number
): Promise<ApiResponse<TpEtlUserCourses[]>> {
  const response = await apiClient.get<ApiResponse<TpEtlUserCourses[]>>(
    API_ENDPOINTS.TP.ETL.USER_COURSES,
    { user_id }
  );
  return response;
}

export async function getTPEtlDetail(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  sort_by: string = "id",
  sort_order: string = "desc",
  user_id: number,
  course_id: number
): Promise<ApiResponse<TpEtlDetail[]>> {
  const response = await apiClient.get<ApiResponse<TpEtlDetail[]>>(
    API_ENDPOINTS.TP.ETL.DETAIL,
    { user_id, course_id, page, limit, search, sort_by, sort_order }
  );
  return response;
}

export async function getTPEtlDetailSummary(
  user_id: number,
  course_id: number
): Promise<ApiResponse<TpEtlDetailSummary>> {
  const response = await apiClient.get<ApiResponse<TpEtlDetailSummary>>(
    API_ENDPOINTS.TP.ETL.DETAIL_SUMMARY.replace(
      "{user_id}",
      user_id.toString()
    ).replace("{course_id}", course_id.toString())
  );
  return response;
}
