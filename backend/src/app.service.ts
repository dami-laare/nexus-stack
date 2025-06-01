import { Injectable } from '@nestjs/common';
import { Response } from 'libs/utils/http/response.util';
import * as moment from 'moment';

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
