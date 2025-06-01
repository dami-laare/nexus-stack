import { Request } from 'express';

export interface IPaginatedRes {
  pageNumber: number;
  pageSize: number;
  totalNumberOfPages: number;
  totalNumberOfRecords: number;
}

export interface IRequest<T = any> extends Request {
  user: T;
  // admin: AdminUser;
  // currentOrganization: Organization;
  // currentRole: Role;
  reqId: string;
  reqIp: string;
  aetherKey?: string;
  userAgent: string;
  // device: UAParser.IResult;
  // currentDevice: Device;
  // consumer: CreateConsumerResponse;
  consumerId: string;
  headers: Request['headers'] & {
    'x-consumer-id': string;
    'x-consumer-username': string;
  };
}

interface ConfigurableFormPageFields {
  id: string;
  name: string;
  type:
    | 'short_text'
    | 'long_text'
    | 'upload'
    | 'select'
    | 'email'
    | 'phone'
    | 'uuid'
    | 'date';
  label: string;
  description: string[];
  options?: {
    label: string;
    value: string;
  }[];
  validation: {
    required: boolean;
    minimum_length: number;
    maximum_length: number;
  };
  conditions?: {
    field: string;
    value: string;
  }[];
}

interface ConfigurableFormPage {
  name: string;
  title: string;
  actions: {
    type: 'submit' | 'reset' | 'back' | 'cancel';
    label: string;
    message: string;
  }[];
  fields: ConfigurableFormPageFields[];
}

export interface ConfigurableForm {
  name?: string;
  description?: string[];
  pages: ConfigurableFormPage[];
}
