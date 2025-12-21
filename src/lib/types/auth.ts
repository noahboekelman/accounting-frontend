export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type?: string;
}
