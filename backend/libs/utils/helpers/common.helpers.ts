import { Injectable } from '@nestjs/common';
import {
  isArray,
  IsDateString,
  IsEmail,
  isJSON,
  isJWT,
  IsNotEmpty,
  isObject,
  IsPhoneNumber,
  isString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { decode } from 'jsonwebtoken';
import * as moment from 'moment';
import { v4 } from 'uuid';
import { createHmac } from 'crypto';
import {
  camelCase,
  capitalize,
  filter,
  isBoolean,
  isNull,
  isUndefined,
  keys,
  omit,
} from 'lodash';
import { apply } from 'json-logic-js';
import {
  ConfigurableForm,
  IPaginatedRes,
  IRequest,
} from './types/common.helpers.types';

export const getValidatorFromConfigurableForms = (
  form: ConfigurableForm,
  data: any,
) => {
  const { pages } = form;

  class ValidationSchema {}

  let hasProperties = false;

  pages.forEach((page) => {
    const { fields } = page;

    if (fields.length > 0) {
      hasProperties = true;
    }

    fields
      .filter((f) => !f.type.includes('info'))
      .forEach((field) => {
        const { validation, id, type } = field;

        Object.keys(validation).forEach((key) => {
          switch (key) {
            case 'type':
              switch (type) {
                case 'date':
                  IsDateString()(ValidationSchema.prototype, id);
                  break;
                case 'email':
                  IsEmail()(ValidationSchema.prototype, id);
                  break;
                case 'uuid':
                  IsUUID('all')(ValidationSchema.prototype, id);
                  break;
                case 'phone':
                  IsPhoneNumber(undefined, {
                    message: 'Must be a valid phone number.',
                  })(ValidationSchema.prototype, id);
                  break;
              }
              break;
            case 'required':
              if (field.conditions) {
                const conditionsMet = field.conditions.every(
                  (condition) => data[condition.field] === condition.value,
                );

                if (conditionsMet) IsNotEmpty()(ValidationSchema.prototype, id);
              } else {
                IsNotEmpty()(ValidationSchema.prototype, id);
              }
              break;
            case 'minimum_length':
              MinLength(validation[key])(ValidationSchema.prototype, id);
              break;
            case 'maximum_length':
              MaxLength(validation[key])(ValidationSchema.prototype, id);
              break;
          }
        });
      });
  });

  return hasProperties ? ValidationSchema : null;
};

export function convertKeysToCamelCase(obj: any) {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = camelCase(key);
      acc[camelKey] = convertKeysToCamelCase(obj[key]); // Recursively apply conversion
      return acc;
    }, {});
  }
  return obj; // Return primitives as is
}

export const processEntityResponseSchema = (schema: any, payload: any) => {
  const result = Object.keys(schema).reduce((acc, key) => {
    if (isObject(schema[key]) && !isArray(schema[key])) {
      if ((schema[key] as any).rule) {
        acc[key] = apply((schema[key] as any).rule, payload);
      } else {
        acc[key] = processEntityResponseSchema(schema[key], payload);
      }
    }

    if (isString(schema[key]) && !isJSON(schema[key])) {
      acc[key] = schema[key];
    }

    if (isObject(acc[key]) && Object.values(acc[key]).every((v) => !v))
      acc[key] = null;
    return acc;
  }, {}) as any;

  return result;
};

export const objectToMap = (obj: any) => {
  if (!obj) return obj;
  const map = new Map();
  Object.entries(obj).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      map.set(
        key,
        value.map((item) =>
          typeof item === 'object' && item !== null ? objectToMap(item) : item,
        ),
      ); // Convert array elements to maps if they are objects
    } else if (typeof value === 'object' && value !== null) {
      map.set(key, objectToMap(value)); // Recursively convert nested object to Map
    } else {
      map.set(key, value);
    }
  });
  return map;
};

