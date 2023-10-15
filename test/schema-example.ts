import {OpenApiSpecificationBuilder, SchemaBuilder, OASServer} from "../dist";

const builder = SchemaBuilder.create();

const servers: OASServer[] = [
  {
    url: 'https://api.{environment}.xyz.io/{basePath}',
    variables: { environment: { default: 'dev' },  basePath: { default: 'views' } }
  },
  {
    url: 'https://api.xyz.io/{basePath}',
    variables: { environment: { default: 'prod' },  basePath: { default: 'views' } }
  },
  {
    url: 'http://localhost:{port}', variables: {  environment: { default: 'local' }, port: { default: '3000' } }
  },
];

const schemas = builder.add('Chicken', s => s.object({
  identifier: s.string(),
  type: s.string(),
  name: s.string()
}))
.add('ChickenCollection', s => s.array(s.reference('Chicken')))
.add('Schema', s => s.object(undefined, undefined, true))
.add('ChickenCreateRequest', s => s.object({
  type: s.string(),
  name: s.string()
}))
    .add('ChickenCreateRequest2', s => s.object({}, {
      type: s.string(),
      name: s.string()
    })).build();

export default OpenApiSpecificationBuilder
.create(schemas, { title: 'Chicken Store API', version: '1.0.0'})
.add('servers', () => servers)
.addComponent('securitySchemes', o => ({ Auth: o.openIdConnectScheme('.well-known/xyz')}))
.add('paths', o => ({
  '/chicken': {
    get: {
      security: [{Auth: ['read', 'write', 'admin']}],
      operationId: 'getChickens',
      responses: {
        200: o.response('The Flock', o.jsonContent('ChickenCollection')),
      }
    },
    post: {
      operationId: 'createChicken',
      requestBody: {
        description: 'A Chicken',
        content: o.jsonContent('ChickenCreateRequest')
      },
      responses: {
        201: {
          description: 'The Flock',
          content: o.jsonContent('ChickenCollection')
        },
        400: {description: 'Bad Request', content: o.textContent()}
      }
    }
  },
  '/chicken/{chickenId}': {
    get: {
      operationId: 'getChicken',
      parameters: [
          o.path('chickenId'),
          o.query('someQuery'),
          o.query('someOtherQuery', false, true)
      ],
      responses: {
        200: {description: 'The Chicken', content: o.jsonContent('Chicken')},
      }
    },
    put: {
      operationId: 'updateChicken',
      parameters: [
        o.path('chickenId'),
        o.query('someQuery', true, true)
      ],
      requestBody: {
        description: 'A Chicken',
        content: o.jsonContent('ChickenCreateRequest')
      },
      responses: {
        200: o.response('The Chicken', {...o.jsonContent('Chicken'), ...o.textContent()}, ['Location']),
        404: o.response('Not Found', o.textContent()),
      }
    },
    delete: {
      operationId: 'deleteChicken',
      parameters: [
          o.path('chickenId'),
          o.header('X-Encryption-Key')
      ],
      responses: {
        200: {description: 'Success', content: o.textContent('Deleted')},
      }
    },
  },
  '/schema': {
    get: { responses: { 200: {description:'Schema', content: o.jsonContent('Schema') } } }
  }
}))
.build();
