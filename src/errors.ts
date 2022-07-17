import { Response } from "express";

export abstract class SharXError {
  code: string;
  data: unknown;
  httpCode: number;

  constructor(data: unknown, httpCode: number, code?: string) {
    this.code = code || this.constructor.name;
    this.data = data;
    this.httpCode = httpCode;
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      data: this.data,
    };
  }

  send(res: Response): void {
    res.status(this.httpCode).json({ success: false, ...this.toJSON() });
  }
}

export class UnknownError extends SharXError {
  constructor(data: unknown) {
    super(data, 500);
  }
}

export class MalformedRequestError extends SharXError {
  constructor(data: Record<string, unknown> = {}) {
    super(data, 400);
  }
}

interface JsonFieldErrorData extends Record<string, unknown> {
  field: string;
}

export class JsonFieldError extends MalformedRequestError {
  constructor(data: JsonFieldErrorData) {
    super(data);
  }
}

interface IllegalCharacterErrorData extends JsonFieldErrorData {
  character: string;
}

export class IllegalCharacterError extends JsonFieldError {
  constructor(data: IllegalCharacterErrorData) {
    super(data);
  }
}

interface TooShortFieldErrorData extends JsonFieldErrorData {
  minLength: number;
}

export class TooShortFieldError extends JsonFieldError {
  constructor(data: TooShortFieldErrorData) {
    super(data);
  }
}

interface TooLongFieldErrorData extends JsonFieldErrorData {
  maxLength: number;
}

export class TooLongFieldError extends JsonFieldError {
  constructor(data: TooLongFieldErrorData) {
    super(data);
  }
}

export class InvalidAuthHeaderError extends MalformedRequestError {
  constructor(data: Record<string, unknown> = {}) {
    super(data);
  }
}

export class InvalidCredentialsError extends SharXError {
  constructor(data: Record<string, unknown> = {}) {
    super(data, 401);
  }
}

export class InvalidTokenError extends InvalidCredentialsError {
  constructor(data: Record<string, unknown> = {}) {
    super(data);
  }
}

export class ExpiredTokenError extends InvalidTokenError {
  constructor(data: Record<string, unknown> = {}) {
    super(data);
    this.httpCode = 403;
  }
}

export class ResourceNotFoundError extends SharXError {
  constructor(data: Record<string, unknown> = {}) {
    super(data, 404);
  }
}

export class ImageNotFoundError extends ResourceNotFoundError {
  constructor(data: Record<string, unknown> = {}) {
    super(data);
  }
}

export class ResourceAlreadyExistsError extends SharXError {
  constructor(data: Record<string, unknown> = {}) {
    super(data, 400);
  }
}

interface FieldAlreadyExistsErrorData extends Record<string, unknown> {
  field: string;
}

export class FieldAlreadyExistsError extends ResourceAlreadyExistsError {
  constructor(data: FieldAlreadyExistsErrorData) {
    super(data);
  }
}

export class UserAlreadyRegisteredError extends ResourceAlreadyExistsError {
  constructor(data: FieldAlreadyExistsErrorData) {
    super(data);
  }
}

