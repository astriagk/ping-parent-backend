export interface FileUploadResponse {
  success: boolean;
  data: {
    file_url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
  };
  message: string;
}
