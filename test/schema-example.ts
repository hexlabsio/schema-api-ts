import {OAS} from '../src/oas';

const viewServiceSpec: OAS = {
  openapi: '3.0.0',
  info: {
    title: 'View Service API',
    version: '1.0',
  },
  paths: {
    '/view': {
      get: {
        operationId: 'getViews',
        responses: { '200': { '$ref': '#/components/responses/ViewsSuccess' }, '400': { '$ref': '#/components/responses/BadRequest' }},
      },
      post: {
        operationId: 'createView',
        parameters: [
          { in: "header", required: true, name: 'X-Encryption-Key', schema: { type: 'string'}}
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {'$ref': '#/components/schemas/CreateView'}
            }
          }
        },
        responses: { '201': { '$ref': '#/components/responses/ViewSuccess' }},
      },
    },
    '/view/{viewId}': {
      get: {
        operationId: 'getView',
        parameters: [
          { in: "path", required: true, name: 'viewId', schema: { type: 'string'}}
        ],
        responses: { '200': { '$ref': '#/components/responses/ViewSuccess' }}
      },
      patch: {
        operationId: 'updateView',
        parameters: [
          { in: "path", required: true, name: 'viewId', schema: { type: 'string'}}
        ],
        requestBody: {
          content: {
            'PatchViewRequest': {
              schema: {'$ref': '#/components/schemas/PatchViewRequest'}
            }
          }
        },
        responses: { '200': { '$ref': '#/components/responses/ViewSuccess' }}
      },
      delete: {
        operationId: 'deleteView',
        parameters: [
          { in: "path", required: true, name: 'viewId', schema: { type: 'string'}}
        ],
        responses: { '200': { '$ref': '#/components/responses/DeleteSuccess' } }
      }
    },
    '/schema': {
      get: {
        responses: {
          '200': {
            description: 'Open API 3 Specification for this Service',
            content: {'application/json': {schema: {type: 'object'}}}
          }
        }
      }
    }
  },
  components: {
    responses: {
      'PatchViewRequest': {
        description: '',
        content: {
          'application/json': {
            schema: {'$ref': '#/components/schemas/PatchView'}
          }
        }
      },
      'ViewsSuccess': {
        description: '',
        content: {
          'application/json': {
            schema: {
              allOf: [{'$ref': '#/components/schemas/HydraCollection'}, { type: 'object', properties: { member: { type: 'array', items: {allOf: [{'$ref': '#/components/schemas/HydraResource'}, {'$ref': '#/components/schemas/View'}]} } } }]
            }
          }
        }
      },
      'BadRequest': {
        description: '',
        content: {
          'application/text': { schema: { type: 'string' } }
        }
      },
      'ViewSuccess': {
        description: '',
        content: {
          'application/json': {
            schema: {'$ref': '#/components/schemas/ViewResource'}
          }
        }
      },
      'DeleteSuccess': {
        description: '',
        content: {
          'application/text': {
            schema: { type: 'string' }
          }
        }
      },
      'SecretSuccess': {
        description: '',
        content: {
          'application/json': {
            schema: {  '$ref': '#/components/schemas/SecretSuccess' }
          }
        }
      },
    },
    schemas: {
      'HydraOperation': {
        title: 'Hydra Operation',
        type: 'object',
        required: ['statusCodes', 'method'],
        additionalProperties: false,
        properties: {
          method: { type: 'string' },
          expects: { type: 'string' },
          returns: { type: 'string' },
          statusCodes: { type: 'array', items: { type: 'string'} },
        }
      },
      'HydraResource': {
        title: 'Hydra Resource',
        type: 'object',
        additionalProperties: false,
        properties: {
          '@id': { type: 'string' },
          '@operation': { type: 'array', items: { $ref: '#/components/schemas/HydraOperation' } }
        }
      },
      'HydraCollection': {
        title: 'Hydra Collection',
        allOf: [
          { $ref: '#/components/schemas/HydraResource' },
          { type: 'object', properties: { member: { type: 'array', items: { $ref: '#/components/schemas/HydraResource' }}} }
        ]
      },
      ViewResource: {
        title: 'ViewResource',
        allOf: [{'$ref': '#/components/schemas/HydraResource'}, {'$ref': '#/components/schemas/View'}]
      },
      CreateView: {
        type: 'object',
        title: 'CreateView',
        additionalProperties: false,
        required: ['name', 'credentials'],
        properties: {
          name: {type: 'string'},
          credentials: {type: 'string'}
        }
      },
      PatchView: {
        type: 'object',
        title: 'PatchView',
        anyOf: [
          { type: 'object', required: ['name'], additionalProperties: false, properties: { name: {type: 'string' } } },
          { type: 'object', required: ['credentials'], additionalProperties: false, properties: { credentials: {type: 'string' } } },
          { type: 'object', required: ['name', 'credentials'], additionalProperties: false, properties: { credentials: {type: 'string' }, name: {type: 'string' }  } },
        ]
      },
      View: {
        type: 'object',
        title: 'View',
        additionalProperties: false,
        required: ['viewId', 'viewName', 'awsAccountId'],
        properties: {
          viewId: {type: 'string'},
          viewName: {type: 'string'},
          awsAccountId: {type: 'string'}
        }
      },
      SecretSuccess: {
        type: 'object',
        title: 'SecretSuccess',
        additionalProperties: false,
        required: ['credentials'],
        properties: {
          credentials: {type: 'string'}
        }
      }
    }
  }
};

export default viewServiceSpec;
