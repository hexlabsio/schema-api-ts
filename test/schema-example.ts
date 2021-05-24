import {OAS} from '../src/oas';

const keyServiceSpec: OAS = {
  openapi: '3.0.0',
  info: {
    title: 'User Service API',
    version: '1.0',
  },
  paths: {
    '/grant': {
      post: {
        requestBody: {
          content: {
            'application/json': { schema: { '$ref': '#/components/schemas/ViewAccess'}}
          }
        },
        responses: { '201': { '$ref': '#/components/responses/Success' }},
      }
    },
    '/user/{userId}': {
      get: {
        parameters: [
          { in: "path", required: true, name: 'userId', schema: { type: 'string'}}
        ],
        responses: { '200': { '$ref': '#/components/responses/ViewAccessList' }},
      }
    },
    '/view/{viewId}': {
      get: {
        parameters: [
          { in: "path", required: true, name: 'viewId', schema: { type: 'string'}}
        ],
        responses: { '200': { '$ref': '#/components/responses/ViewAccessList' }},
      },
      patch: {
        parameters: [
          { in: "path", required: true, name: 'viewId', schema: { type: 'string'}}
        ],
        requestBody: {
          content: {
            'application/json': { schema: { '$ref': '#/components/schemas/ViewAccessUpdate' } }
          }
        },
        responses: { '200': { '$ref': '#/components/responses/Success' }},
      }
    },
    '/revoke': {
      post: {
        requestBody: {
          content: {
            'application/json': { schema: { '$ref': '#/components/schemas/RevokeAccess'}}
          }
        },
        responses: { '200': { '$ref': '#/components/responses/Success' }},
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
      'Success': {
        description: '',
        content: {
          'application/text': {schema: {type: 'string'}}
        }
      },
      'ViewAccessList': {
        description: '',
        content: {
          'application/json': {schema: {type: 'array', items: { '$ref': '#/components/schemas/ViewAccess'}}}
        }
      },
    },
    schemas: {
      ViewAccess: {
        type: 'object',
        title: 'ViewAccess',
        additionalProperties: false,
        required: ['viewId', 'user', 'awsAccountId', 'viewName'],
        properties: {
          viewId: {type: 'string'},
          user: {type: 'string'},
          awsAccountId: {type: 'string'},
          viewName: {type: 'string'},
          role: { type: 'string' }
        }
      },
      ViewAccessUpdate: {
        type: 'object',
        title: 'ViewAccessUpdate',
        additionalProperties: false,
        properties: {
          awsAccountId: {type: 'string'},
          viewName: {type: 'string'}
        }
      },
      RevokeAccess: {
        type: 'object',
        title: 'RevokeAccess',
        additionalProperties: false,
        required: ['viewId'],
        properties: {
          viewId: {type: 'string'}
        }
      }
    }
  }
};

export default keyServiceSpec;
