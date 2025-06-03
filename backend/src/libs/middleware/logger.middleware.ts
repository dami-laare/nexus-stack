import {
  Injectable,
  NestMiddleware,
  Logger as NestLogger,
} from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { IRequest } from '../utils/helpers/types/common.helpers.types';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new NestLogger();

  log(context: string, message: string) {
    this.logger.log(message, context);
  }

  use(req: IRequest, res: Response, next: NextFunction) {
    const output = (req: IRequest) =>
      `request started ${req.method} ${req.path} ${res.statusCode}`;

    this.logger.log(
      `request started ${JSON.stringify({
        req: {
          method: req.method,
          url: req.path,
          query: req.query,
          params: req.params,
          headers: req.headers,
          reqId: req.reqId,
          body: req.body,
        },
        res: {
          statusCode: res.statusCode,
        },
        timestamp: new Date(),
      })}`,
    );

    req.on('close', () => {
      this.logger.log('info', output(req));
    });
    next();
  }
}
