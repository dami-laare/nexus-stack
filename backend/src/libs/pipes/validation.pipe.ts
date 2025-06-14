import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { ValidationError, validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  requiredConstraintKeys,
  structureConstraintKeys,
  typeConstraintKeys,
} from './validation.constants';
import { IBadRequestException } from '../exceptions/exceptions';

@Injectable()
export class IValidationPipe implements PipeTransform<any> {
  constructor() {}
  private getMessage(constraints: any) {
    let message: string | undefined = '';

    const constrainsArray = Object.keys(constraints);

    // For errors, the errors are prioritized in this form required > type validation > structure validation.
    if (
      constrainsArray.find((member) => requiredConstraintKeys.includes(member))
    ) {
      message =
        constraints[
          constrainsArray.find((member) =>
            requiredConstraintKeys.includes(member),
          )!
        ];
    } else if (
      constrainsArray.find((member) => typeConstraintKeys.includes(member))
    ) {
      message =
        constraints[
          constrainsArray.find((member) => typeConstraintKeys.includes(member))!
        ];
    } else if (
      constrainsArray.find((member) => structureConstraintKeys.includes(member))
    ) {
      message =
        constraints[
          constrainsArray.find((member) =>
            structureConstraintKeys.includes(member),
          )!
        ];
    } else {
      message = constraints[constrainsArray[0]];
    }
    return message;
  }

  private structureErrors(errors: ValidationError[]) {
    const structuredErrors: Record<string, any> = {};

    errors.forEach((error) => {
      if (error.children) {
        structuredErrors[error.property] = this.structureErrors(error.children);
      }
      if (error.constraints) {
        structuredErrors[error.property] = this.getMessage(error.constraints);
      }
    });
    return structuredErrors;
  }

  async transform(value: any, { metatype }: ArgumentMetadata, isRoot = true) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {});

    if (errors.length > 0) {
      const structuredErrors = this.structureErrors(errors);

      if (isRoot) {
        const message = Object.entries(structuredErrors)[0]?.[1];

        throw new IBadRequestException({
          data: structuredErrors,
          type: 'ValidationError',
          message,
        });
      } else {
        return { hasError: true, errors: structuredErrors };
      }
    }

    return value;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

export const ParseIntParamPipeHandler = () => {
  throw new IBadRequestException({
    message: 'Validation error',
    data: {
      id: 'ID param be a valid integer.',
    },
  });
};
