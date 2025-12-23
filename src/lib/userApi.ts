import httpClient from "./httpClient";

export interface UserCreateRequest {
  email: string;
  username: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  detail: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

class UserApi {
  /**
   * Create a new user account
   */
  async createUser(userData: UserCreateRequest): Promise<UserResponse> {
    try {
      const response = await httpClient.request<UserResponse>("/users/", {
        method: "POST",
        body: JSON.stringify(userData),
        headers: {
          "Content-Type": "application/json",
        },
        skipAuth: true,
      });
      return response;
    } catch (error: any) {
      // Re-throw with better error handling
      if (error.response?.status === 422) {
        const errorData: ApiError = await error.response.json();
        const firstError = errorData.detail?.[0];
        if (firstError) {
          const fieldName = firstError.loc[firstError.loc.length - 1];
          throw new Error(`${fieldName}: ${firstError.msg}`);
        }
      } else if (error.response?.status === 400) {
        throw new Error("Username or email already exists");
      }
      throw new Error("Registration failed. Please try again.");
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<UserResponse> {
    return httpClient.request<UserResponse>("/auth/me", {
      method: "GET",
    });
  }

  /**
   * Get all users (admin only)
   */
  async getUsers(): Promise<UserResponse[]> {
    return httpClient.request<UserResponse[]>("/users/", {
      method: "GET",
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<UserResponse> {
    return httpClient.request<UserResponse>(`/users/${userId}`, {
      method: "GET",
    });
  }
}

export const userApi = new UserApi();
export default userApi;