@Injectable()
export class CommonHelpers {
  /**
   *
   * @param length The length of the numeric code you wish to generate
   */
  static generateRandomCode(length: number) {
    return Math.floor(
      1 * 10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1),
    )
      .toString()
      .padStart(length, '0');
  }

  /**
   *
   * @param s Number of seconds to sleep for
   * @returns
   */
  static sleep(s = 1000) {
    return new Promise((resolve) => setTimeout(resolve, s * 1000));
  }

  static getFriendlyDuration(minutes: number) {
    const MINUTES_IN_HOUR = 60;
    const MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;
    const MINUTES_IN_WEEK = 7 * MINUTES_IN_DAY;
    const MINUTES_IN_MONTH = 30 * MINUTES_IN_DAY; // Approximate month length
    const MINUTES_IN_YEAR = 365 * MINUTES_IN_DAY; // Approximate year length

    const years = Math.floor(minutes / MINUTES_IN_YEAR);
    const months = Math.floor((minutes % MINUTES_IN_YEAR) / MINUTES_IN_MONTH);
    const weeks = Math.floor((minutes % MINUTES_IN_MONTH) / MINUTES_IN_WEEK);
    const days = Math.floor((minutes % MINUTES_IN_WEEK) / MINUTES_IN_DAY);
    const hours = Math.floor((minutes % MINUTES_IN_DAY) / MINUTES_IN_HOUR);
    const mins = minutes % MINUTES_IN_HOUR;

    const result = [];

    if (years > 0) result.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) result.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (weeks > 0) result.push(`${weeks} week${weeks !== 1 ? 's' : ''}`);
    if (days > 0) result.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) result.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (mins > 0 || result.length === 0) {
      result.push(`${mins} minute${mins !== 1 ? 's' : ''}`);
    }

    return result.join(', ');
  }

  static generateReference(length = 10) {
    return `${v4()
      .replace(/-/gi, '')
      .slice(1, length + 1)}`;
  }

  static generateRandomReference() {
    return `#${v4().replace(/-/gi, '')}`;
  }

  static generateRandomCharacters(length) {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomCode = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      randomCode += charset[randomIndex];
    }
    return randomCode;
  }

  /**
   *
   * @param token The JWT from which you wanna retrieve the TTL
   * @returns The TTL in milliseconds as gotten from the JWT. If the JWT is invalid or expired a null value is returned
   */
  static getTTLFromJWT(token: string) {
    if (!isJWT(token)) {
      return null;
    }

    const { exp } = decode(token) as { exp: number };

    return CommonHelpers.getTTLfromDate(new Date(exp * 1000));
  }

  static getJWTExpiryMoment(token: string) {
    if (!isJWT(token)) {
      return null;
    }

    const { exp } = decode(token) as { exp: number };

    return moment(exp * 1000);
  }

  /**
   *
   * @param date The date from which you wanna retrieve the TTL
   * @returns The TTL in milliseconds as gotten from the date. If the date is past, a null value is returned
   */
  static getTTLfromDate(date: Date) {
    const ttlInMilliseconds = moment(date).diff(moment(), 'milliseconds');
    return ttlInMilliseconds > 0 ? ttlInMilliseconds : null;
  }

  /**
   *
   * @param data
   * @param total
   * @param perPage
   * @param pageNumber
   * @returns
   */
  static paginate = (
    total: number,
    limit: number,
    page: number,
  ): IPaginatedRes => {
    return {
      pageNumber: page,
      pageSize: limit,
      totalNumberOfPages: Math.ceil(total / limit),
      totalNumberOfRecords: total,
    };
  };

  static generateRandomString(
    length = 10,
    options: {
      numbers: boolean;
      uppercase: boolean;
      symbols: boolean;
    } = { numbers: true, uppercase: true, symbols: true },
  ) {
    const { numbers, symbols, uppercase } = options;

    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numericChars = '0123456789';
    const specialChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    const allCharacters =
      uppercaseChars + lowercaseChars + numericChars + specialChars;
    let password = '';

    // Ensure the password has at least one character of each type
    if (uppercase)
      password +=
        uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];

    password +=
      lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];

    if (numbers)
      password += numericChars[Math.floor(Math.random() * numericChars.length)];

    if (symbols)
      password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the remaining length with random characters from all types
    for (let i = 4; i < length; i++) {
      password +=
        allCharacters[Math.floor(Math.random() * allCharacters.length)];
    }

    // Shuffle the characters to avoid predictable pattern
    password = password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    return password;
  }

  static getClientRedirectBaseUrl(
    path: string,
    req: IRequest<any>,
    params: Record<string, string>,
  ) {
    let url: string;
    const apiHost = `${req.protocol}://${req.get('host')}`;

    const queryArr = [];

    Object.keys(params).forEach((key) => {
      queryArr.push(`${key}=${params[key]}`);
    });

    const query = queryArr.join('&');

    if (req.headers.origin) {
      url = `${req.headers.origin}${path || ''}${query ? '?' + query : ''}`;
    } else {
      url = `${apiHost}${path || ''}${query ? '?' + query : ''}`;
    }

    return url;
  }

  static sha512(text: string) {
    const hash = createHmac('sha512', process.env.HASH_KEY ?? 'hash_key');
    const data = hash.update(text, 'utf-8');
    return data.digest('hex');
  }

  static omitNullishValues: <T extends object>(obj: T) => Partial<T> = (
    obj,
  ) => {
    return omit(
      obj,
      filter(
        keys(obj),
        (key) =>
          isUndefined(obj[key]) ||
          isNull(obj[key]) ||
          (!isBoolean(obj[key]) && !obj[key]),
      ),
    );
  };

  static convertCamelCaseToTitleCase(text: string) {
    const result = text.replace(/([A-Z])/g, ' $1');
    const finalResult = result.charAt(0).toUpperCase() + result.slice(1);

    return finalResult;
  }

  static convertSnakeCaseToTitleCase(text: string) {
    return text
      .split('_')
      .map((el) => capitalize(el))
      .join(' ');
  }

  static objectToMap(obj: any) {
    if (!obj) return obj;
    const map = new Map();
    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        map.set(
          key,
          value.map((item) =>
            typeof item === 'object' && item !== null
              ? this.objectToMap(item)
              : item,
          ),
        ); // Convert array elements to maps if they are objects
      } else if (typeof value === 'object' && value !== null) {
        map.set(key, this.objectToMap(value)); // Recursively convert nested object to Map
      } else {
        map.set(key, value);
      }
    });
    return map;
  }

  // Function to convert JSON object to hexadecimal string
  static jsonToHex(jsonObj: any) {
    const jsonString = JSON.stringify(jsonObj);
    let hexString = '';
    for (let i = 0; i < jsonString.length; i++) {
      const hex = jsonString.charCodeAt(i).toString(16);
      hexString += ('00' + hex).slice(-2); // Pad each hex value with leading zero if necessary
    }
    return hexString;
  }

  // Function to convert hexadecimal string to JSON object
  static hexToJson(hexString) {
    let jsonString = '';
    for (let i = 0; i < hexString.length; i += 2) {
      const byte = parseInt(hexString.substr(i, 2), 16);
      jsonString += String.fromCharCode(byte);
    }
    return JSON.parse(jsonString);
  }

  static isEmpty(value: string | number | object) {
    if (value === null) {
      return true;
    } else if (typeof value !== 'number' && value === '') {
      return true;
    } else if (typeof value === 'undefined' || value === undefined) {
      return true;
    } else if (
      value !== null &&
      typeof value === 'object' &&
      !Object.keys(value).length
    ) {
      return true;
    } else {
      return false;
    }
  }
}
