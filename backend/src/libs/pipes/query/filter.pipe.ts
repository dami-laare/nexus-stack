import { PipeTransform } from '@nestjs/common';
import {
  isBooleanString,
  isDateString,
  isNumberString,
  isObject,
  isString,
} from 'class-validator';
import { flattenDeep, isArray } from 'lodash';
import {
  Between,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  ILike,
  In,
  Raw,
  FindOperator,
  Equal,
} from 'typeorm';

export enum ValueTypesV2 {
  DATE = 'date',
  STRING = 'string',
  STRING_ARRAY = 'string_array',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  STRING_LIKE = 'string-like',
}

export enum FilterRules {
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUALS = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUALS = 'lte',
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  LIKE = 'like',
  IN = 'in',
  NOT_IN = 'nin',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull',
}

export enum LogicalOperators {
  AND = 'AND',
  OR = 'OR',
}

export interface AllowedFieldOptionsV2 {
  key: string;
  mapsTo?: string[];
  valueType: ValueTypesV2;
  allowedValues?: any[];
}

export class FilterPipeV2 implements PipeTransform<any, any> {
  constructor(private readonly allowedFields: AllowedFieldOptionsV2[]) {}

  private validateValueType(
    value: any,
    valueType: ValueTypesV2,
    returnParsedValue = false,
  ) {
    if (value === null || value === undefined) {
      return returnParsedValue ? null : true;
    }

    switch (valueType) {
      case ValueTypesV2.STRING:
      case ValueTypesV2.STRING_LIKE:
        return returnParsedValue ? value : isString(value);
      case ValueTypesV2.NUMBER:
        return returnParsedValue ? Number(value) : isNumberString(value);
      case ValueTypesV2.BOOLEAN:
        return returnParsedValue ? value === 'true' : isBooleanString(value);
      case ValueTypesV2.DATE:
        return returnParsedValue ? new Date(value) : isDateString(value);
      case ValueTypesV2.STRING_ARRAY:
        if (isArray(value)) {
          return returnParsedValue ? value : true;
        }
        return returnParsedValue ? value.split(',') : isString(value);
      default:
        return false;
    }
  }

  private generateOperator(
    rule: string,
    value: any,
    valueType: ValueTypesV2,
  ): FindOperator<any> | any {
    const parsedValue = this.validateValueType(value, valueType, true);

    switch (rule) {
      case FilterRules.EQUALS:
        return parsedValue;
      case FilterRules.NOT_EQUALS:
        return Raw((alias) => `${alias} != :value`, { value: parsedValue });
      case FilterRules.GREATER_THAN:
        return MoreThan(parsedValue);
      case FilterRules.GREATER_THAN_OR_EQUALS:
        return MoreThanOrEqual(parsedValue);
      case FilterRules.LESS_THAN:
        return LessThan(parsedValue);
      case FilterRules.LESS_THAN_OR_EQUALS:
        return LessThanOrEqual(parsedValue);
      case FilterRules.LIKE:
        return ILike(`%${parsedValue}%`);
      case FilterRules.IN:
        const inValues = isArray(parsedValue) ? parsedValue : [parsedValue];
        return In(inValues);
      case FilterRules.NOT_IN:
        const notInValues = isArray(parsedValue) ? parsedValue : [parsedValue];
        return Raw((alias) => `${alias} NOT IN (:...values)`, {
          values: notInValues,
        });
      case FilterRules.IS_NULL:
        return Raw((alias) => `${alias} IS NULL`);
      case FilterRules.IS_NOT_NULL:
        return Raw((alias) => `${alias} IS NOT NULL`);
      default:
        return parsedValue;
    }
  }

  private processSimpleCondition(
    key: string,
    condition: any,
    valueType: ValueTypesV2,
  ): Record<string, any> {
    // Handle simple value assignment
    if (!isObject(condition) || condition === null) {
      const value = this.validateValueType(condition, valueType, true);

      let preparedValue: any;

      if (valueType === ValueTypesV2.STRING_LIKE)
        preparedValue = ILike(`%${value}%`);
      else if (
        valueType === ValueTypesV2.STRING_ARRAY &&
        typeof value === 'string'
      )
        preparedValue = In(value.split(','));
      else preparedValue = Equal(value);

      return { [key]: preparedValue };
    }

    // Handle operator-based conditions
    const operators = Object.keys(condition);
    if (operators.length === 0) {
      return {};
    }

    // Special case for between
    if (
      operators.includes(FilterRules.GREATER_THAN_OR_EQUALS) &&
      operators.includes(FilterRules.LESS_THAN_OR_EQUALS)
    ) {
      return {
        [key]: Between(
          this.validateValueType(
            condition[FilterRules.GREATER_THAN_OR_EQUALS],
            valueType,
            true,
          ),
          this.validateValueType(
            condition[FilterRules.LESS_THAN_OR_EQUALS],
            valueType,
            true,
          ),
        ),
      };
    }

    // Handle single operator
    if (operators.length === 1) {
      const operator = operators[0];
      return {
        [key]: this.generateOperator(operator, condition[operator], valueType),
      };
    }

    // For multiple conditions on a single field, we'll need to create a more complex where clause
    // in the controller using the Raw operator. This is a limitation of TypeORM.
    return {
      [key]: Raw(
        (alias) => {
          const queryArr = [];
          operators.forEach((op, index) => {
            // Build appropriate condition based on operator
            let iCondition = '';
            switch (op) {
              case FilterRules.GREATER_THAN:
                iCondition = `${alias} > :gt${index}`;
                break;
              case FilterRules.GREATER_THAN_OR_EQUALS:
                iCondition = `${alias} >= :gte${index}`;
                break;
              case FilterRules.LESS_THAN:
                iCondition = `${alias} < :lt${index}`;
                break;
              case FilterRules.LESS_THAN_OR_EQUALS:
                iCondition = `${alias} <= :lte${index}`;
                break;
              // Add other operators as needed
            }

            if (iCondition) queryArr.push(iCondition);
          });

          return queryArr.join(' AND ');
        },
        operators.reduce((params, op, index) => {
          const parsedValue = this.validateValueType(
            condition[op],
            valueType,
            true,
          );
          params[`${op}${index}`] = parsedValue;
          return params;
        }, {}),
      ),
    };
  }

