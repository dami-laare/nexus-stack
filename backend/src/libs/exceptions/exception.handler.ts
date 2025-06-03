import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  PreconditionFailedException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeEnv } from 'src/libs/types/common.types';
import { ErrorResponse } from '../types/exception.types';

export const ExceptionHandler = (exception: any, config: ConfigService) => {
  const logger = new Logger();

  let errorResponse: ErrorResponse = {
    status: exception.status || 500,
  };

  if (
    exception instanceof BadRequestException ||
    exception instanceof InternalServerErrorException ||
    exception instanceof NotFoundException ||
    exception instanceof UnauthorizedException ||
    exception instanceof PreconditionFailedException ||
    exception instanceof ForbiddenException
  ) {
    const exceptionResponse = exception.getResponse() as {
      message: string;
      type?: string;
      data: any;
      code?: string;
    };

    errorResponse = {
      ...errorResponse,
      message:
        exceptionResponse.message === 'Unexpected field'
          ? 'One or more file fields passed were invalid.'
          : exception.message || exceptionResponse.message,
      data: exceptionResponse.data,
      type: exceptionResponse.type,
      meta: (exceptionResponse as any)._meta,
      code: exceptionResponse.code,
    };
  } else {
    errorResponse = {
      ...errorResponse,
      message:
        exception?.message ||
        exception?.response?.message ||
        exception?.message?.error ||
        exception?.toString(),
    };
  }

  const nodeEnv = config.get<NodeEnv>('server.env');

  if (nodeEnv !== 'production') {
    errorResponse.stack = (exception as any).stack;
  }

  logger.error(errorResponse);

  return errorResponse;
};
