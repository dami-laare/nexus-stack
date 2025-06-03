import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  PreconditionFailedException,
  UnauthorizedException,
} from '@nestjs/common';

export interface IError {
  message?: string;
  type?: string;
  code?: string;
  data?: any;
  _meta?: any;
}

export class IUnauthorizedException extends UnauthorizedException {
  name = 'UNAUTHORIZED_EXCEPTION';
  constructor({ message, data, _meta, code, type }: IError) {
    super({ message, data, _meta, code, type });
  }
}

export class IForbiddenException extends ForbiddenException {
  name = 'FORBIDDEN_EXCEPTION';
  constructor({ message, data, _meta, code, type }: IError) {
    super({ message, data, _meta, code, type });
  }
}

export class IBadRequestException extends BadRequestException {
  name = 'BAD_REQUEST_EXCEPTION';
  constructor({ message, data, _meta, code, type }: IError) {
    super({ message, data, _meta, code, type });
  }
}

export class IInternalServerErrorException extends InternalServerErrorException {
  name = 'INTERNAL_SERVER_ERROR_EXCEPTION';
  constructor({ message, data, _meta, code, type }: IError) {
    super({ message, data, _meta, code, type });
  }
}

export class INotFoundException extends NotFoundException {
  name = 'NOT_FOUND_EXCEPTION';
  constructor({ message, data, _meta, code, type }: IError) {
    super({ message, data, _meta, code, type });
  }
}

export class IPreconditionFailedException extends PreconditionFailedException {
  name = 'CONDITION_FAILED_EXCEPTION';
  constructor({ message, data, _meta, code, type }: IError) {
    super({ message, data, _meta, code, type });
  }
}
