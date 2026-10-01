export interface ApiResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: ApiResponseMeta;
  message?: string;
  errors?: ApiError[];
}

export interface DateRangeFilter {
  from?: string; // ISO date string
  to?: string;   // ISO date string
}

export interface QueryFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  [key: string]: any;
}
