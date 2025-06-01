import { Expose, Type } from 'class-transformer';
import { IsArray, IsObject, ValidateIf, ValidateNested } from 'class-validator';
import { CommonHelpers } from '../helpers/common.helpers';

export class ResponseMetaDTO<
  T = {
    totalNumberOfRecords: number;
    totalNumberOfPages: number;
    pageNumber: number;
    pageSize: number;
  },
> {
  constructor(partial: Partial<T>) {
    Object.assign(this, partial);
  }

  @Expose()
  totalNumberOfRecords: number;

  @Expose()
  totalNumberOfPages: number;

  @Expose()
  pageNumber: number;

  @Expose()
  pageSize: number;
}

export class ResponseDTO<T> {
  constructor(partial: ResponseDTO<T>) {
    Object.assign(this, partial);
  }

  @Expose()
  status: string;

  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  @ValidateIf(
    (obj) => Array.isArray(obj.field) || typeof obj.field === 'object',
  )
  @IsArray()
  @IsObject()
  @ValidateNested({ each: true })
  data?: T;

  @Expose()
  @IsObject()
  meta?: ResponseMetaDTO;

  @Expose()
  @IsObject()
  @Type(() => Map)
  _event?: {
    name?: string;
    key?: string;
    payload: Record<'before' | 'after', any>;
  };
}

export class Response {
  public static success<T>({
    message,
    data,
    event,
    meta,
  }: {
    message: string;
    data?: T;
    meta?: any;
    event?: {
      name?: string;
      payload: Record<'before' | 'after', any>;
      key?: string;
    };
  }): ResponseDTO<T> {
    return new ResponseDTO<T>({
      status: 'success',
      success: true,
      message,
      data,
      meta,
      _event: CommonHelpers.objectToMap(event),
    });
  }

  public static pending<T>(message: string, data?: T, meta?: any) {
    return new ResponseDTO<T>({
      status: 'pending',
      success: true,
      message,
      data,
      meta,
    });
  }

  static error(message: string, data?: any): ResponseDTO<null> {
    return {
      status: 'error',
      success: false,
      message,
      data,
    };
  }
}
