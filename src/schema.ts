import {OASRef} from "./oas";

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
