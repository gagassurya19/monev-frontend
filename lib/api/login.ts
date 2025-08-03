import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '../config';

export interface LoginAdminResponse {
    status: boolean;
    message: string;
    token: string;
}

export const loginAdmin = async (username: string, password: string): Promise<LoginAdminResponse> => {
    return await apiClient.post<LoginAdminResponse>(API_ENDPOINTS.AUTH.LOGIN_ADMIN, {
        username,
        password
    });
};