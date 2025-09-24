import * as z from 'zod';
import { JsonSchema7Type, zodToJsonSchema } from "zod-to-json-schema";

export class ZodSchemaBuilder<R extends Record<string, JsonSchema7Type>> {

  private constructor(private readonly schemas: R) {}

  static create(): ZodSchemaBuilder<{}> {
    return new ZodSchemaBuilder({});
  }

  add<S extends string, T extends z.ZodType>(name: S, type: T): ZodSchemaBuilder<R & {[name in S]: JsonSchema7Type}> {
    this.schemas[name] = (zodToJsonSchema(type, {name, basePath: ['#','components', 'schemas'], '$refStrategy': 'none' }).definitions as any)[name];
    this.schemas[name].title = name;
    return this as any;
  }

  build(): { components: { schemas: R } } {
    return { components: { schemas: this.schemas } };
  }
}
