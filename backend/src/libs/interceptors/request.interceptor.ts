import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UAParser } from 'ua-parser-js';
import { v4 } from 'uuid';
import { IRequest } from '../utils/helpers/types/common.helpers.types';

const excluded = ['/health', '/v1/health'];

@Injectable()
export class RequestInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = moment();

    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<IRequest>();
      const method = request.method;
      const url = request.url;
      request.reqIp = request.ip;
      request.reqId = `NEXUS_REF_${v4()}`;
      request.userAgent = request.headers['user-agent'];
      const deviceDetails = new UAParser(
        request.headers['user-agent'],
      ).getResult();
      request.device = deviceDetails;

      if (!excluded.includes(url)) {
        this.logger.log(
          `HTTP request ${request.reqId} started ${method} ${url} --->> Handling request`,
        );
      }

      return next.handle().pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          if (!excluded.includes(url)) {
            this.logger.log(
              `HTTP request completed ${method} ${url} completed - Status: ${statusCode} - Duration: ${moment().diff(now, 'milliseconds')}ms --->>\n${JSON.stringify(
                {
                  query: request.query,
                  params: request.params,
                  body: request.body,
                },
              )}`,
            );
          }
        }),
      );
    }

    return next.handle();
  }
}
