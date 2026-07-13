

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: number; // or UserRole
  permissions: string[];
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

export type RefreshTokenRequest = {
  accessToken: string;
  refreshToken: string;
};
