import {JSONSchema} from "json-schema-to-typescript";

export function hydraResource(definition: JSONSchema & {type: 'object'}): JSONSchema {
  return {
    ...definition,
    '@id': { type: 'string' },
    '@operation': { type: 'array', items: hydraOperation() }
  }
}

export function hydraOperation(): JSONSchema {
  return {
    type: 'object',
    required: ['statusCodes', 'method'],
    additionalProperties: false,
    properties: {
      method: { type: 'string' },
      expects: { type: 'string' },
      returns: { type: 'string' },
      statusCodes: { type: 'array', items: { type: 'string'} },
    }
  };
}

export function hydraCollection(title: string, definition: JSONSchema): JSONSchema {
  return hydraResource({
    type: 'object',
    title,
    required: ['member', 'totalItems'],
    additionalProperties: false,
    properties: {
      member: definition,
      totalItems: { type: 'number' }
    }
  })
}

export function hydraPagedCollection(title: string, definition: JSONSchema): JSONSchema {
  return hydraResource({
    type: 'object',
    title,
    required: ['member', 'totalItems'],
    additionalProperties: false,
    properties: {
      member: definition,
      totalItems: { type: 'number' },
      first: { type: 'string' },
      next: { type: 'string' },
      previous: { type: 'string' },
      last: { type: 'string' }
    }
  })
}
