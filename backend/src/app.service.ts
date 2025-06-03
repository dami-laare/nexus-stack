import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { Response } from './libs/utils/http/response.util';

@Injectable()
export class AppService {
  health() {
    return Response.success({
      message: 'Successful',
      data: {
        status: 'OK',
        timestamp: moment().toISOString(),
      },
    });
  }
}
