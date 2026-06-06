export type OrderStatus = 'pending' | 'video_uploaded' | 'qr_generated' | 'shipped';

export interface Order {
  id: string;
  customer_name: string;
  customer_note: string | null;
  video_url: string | null;
  qr_token: string;
  qr_code_url: string | null;
  status: OrderStatus;
  created_at: string;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_note?: string;
}

export interface UpdateOrderInput {
  video_url?: string;
  qr_code_url?: string;
  status?: OrderStatus;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface UploadVideoResponse {
  video_url: string;
}

export interface GenerateQrResponse {
  qr_code_url: string;
}
