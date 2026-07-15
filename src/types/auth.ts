

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
  expiresAt: string;
  userId: number;
  userName: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
};

export type RefreshTokenRequest = {
  accessToken: string;
  refreshToken: string;
};
