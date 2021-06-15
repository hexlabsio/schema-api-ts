import {OASServer, SchemaBuilder, OpenApiSpecificationBuilder, OASSecurity} from '../src';

const servers: OASServer[] = [
  {
    url: 'https://api.{environment}.klouds.io/{basePath}',
    variables: { environment: { default: 'dev' },  basePath: { default: 'views' } }
  },
  {
    url: 'https://api.klouds.io/{basePath}',
    variables: { environment: { default: 'prod' },  basePath: { default: 'views' } }
  },
  {
    url: 'http://localhost:{port}', variables: {  environment: { default: 'local' }, port: { default: '3001' } }
  },
];
const builder = SchemaBuilder.create();
const role = builder.anyOf(builder.stringWith({const: 'read'} as const), builder.stringWith({const: 'write'} as const), builder.stringWith({const: 'admin'} as const));

export const schemasComponent = builder
.add('HydraOperation', s => s.hydraOperation())
.add('View', s => s.object({viewId: s.string(), viewName: s.string(), awsAccountId: s.string()}, undefined, false))
.add('ViewResource', s => s.hydraResource('View'))
.add('ViewCollection', s => s.hydraCollection('View'))
.add('CreateView', s => s.object({name: s.string(), credentials: s.string()}))
.add('PatchView', s => s.object(undefined, {name: s.string(), credentials: s.string()}))
.add('AccessGrant', s => s.object({name: s.string(), role }))
.add('UpdateAccess', s => s.object(undefined, {users: s.array(s.reference('AccessGrant')), groups:s.array(s.reference('AccessGrant'))}))
.add('SecretSuccess', s => s.object({credentials: s.string(), awsAccountId: s.string()}))
.add('ViewAccess', s => s.object({viewId: s.string(), role }))
.add('ViewAccessSuccess', s => s.array(s.reference('ViewAccess')))
.build();

const securitySchemes = { OAuth: { type: 'oauth', flows: { authorizationCode: { authorizationUrl: '', scopes: { read: 'Read', write: 'Write', admin: 'Admin' }}} }};

const viewIdParameter = { in: "path", required: true, name: 'viewId', schema: builder.string() } as const;
const read: OASSecurity[] = [{OAuth: ['read', 'write', 'admin']}];
const write: OASSecurity[] = [{OAuth: ['write', 'admin']}];
const admin: OASSecurity[] = [{OAuth: ['admin']}];

export const oasBuilder = OpenApiSpecificationBuilder.create(schemasComponent, { title: 'View Service Public Api', version: '1.0' })
.add('servers', () => servers)
.addComponent('securitySchemes', () => securitySchemes)
.addComponent('responses', o => ({
  'BadRequest': {description: 'Bad Request', content: o.textContent('Bad Request')}
}))
.add('paths', o => ({
  '/view': {
    get: {
      operationId: 'getViews',
      security: read,
      responses: {
        200: {description: '', content: o.jsonContent('ViewCollection')},
        400: o.responseReference('BadRequest')
      }
    },
    post: {
      operationId: 'createView',
      security: write,
      parameters: [
        { in: "header", required: true, name: 'X-Encryption-Key', schema: builder.string()}
      ],
      requestBody: { content: o.jsonContent('CreateView') },
      responses: {
        201: {description: '', content: o.jsonContent('ViewResource')}
      }
    }
  },
  '/view/{viewId}': {
    get: {
      operationId: 'getView',
      security: read,
      parameters: [viewIdParameter],
      responses: {
        200: {description: '', content: o.jsonContent('ViewResource')}
      }
    },
    patch: {
      operationId: 'updateView',
      security: write,
      parameters: [viewIdParameter],
      requestBody: { content: o.jsonContent('PatchView') },
      responses: {
        200: {description: '', content: o.jsonContent('ViewResource')}
      }
    },
    delete: {
      operationId: 'deleteView',
      security: admin,
      parameters: [viewIdParameter],
      responses: {
        200: {description: '', content: o.textContent('Deleted')}
      }
    },
  },
  '/view/{viewId}/access': {
    post: {
      operationId: 'updateAccess',
      security: write,
      parameters: [viewIdParameter],
      responses: {
        200: {description: '', content: o.jsonContent('UpdateAccess')},
        403: {description: '', content: o.textContent('Access Denied')}
      }
    }
  },
  '/schema': {
    get: {
      security: read,
      responses: {
        200: {description: '', content: { 'application/json': { schema: builder.object()}}}}
    }
  },
}))
export default oasBuilder.build();
