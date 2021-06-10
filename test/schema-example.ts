import {OASServer} from "../src/oas";
import {OpenApiSpecificationBuilder, SchemaBuilder} from "../src/schema-type";

const servers: OASServer[] = [
    {
      url: 'https://api.{environment}.klouds.io/{basePath}',
      variables: {
        environment: {
          default: 'dev'
        },
        basePath: {
          default: 'views'
        }
      }
    },
    {
      url: 'https://api.klouds.io/{basePath}',
      variables: {
        environment: {
          default: 'prod'
        },
        basePath: {
          default: 'views'
        }
      }
    },
    {
      url: 'http://localhost:{port}',
      variables: {
        environment: {
          default: 'local'
        },
        port: {
          default: '3000'
        }
      }
    },
  ];

const schemas = SchemaBuilder.create()
.add('CreateView', s => s.object({name: s.string(), credentials: s.string()}));

const testServiceSpec = OpenApiSpecificationBuilder.create(schemas.schemaParent, { version: '1.0.0', title: 'Test Service' })
.add('servers', () => servers)
.add('paths', o => ({
  '/views': { get: { security: [{OAuth: ['read', 'write', 'admin']}], responses: o.response(200, 'Success', o.jsonContent('CreateView', {name: 'test', credentials: 'creds'}))}}
}))
.addComponent('securitySchemes', () => ({ OAuth: { type: 'oauth', flows: { authorizationCode: { authorizationUrl: '', scopes: { read: 'Read', write: 'Write', admin: 'Admin' }}} }}))
.build();

console.log(JSON.stringify(testServiceSpec, null, 2))

export default testServiceSpec;
