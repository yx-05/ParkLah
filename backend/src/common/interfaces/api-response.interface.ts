export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
  details?: Array<{
    field: string;
    issue: string;
  }>;
  timestamp: string;
  path: string;
}
