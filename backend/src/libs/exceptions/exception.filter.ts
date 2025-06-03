import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ExceptionHandler } from './exception.handler';
import { ConfigService } from '@nestjs/config';
import { IRequest } from '../utils/helpers/types/common.helpers.types';
// import { SentryExceptionCaptured } from '@sentry/nestjs';
// import { GENERIC_ERROR_MESSAGE } from 'src/libs/constants/exceptions.constants';

export const GENERIC_ERROR_MESSAGE =
  'An unknown error occurred. Please contact your administrator';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly config: ConfigService) {}

  logger = new Logger(GlobalExceptionFilter.name);

  // @SentryExceptionCaptured()
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const req = ctx.getRequest<IRequest>();

    const err = ExceptionHandler(exception, this.config);
    const { status } = err;

    console.log({ err });

    if (String(status)[0] === '5') {
      this.logger.error(JSON.stringify(err));

      response.status(status).json({
        success: false,
        message: GENERIC_ERROR_MESSAGE,
        requestId: req.reqId,
      });

      return;
    }

    response.status(status).json({
      success: false,
      message: err?.message || 'Error processing request',
      data: err?.data,
      requestId: req.reqId,
      ...err,
    });
  }
}
