export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message?: string) {
    super(message ?? `HTTP error ${status}`);
    this.name = 'HttpError';
    this.status = status;
  }
}
