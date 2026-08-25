export type Role = 'CUSTOMER' | 'VENDOR' | 'DRIVER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

/** Mirrors backend UserResponseDto (features/users) — the shape returned by
 * /auth/login, /auth/register, /users/me. */
export type User = {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
};

export type ApiResponse<T> = {
  success: true;
  data: T;
  meta?: PaginationMeta;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type ApiErrorDetail = {
  field: string;
  [key: string]: unknown;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details: ApiErrorDetail[] | null;
  };
  path: string;
  timestamp: string;
};

export class ApiError extends Error {
  code: string;
  details: ApiErrorDetail[] | null;
  status: number;

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
