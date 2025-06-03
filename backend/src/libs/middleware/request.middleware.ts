import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { UAParser } from 'ua-parser-js';
import { v4 } from 'uuid';
import { IRequest } from '../utils/helpers/types/common.helpers.types';
// import * as Sentry from '@sentry/nestjs';

@Injectable()
export class RequestMiddleware implements NestMiddleware {
  use(req: IRequest<any>, _res: Response, next: NextFunction) {
    req.reqIp = req.ip;
    req.reqId = `EARNA_REF_${v4().toUpperCase()}`;
    req.userAgent = req.headers['user-agent'];
    req.aetherKey = req.headers['x-aether-access-key'] as string;

    const deviceDetails = new UAParser(req.headers['user-agent']).getResult();

    req.device = deviceDetails;

    // const scope = Sentry.getCurrentScope();
    // scope.setExtra('requestId', req.reqId);
    // scope.setExtra('requestIp', req.reqIp);

    next();
  }
}
