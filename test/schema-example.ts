import { OASServer, OpenApiSpecificationBuilder, ZodSchemaBuilder } from "../src";
import * as model from './model';

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

const schemas = ZodSchemaBuilder.create()
  .add("Chicken", model.Chicken)
  .add("ChickenCollection", model.ChickenCollection)
  .add("ChickenCreateRequest", model.ChickenCreateRequest)
  .add("OtherRequest", model.OtherRequest)
  .build()

export default OpenApiSpecificationBuilder.create(schemas, { title: 'Chicken Store API', version: '1.0.0'})
  .add('servers', oas => servers)
  .withAWSCognitoSecurityScheme('Cognito', '${ENDPOINT}', '${CLIENT}')
  .withAWSLambdaApiGatewayIntegration('apiHandler', '${API_HANDLER}')
  .withPath('other', (path, oas) =>
    path.get('getOther', {
      'x-amazon-apigateway-integration': oas.awsLambdaApiGatewayIntegration.apiHandler,
      security: [oas.securitySchemes.Cognito()],
      responses: {
        200: oas.jsonResponse('OtherRequest')
      }
    }
    ))
  .withPath('chicken', (path, oas) =>
    path.get('getChickens', {
        'x-amazon-apigateway-integration': oas.awsLambdaApiGatewayIntegration.apiHandler,
        security: [oas.securitySchemes.Cognito()],
        responses: {
          200: oas.jsonResponse('ChickenCollection')
        }
      }
    ).resource('chickenId', path =>
      path.put('upsertChicken', {
        'x-amazon-apigateway-integration': oas.awsLambdaApiGatewayIntegration.apiHandler,
        security: [oas.securitySchemes.Cognito()],
        requestBody: { content: oas.jsonContent('Chicken') },
        responses: {
          200: oas.jsonResponse('ChickenCollection')
        }
      })
  )
  ).build();



//  OpenApiSpecificationBuilder
// .create(schemas, { title: 'Chicken Store API', version: '1.0.0'})
// .add('servers', () => servers)
//     .defaultResponses(o => ({
//       200: o.response(o.textContent())
//     }))
// .addComponent('securitySchemes', o => ({ Auth: o.openIdConnectScheme('.well-known/xyz')}))
// .add('paths', o => ({
//   '/chicken': {
//     get: {
//       operationId: 'getChickens',
//       security: [],
//       responses: {
//         200: o.response(o.jsonContent('ChickenCollection'), 'The Flock'),
//       }
//     },
//     post: {
//       operationId: 'createChicken',
//       requestBody: {
//         description: 'A Chicken',
//         content: o.jsonContent('ChickenCreateRequest')
//       },
//       responses: {
//         201: {
//           description: 'The Flock',
//           content: o.jsonContent('ChickenCollection')
//         },
//         400: {description: 'Bad Request', content: o.textContent()}
//       }
//     }
//   },
//   '/chicken/{chickenId}': {
//     get: {
//       operationId: 'getChicken',
//       parameters: [
//           o.path('chickenId'),
//           o.query('someQuery'),
//           o.query('someOtherQuery', false, true)
//       ],
//       responses: {
//         200: {content: o.jsonContent('Chicken'), description: 'The Chicken'},
//       }
//     },
//     put: {
//       operationId: 'updateChicken',
//       parameters: [
//         o.path('chickenId'),
//         o.query('someQuery', true, true)
//       ],
//       requestBody: {
//         description: 'A Chicken',
//         content: o.jsonContent('ChickenCreateRequest')
//       },
//       responses: {
//         200: o.response({...o.jsonContent('Chicken'), ...o.textContent()}, 'The Chicken'),
//         404: o.response( o.textContent(), 'Not Found'),
//       }
//     },
//     delete: {
//       operationId: 'deleteChicken',
//       parameters: [
//           o.path('chickenId'),
//           o.header('X-Encryption-Key')
//       ]
//     },
//   }
// }))
// .build();
