export interface ErrorResponse {
  status: number;
  name?: string;
  message?: string;
  type?: string;
  code?: string;
  data?: any;
  stack?: any;
  meta?: any;
}
