import { EventsHelpers } from './events.helpers';
import { BroadcastPayload } from 'src/libs/types/events.types';
import { apply } from 'json-logic-js';

jest.mock('json-logic-js');

describe('EventsHelpers', () => {
  describe('processEventConfigSchema', () => {
    beforeEach(() => {
      (apply as jest.Mock).mockClear();
    });

    const createMockPayload = (
      data: Partial<BroadcastPayload> = {},
    ): BroadcastPayload => ({
      payload: {
        after: {},
        before: {},
      },
      key: 'test-key',
      name: 'test-event',
      request: {
        ip: '127.0.0.1',
        id: 'test-id',
        ua: 'test-user-agent',
      },
      timestamp: new Date().toISOString(),
      ...data,
    });

    it('should process simple string values', () => {
      const schema = {
        title: 'Test Event',
        description: 'This is a test event',
      };

      const payload = createMockPayload();

      const result = EventsHelpers.processEventConfigSchema(schema, payload);

      expect(result).toEqual({
        title: 'Test Event',
        description: 'This is a test event',
      });
    });

    it('should process nested objects', () => {
      const schema = {
        event: {
          name: 'Test Event',
          details: {
            type: 'notification',
          },
        },
      };

      const payload = createMockPayload();

      const result = EventsHelpers.processEventConfigSchema(schema, payload);

      expect(result).toEqual({
        event: {
          name: 'Test Event',
          details: {
            type: 'notification',
          },
        },
      });
    });

    it('should process rules in schema', () => {
      const schema = {
        message: {
          rule: { if: [{ var: 'payload.after.type' }, 'success', 'error'] },
        },
      };

      const payload = createMockPayload({
        payload: {
          after: { type: true },
          before: {},
        },
      });

      (apply as jest.Mock).mockReturnValue('success');

      const result = EventsHelpers.processEventConfigSchema(schema, payload);

      expect(apply).toHaveBeenCalledWith(
        { if: [{ var: 'payload.after.type' }, 'success', 'error'] },
        payload,
      );
      expect(result).toEqual({
        message: 'success',
      });
    });

    it('should handle mixed schema with rules and static values', () => {
      const schema = {
        title: 'Static Title',
        content: {
          message: {
            rule: {
              if: [
                { var: 'payload.after.isError' },
                'Error occurred',
                'Success',
              ],
            },
          },
          timestamp: 'static-timestamp',
        },
      };

      const payload = createMockPayload({
        payload: {
          after: { isError: false },
          before: {},
        },
      });

      (apply as jest.Mock).mockReturnValue('Success');

      const result = EventsHelpers.processEventConfigSchema(schema, payload);

      expect(apply).toHaveBeenCalledWith(
        {
          if: [{ var: 'payload.after.isError' }, 'Error occurred', 'Success'],
        },
        payload,
      );
      expect(result).toEqual({
        title: 'Static Title',
        content: {
          message: 'Success',
          timestamp: 'static-timestamp',
        },
      });
    });

    it('should ignore JSON strings', () => {
      const schema = {
        data: '{"key": "value"}', // This is a JSON string
        message: 'plain text',
      };

      const payload = createMockPayload();

      const result = EventsHelpers.processEventConfigSchema(schema, payload);

      expect(result).toEqual({
        message: 'plain text',
      });
    });

    it('should handle empty objects', () => {
      const schema = {};
      const payload = createMockPayload();

      const result = EventsHelpers.processEventConfigSchema(schema, payload);

      expect(result).toEqual({});
    });

    it('should handle arrays in schema', () => {
      const schema = {
        items: ['item1', 'item2'],
        config: {
          rules: {
            rule: { var: 'payload.after.type' },
          },
        },
      };

      const payload = createMockPayload({
        payload: {
          after: { type: 'test' },
          before: {},
        },
      });

      (apply as jest.Mock).mockReturnValue('test');

      const result = EventsHelpers.processEventConfigSchema(schema, payload);

      expect(result).toEqual({
        config: {
          rules: 'test',
        },
      });
    });
  });
});
