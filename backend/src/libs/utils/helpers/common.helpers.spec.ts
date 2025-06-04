/* eslint-disable @typescript-eslint/no-var-requires */
import { CommonHelpers } from './common.helpers';
import { isJWT } from 'class-validator';
import { decode } from 'jsonwebtoken';
import * as moment from 'moment';

jest.mock('class-validator');
jest.mock('jsonwebtoken');
jest.mock('uuid');
jest.mock('crypto');

describe('CommonHelpers', () => {
  describe('generateRandomCode', () => {
    it('should generate a random numeric code of specified length', () => {
      const length = 6;
      const code = CommonHelpers.generateRandomCode(length);

      expect(code).toHaveLength(length);
      expect(Number(code)).toBeGreaterThanOrEqual(100000);
      expect(Number(code)).toBeLessThanOrEqual(999999);
    });

    it('should pad with zeros if necessary', () => {
      const length = 4;
      jest.spyOn(Math, 'random').mockReturnValue(0.1);
      const code = CommonHelpers.generateRandomCode(length);

      expect(code).toHaveLength(length);
      expect(code[0]).toBe('0');
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should sleep for specified seconds', async () => {
      const sleepPromise = CommonHelpers.sleep(2);
      jest.advanceTimersByTime(2000);
      await sleepPromise;
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
    });

    it('should default to 1 second if no duration specified', async () => {
      const sleepPromise = CommonHelpers.sleep();
      jest.advanceTimersByTime(1000);
      await sleepPromise;
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    });
  });

  describe('getFriendlyDuration', () => {
    it('should format duration with all units', () => {
      const minutes = 525960; // 1 year, 1 day, 1 hour, 1 minute
      const result = CommonHelpers.getFriendlyDuration(minutes);
      expect(result).toBe('1 year, 1 day, 1 hour, 1 minute');
    });

    it('should handle plural units', () => {
      const minutes = 1051920; // 2 years
      const result = CommonHelpers.getFriendlyDuration(minutes);
      expect(result).toBe('2 years');
    });

    it('should handle zero duration', () => {
      const result = CommonHelpers.getFriendlyDuration(0);
      expect(result).toBe('0 minutes');
    });
  });

  describe('generateReference', () => {
    it('should generate a reference of specified length', () => {
      const length = 8;
      const reference = CommonHelpers.generateReference(length);
      expect(reference).toHaveLength(length);
    });

    it('should default to length of 10 if not specified', () => {
      const reference = CommonHelpers.generateReference();
      expect(reference).toHaveLength(10);
    });
  });

  describe('generateRandomReference', () => {
    it('should generate a reference starting with #', () => {
      const reference = CommonHelpers.generateRandomReference();
      expect(reference).toMatch(/^#[a-f0-9]+$/i);
    });
  });

  describe('generateRandomCharacters', () => {
    it('should generate random characters of specified length', () => {
      const length = 12;
      const result = CommonHelpers.generateRandomCharacters(length);
      expect(result).toHaveLength(length);
      expect(result).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });

  describe('getTTLFromJWT', () => {
    it('should return null for invalid JWT', () => {
      (isJWT as jest.Mock).mockReturnValue(false);
      const result = CommonHelpers.getTTLFromJWT('invalid-token');
      expect(result).toBeNull();
    });

    it('should return TTL in milliseconds for valid JWT', () => {
      (isJWT as jest.Mock).mockReturnValue(true);
      const expTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      (decode as jest.Mock).mockReturnValue({ exp: expTimestamp });

      const result = CommonHelpers.getTTLFromJWT('valid-token');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(3600000); // 1 hour in milliseconds
    });
  });

  describe('getJWTExpiryMoment', () => {
    it('should return null for invalid JWT', () => {
      (isJWT as jest.Mock).mockReturnValue(false);
      const result = CommonHelpers.getJWTExpiryMoment('invalid-token');
      expect(result).toBeNull();
    });

    it('should return moment object for valid JWT', () => {
      (isJWT as jest.Mock).mockReturnValue(true);
      const expTimestamp = Math.floor(Date.now() / 1000) + 3600;
      (decode as jest.Mock).mockReturnValue({ exp: expTimestamp });

      const result = CommonHelpers.getJWTExpiryMoment('valid-token');
      expect(moment.isMoment(result)).toBe(true);
    });
  });

  describe('paginate', () => {
    it('should calculate pagination correctly', () => {
      const total = 100;
      const limit = 10;
      const page = 2;

      const result = CommonHelpers.paginate(total, limit, page);

      expect(result).toEqual({
        total: 100,
        limit: 10,
        page: 2,
        pages: 10,
        offset: 10,
      });
    });

    it('should handle zero total items', () => {
      const result = CommonHelpers.paginate(0, 10, 1);

      expect(result).toEqual({
        total: 0,
        limit: 10,
        page: 1,
        pages: 0,
        offset: 0,
      });
    });
  });

  describe('generateRandomString', () => {
    it('should generate string with default options', () => {
      const result = CommonHelpers.generateRandomString();
      expect(result).toHaveLength(10);
      expect(result).toMatch(/^[A-Za-z0-9!@#$%^&*]+$/);
    });

    it('should respect custom options', () => {
      const result = CommonHelpers.generateRandomString(8, {
        numbers: false,
        uppercase: false,
        symbols: false,
      });
      expect(result).toHaveLength(8);
      expect(result).toMatch(/^[a-z]+$/);
    });
  });

  describe('sha512', () => {
    it('should generate SHA512 hash', () => {
      const text = 'test';
      const mockHash = 'hashed-value';
      const mockUpdate = jest.fn().mockReturnThis();
      const mockDigest = jest.fn().mockReturnValue(mockHash);
      const mockCreateHmac = jest.fn().mockReturnValue({
        update: mockUpdate,
        digest: mockDigest,
      });

      require('crypto').createHmac = mockCreateHmac;

      const result = CommonHelpers.sha512(text);
      expect(result).toBe(mockHash);
    });
  });

  describe('omitNullishValues', () => {
    it('should remove null and undefined values', () => {
      const obj = {
        a: 1,
        b: null,
        c: undefined,
        d: 'test',
      };

      const result = CommonHelpers.omitNullishValues(obj);
      expect(result).toEqual({
        a: 1,
        d: 'test',
      });
    });

    it('should handle nested objects', () => {
      const obj = {
        a: 1,
        b: {
          c: null,
          d: 'test',
        },
      };

      const result = CommonHelpers.omitNullishValues(obj);
      expect(result).toEqual({
        a: 1,
        b: {
          d: 'test',
        },
      });
    });
  });

  describe('convertCamelCaseToTitleCase', () => {
    it('should convert camelCase to Title Case', () => {
      expect(CommonHelpers.convertCamelCaseToTitleCase('camelCase')).toBe(
        'Camel Case',
      );
      expect(CommonHelpers.convertCamelCaseToTitleCase('thisIsATest')).toBe(
        'This Is A Test',
      );
    });
  });

  describe('convertSnakeCaseToTitleCase', () => {
    it('should convert snake_case to Title Case', () => {
      expect(CommonHelpers.convertSnakeCaseToTitleCase('snake_case')).toBe(
        'Snake Case',
      );
      expect(CommonHelpers.convertSnakeCaseToTitleCase('this_is_a_test')).toBe(
        'This Is A Test',
      );
    });
  });

  describe('objectToMap', () => {
    it('should convert object to Map', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
        },
        d: [1, 2, 3],
      };

      const result = CommonHelpers.objectToMap(obj);
      expect(result instanceof Map).toBe(true);
      expect(result.get('a')).toBe(1);
      expect(result.get('b') instanceof Map).toBe(true);
      expect(result.get('b').get('c')).toBe(2);
      expect(Array.isArray(result.get('d'))).toBe(true);
    });

    it('should handle null/undefined input', () => {
      expect(CommonHelpers.objectToMap(null)).toBeNull();
      expect(CommonHelpers.objectToMap(undefined)).toBeUndefined();
    });
  });

  describe('isEmpty', () => {
    it('should correctly identify empty values', () => {
      expect(CommonHelpers.isEmpty('')).toBe(true);
      expect(CommonHelpers.isEmpty(0)).toBe(false);
      expect(CommonHelpers.isEmpty({})).toBe(true);
      expect(CommonHelpers.isEmpty({ a: 1 })).toBe(false);
    });
  });
});
