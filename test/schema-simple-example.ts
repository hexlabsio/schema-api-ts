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
        200: o.response(o.jsonContent('Chicken'), 'A Chicken') // Chicken here can only be one of the defined entries in the schema
      }
    },
  }
}))
.build();
