export interface BroadcastPayload {
  payload: { after: Record<string, any>; before: Record<string, any> };
  key: string;
  name: string;
  request: {
    ip: string;
    id: string;
    ua: string;
  };
  timestamp: string;
}

export enum KAFKA_TOPICS {
  BROADCAST = 'nexus_services_broadcast',
}
