export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
};

export type PaginatedData<T> = {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
};
export type ApiResult<T> = {
  succeeded?: boolean;
  success?: boolean;
  message?: string;
  errors?: unknown;
  data?: T;
};

export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
};

export function unwrapResult<T>(response: ApiResult<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
}
