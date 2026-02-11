export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type AuthType = 'public' | 'authenticated' | 'admin';

export interface EndpointBody {
  entityRef: string;
  fields?: string[];
}

export interface Endpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  requestBody?: EndpointBody;
  response?: EndpointBody;
  auth?: AuthType;
  useCaseRef?: string;
}
