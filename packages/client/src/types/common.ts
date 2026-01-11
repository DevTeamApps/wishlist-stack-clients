export type Id = string;

export type ApiErrorItem = {
  message: string;
  field?: string;
};

export type ApiErrorResponse = {
  errors?: ApiErrorItem[];
};

