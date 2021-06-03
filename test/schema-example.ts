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
        security: [ {viewAdmin: [], viewWriter: [], viewReader: []}],
        responses: { '200': { '$ref': '#/components/responses/ViewsSuccess' }, '400': { '$ref': '#/components/responses/BadRequest' }},
      },
      post: {
        operationId: 'createView',
        security: [ {viewAdmin: [], viewWriter: []}],
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
    securitySchemes: {
      viewAdmin: {
        type: 'oauth2',
        name: 'View Admin',
        in: 'header',
        scheme: '',
        openIdConnectUrl: '',
        flows: {
          implicit: {
            authorizationUrl: '',
            tokenUrl: '',
            scopes: {
              'admin': 'Full Access',
            }
          }
        }
      },
      viewWriter: {
        type: 'oauth2',
        name: 'View Admin',
        in: 'header',
        scheme: '',
        openIdConnectUrl: '',
        flows: {
          implicit: {
            authorizationUrl: '',
            tokenUrl: '',
            scopes: {
              'admin': 'Full Access',
              'write': 'Create / Update Views',
            }
          }
        }
      },
      viewReader: {
        type: 'oauth2',
        name: 'View Admin',
        in: 'header',
        scheme: '',
        openIdConnectUrl: '',
        flows: {
          implicit: {
            authorizationUrl: '',
            tokenUrl: '',
            scopes: {
              'admin': 'Full Access',
              'write': 'Create / Update Views',
              'read': 'View Views',
            }
          }
        }
      }
    },
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
            schema: {'$ref': '#/components/schemas/ViewCollection'}
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
      ViewResource: {'$ref': '#/components/schemas/View'},
      ViewCollection: {'$ref': '#/components/schemas/ViewResource'},
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
        required: ['credentials', 'awsAccountId'],
        properties: {
          credentials: {type: 'string'},
          awsAccountId: {type: 'string'}
        }
      }
    }
  }
};

export default viewServiceSpec;
