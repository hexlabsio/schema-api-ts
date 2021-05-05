export interface OAS {
  openapi: string;
  info: OASInfo;
  servers?: OASServer[];
  paths: { [path: string]: OASPath | OASRef };
  components?: OASComponents;
  security?: OASSecurity[];
  tags?: OASTag[];
  externalDocs?: OASExternalDocs;
}

export interface OASComponents {
  schemas?: { [key: string]: Schema | OASRef };
  responses?: { [key: string]: OASResponse | OASRef };
  parameters?: { [key: string]: OASParameter | OASRef };
  examples?: { [key: string]: any | OASRef };
  requestBodies?: { [key: string]: OASRequestBody | OASRef };
  headers?: { [key: string]: Omit<OASParameter, 'name' | 'in'> | OASRef };
  securitySchemes?: { [key: string]: any | OASRef };
  links?: { [key: string]: any | OASRef };
  callbacks?: { [key: string]: OASPath | OASRef };
}

export interface OASTag {
  name: string;
  description?: string;
  externalDocs?: OASExternalDocs;
}

export interface OASInfo {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: OASContact;
  license?: OASLicense;
  version: string;
}

export interface OASContact {
  name?: string;
  url?: string;
  email?: string;
}

export interface OASLicense {
  name: string;
  url?: string;
}

export interface OASServer {
  url: string;
  description?: string;
  variables: { [varName: string]: OASServerVariable };
}

export interface OASServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface OASRef {
  $ref: string;
}

export interface OASPath {
  summary?: string;
  description?: string;
  get?: OASOperation;
  put?: OASOperation;
  post?: OASOperation;
  delete?: OASOperation;
  options?: OASOperation;
  head?: OASOperation;
  patch?: OASOperation;
  trace?: OASOperation;
  servers?: OASServer[];
  parameters?: Array<OASParameter | OASRef>;
}

export interface OASOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: OASExternalDocs;
  operationId?: string;
  parameters?: Array<OASParameter | OASRef>;
  requestBody?: OASRequestBody | OASRef;
  responses: { [statusCode: string]: OASResponse | OASRef };
  callbacks?: { [key: string]: OASPath | OASRef };
  deprecated?: boolean;
  security?: OASSecurity[];
  servers?: OASServer[];
}

export interface OASRequestBody {
  description?: string;
  content: { [key: string]: OASMedia };
  required?: boolean;
}

export interface OASResponse {
  description: string;
  headers?: { [key: string]: Omit<OASParameter, 'name' | 'in'> | OASRef };
  content?: { [key: string]: OASMedia };
  links?: { [key: string]: any | OASRef};
}

export interface OASSecurity {
  [name: string]: string[];
}

export interface OASExternalDocs {
  description?: string;
  ur: string;
}

export interface OASParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema | OASRef;
  example?: any;
  examples?: { [key: string]: any };
  content?: { [key: string]: OASMedia };
}

export interface OASMedia {
  schema?: Schema | OASRef;
  example?: any;
  examples?: { [key: string]: any };
  encoding?: { [key: string]: OASEncoding };
}

export interface OASEncoding {
  contentType?: string;
  headers?: {[key: string]: Omit<OASParameter, 'name' | 'in'> | OASRef};
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}


export type Primitive = 'null' | 'boolean' | 'object' |  'array' | 'number' | 'string';

export type Schema = {
  $schema?: string;
  $id?: string;
  type?: Primitive | Primitive[];
  $comment?: string;
  items?: Schema | OASRef;
  additionalProperties?: boolean | Schema  | OASRef;
  required?: string[];
  properties?: { [key: string]: Schema  | OASRef };
  allOf?: Array<Schema | OASRef>;
  anyOf?: Array<Schema | OASRef>;
  oneOf?: Array<Schema | OASRef>;
};
