import * as z from 'zod';
import { JsonSchema7Type, zodToJsonSchema } from "zod-to-json-schema";

export class ZodSchemaBuilder<R extends Record<string, JsonSchema7Type>> {

  private readonly zodSchemas: Record<string, z.ZodType> = {};

  private constructor(private readonly schemas: R) {}

  static create(): ZodSchemaBuilder<{}> {
    return new ZodSchemaBuilder({});
  }

  add<S extends string, T extends z.ZodType>(name: S, type: T): ZodSchemaBuilder<R & {[name in S]: JsonSchema7Type}> {
    this.zodSchemas[name] = type as any;
    this.schemas[name] = (zodToJsonSchema(type, {name, basePath: ['#','components', 'schemas'], '$refStrategy': 'root', postProcess: s => {
      return JSON.parse(JSON.stringify(s).replaceAll('#/components/schemas/definitions/', '#/components/schemas/'))
      } }).definitions as any)[name];
    this.schemas[name].title = name;
    return this as any;
  }

  build(): { components: { schemas: R } } {
    const schema: any = (zodToJsonSchema(z.object(this.zodSchemas), {
      name: 'all',
      basePath: ['#','components', 'schemas'],
      postProcess: (s: any) => {
        return JSON.parse(JSON.stringify(s).replaceAll('#/components/schemas/definitions/all/properties/', '#/components/schemas/'))
      }
    }) as any).definitions.all.properties;

    const updated = Object.keys(schema).reduce((prev, name) => ({...prev, [name]: {title: name, ...schema[name]}}), {} as R)

    console.log(JSON.stringify(updated, null, 2));
    return { components: { schemas: updated } };
  }
}
