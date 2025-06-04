import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
import { ResponseDTO } from '../utils/http/response.util';
import { IRequest } from '../utils/helpers/types/common.helpers.types';
// import { KafkaService } from 'src/libs/queue/kafka/kafka.service';
// import { ResponseDTO } from '../http/response.util';
// import { IRequest } from 'src/libs/interfaces/common.interface';
// import { KAFKA_TOPICS } from 'src/libs/enum/queue.enum';

@Injectable()
export class EventEmitterInterceptor implements NestInterceptor {
  constructor(
    // private readonly kafkaService: KafkaService,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((response: ResponseDTO<any>) => {
        const request: IRequest = context.switchToHttp().getRequest();

        if (response._event) {
          const event = response._event;
          delete response._event;
          // this.kafkaService
          //   .broadcast(
          //     `${KAFKA_TOPICS.BROADCAST}_${this.config.get('server.env')}`,
          //     [
          //       {
          //         value: {
          //           ...event,
          //           request: {
          //             ip: request.reqIp,
          //             id: request.reqId,
          //             ua: request?.device?.ua,
          //           },
          //         },
          //         key: event.name ?? request.reqId,
          //       },
          //     ],
          //   )
          //   .then();
        }
      }),
    );
  }
}
