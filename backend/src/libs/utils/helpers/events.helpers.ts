import { isJSON } from 'class-validator';
import { apply } from 'json-logic-js';
import { isArray, isObject, isString } from 'lodash';
import { BroadcastPayload } from 'src/libs/types/events.types';

export class EventsHelpers {
  static processEventConfigSchema(schema: any, payload: BroadcastPayload) {
    return Object.keys(schema).reduce((acc, key) => {
      if (isObject(schema[key]) && !isArray(schema[key])) {
        if ((schema[key] as any).rule) {
          acc[key] = apply((schema[key] as any).rule, payload);
        } else {
          acc[key] = this.processEventConfigSchema(schema[key], payload);
        }
      }

      if (isString(schema[key]) && !isJSON(schema[key])) {
        acc[key] = schema[key];
      }
      return acc;
    }, {}) as any;
  }
}
