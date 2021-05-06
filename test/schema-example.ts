import hydraSpec from "../src/hydra";
import {OAS} from "../src/oas";

const accountServiceSpec: OAS = {
  openapi: '3.0.0',
  info: {
    title: 'Account Service API',
    version: '1.0',
  },
  paths: {
    '/account/{accountId}': {
      get: {
        parameters: [
          { in: "path", required: true, name: 'accountId', schema: { type: 'string'}}
        ],
        responses: { '200': { '$ref': '#/components/responses/AccountSuccess' }},
      },
      patch: {
        parameters: [
          { in: "path", required: true, name: 'accountId', schema: { type: 'string'}}
        ],
        responses: { '200': { '$ref': '#/components/responses/AccountSuccess' }}
      },
      delete: {
        parameters: [
          { in: "path", required: true, name: 'accountId', schema: { type: 'string'}}
        ],
        responses: { '501': { '$ref': '#/components/responses/NotBuiltYet' } }
      }
    },
    '/account/status': {
      get: {responses: { '501': { '$ref': '#/components/responses/NotBuiltYet' } } },
      post: {responses: { '501': { '$ref': '#/components/responses/NotBuiltYet' } } }
    }
  },
  components: {
    responses: {
      'NotBuiltYet': {
        description: 'Not Built Yet',
        content: {
          'application/text': {
            schema: { type: 'string' }
          }
        }
      },
      'AccountSuccess': {
        description: '',
        content: {
          'application/json': {
            schema: {
              allOf: [{'$ref': '#/components/schemas/HydraResource'}, {'$ref': '#/components/schemas/Account'}]
            }
          }
        }
      }
    },
    schemas: {
      ...hydraSpec,
      Account: {
        type: 'object',
        title: 'Account',
        additionalProperties: false,
        required: ['awsAccountId', 'created', 'alias'],
        properties: {
          awsAccountId: {type: 'string'},
          created: {type: 'string'},
          alias: {type: 'string'}
        }
      }
    }
  }
};

export default accountServiceSpec;
