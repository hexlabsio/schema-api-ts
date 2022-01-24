# schema-api-ts

Takes an OpenApi 3.0 specification schema and generates Api classes, Model classes, SDKs to call APIs externally and Mocks to mock APIs.
It will also output a simplified definition of the paths and methods in order for you to process separately. 
(We use it to generate API Gateway stacks in kloudformation-ts)

## Features

1. SDK Generation
2. API Generation with Routes using http-api-ts
3. Type Generation
4. Mock API Generation

# Get Started
Here is a simple schema with one endpoint

```typescript
import {OpenApiSpecificationBuilder, SchemaBuilder} from "../src";

const builder = SchemaBuilder.create();

// Defines our model (a Chicken)
const schemas = builder.add('Chicken', s =>
    s.object(
    { identifier: s.string(), type: s.string(), name: s.string()}
    )
).build();

// Make sure to export a default constant of the schema
export default OpenApiSpecificationBuilder
.create(schemas, { title: 'Chicken Store API', version: '1.0.0'})
.add('paths', o => ({
  '/chicken/{chickenId}': {
    get: {
      operationId: 'getChicken',
      parameters: [
          o.path('chickenId'), // Any Path variables must be included here
          o.query('someQuery'), // A query parameter
          o.query('someOtherQuery', false, true) // A multi string query parameter
      ],
      responses: {
        200: o.response('A Chicken', o.jsonContent('Chicken')) // Chicken here can only be one of the defined entries in the schema
      }
    },
  }
}))
.build();
```

# Usage

Run the following command against your schema and you will get a directory named generated with everything you need.

```bash
schema-api-ts generate $(pwd)/schema.ts v=${API_VERSION:-0.1.0}
``` 

Then export as a lambda as follows

```typescript
class MyApi extends ChickenStoreAPI {
    handlers: Partial<ChickenStoreAPIHandlers> = {
        getChicken: async (request, {query, multiQuery, path}) => {
            console.log('Requested chicken with id', path.chickenId);
            const response: Chicken = {type: 'Orpington', name: 'Jimmy', identifier: '1'};
            return {statusCode: 200, body: JSON.stringify(response)}
        }
    };
}

export const handler = async (event: APIGatewayProxyEvent) {
    const handle = new MyApi().routes();
    //Add filtering in here if needed (https://github.com/hexlabsio/http-api-ts)
    return await handle(event);
}
```