  private findAllowedField(key: string): AllowedFieldOptionsV2 | null {
    const flatAllowedFields = flattenDeep(this.allowedFields).filter(
      (field) => !isArray(field),
    ) as AllowedFieldOptionsV2[];

    return flatAllowedFields.find((field) => field.key === key) || null;
  }

  private checkAllowedValues(
    value: string,
    fieldConfig: AllowedFieldOptionsV2,
  ): boolean {
    if (
      Array.isArray(fieldConfig.allowedValues) &&
      fieldConfig.allowedValues.length > 0
    ) {
      if (fieldConfig.valueType === ValueTypesV2.STRING_ARRAY) {
        return value
          .split(',')
          .every((val) => fieldConfig.allowedValues.includes(val));
      }
      return fieldConfig.allowedValues.includes(value);
    }

    return true;
  }

  private processLogicalGroup(
    group: any,
    operator: LogicalOperators,
  ): any[] | Record<string, any> {
    if (!isArray(group)) {
      return {};
    }

    const processedConditions = group
      .map((condition) => this.processFilter(condition))
      .filter(Boolean);

    if (processedConditions.length === 0) {
      return {};
    }

    if (processedConditions.length === 1) {
      return processedConditions[0];
    }

    // TypeORM handles AND differently from OR
    if (operator === LogicalOperators.AND) {
      // For AND, we can merge all conditions into a single object
      return processedConditions.reduce((result, condition) => {
        return { ...result, ...condition };
      }, {});
    } else {
      // For OR, we return an array of conditions
      return processedConditions;
    }
  }

  private processFilter(filter: any): Record<string, any> | any[] {
    if (!filter || typeof filter !== 'object') {
      return {};
    }

    // Check for logical operators
    if ('AND' in filter) {
      return this.processLogicalGroup(filter.AND, LogicalOperators.AND);
    }

    if ('OR' in filter) {
      return this.processLogicalGroup(filter.OR, LogicalOperators.OR);
    }

    // Process field conditions
    const result: Record<string, any> = {};

    for (const key of Object.keys(filter)) {
      const allowedField = this.findAllowedField(key);

      if (!allowedField) {
        continue;
      }

      const condition = filter[key];

      const allowedValue = this.checkAllowedValues(condition, allowedField);

      if (!allowedValue) {
        continue;
      }

      const valueType = allowedField.valueType;

      // Handle field mapping
      if (allowedField.mapsTo && allowedField.mapsTo.length > 0) {
        for (const mappedField of allowedField.mapsTo) {
          const processedCondition = this.processSimpleCondition(
            key,
            condition,
            valueType,
          );

          // Set the processed condition to the mapped field path
          const fieldParts = mappedField.split('.');
          let current = result;

          for (let i = 0; i < fieldParts.length - 1; i++) {
            const part = fieldParts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }

          current[fieldParts[fieldParts.length - 1]] = processedCondition[key];
        }
      } else {
        const processedCondition = this.processSimpleCondition(
          key,
          condition,
          valueType,
        );
        Object.assign(result, processedCondition);
      }
    }

    return result;
  }

  transform(query: any) {
    if (!query.filter) {
      return;
    }

    try {
      let filter = query.filter;

      // If filter is a string, try to parse it as JSON
      if (typeof filter === 'string') {
        try {
          filter = JSON.parse(filter);
        } catch (e) {
          // If parsing fails, keep it as is
        }
      }

      // Process the filter
      const processedFilter = this.processFilter(filter);

      // Handle OR conditions which need to be formatted as an array for TypeORM
      if (isArray(processedFilter)) {
        return processedFilter;
      } else {
        return [processedFilter];
      }
    } catch (error) {
      console.error('Error processing filter:', error);
      return;
    }
  }
}
