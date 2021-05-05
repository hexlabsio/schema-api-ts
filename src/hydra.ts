import {Schema} from "./schema";

const hydraSpec: {[key: string]: Schema} = {
  'HydraOperation': {
    type: 'object',
    required: ['statusCodes', 'method'],
    properties: {
      method: { type: 'string' },
      expects: { type: 'string' },
      returns: { type: 'string' },
      statusCodes: { type: 'array', items: { type: 'string'} },
    }
  },
  'HydraResource': {
    type: 'object',
    properties: {
      '@id': { type: 'string' },
      '@operation': { type: 'array', items: { $ref: '#/components/schemas/HydraOperation' } }
    }
  },
  'HydraCollection': {
    allOf: [
      { $ref: '#/components/schemas/HydraResource' },
      { type: 'object', properties: { member: { type: 'array', items: { $ref: '#/components/schemas/HydraResource' }}} }
    ]
  }
}

export default hydraSpec;
