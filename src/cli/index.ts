#!/usr/bin/env -S node --loader ts-node/esm --no-warnings
import {compile, JSONSchema} from "json-schema-to-typescript";
import { ApiGenerator } from './generators/generator';
import { HexlabsGenerator } from './generators/hexlabs-generator';
import * as fs from 'fs';
import {OAS} from "../oas.js";
import chalk from 'chalk';
import { Command } from 'commander';
import {generateSdkFrom} from "../sdk-mapper.js";
import {generateMockFrom} from "../mock-mapper.js";
import { PathFinder } from './paths/path-finder';
import { MiddyGenerator } from "./generators/middy/middy-generator";

const program = new Command();

export async function types(oas: OAS): Promise<string> {
  const schemas = oas.components?.schemas ?? {};
  const fakeSchema: JSONSchema = {
    anyOf: Object.keys(schemas).map(it => ({'$ref': '#/components/schemas/' + it})),
    components: { schemas }
  }
  return await compile(fakeSchema, '__ALL__', {bannerComment: ''});
}

function generatorFor(template: 'hexlabs' | 'middy'): ApiGenerator {
  if(template === 'hexlabs') {
    return new HexlabsGenerator();
  }
  return new MiddyGenerator();
}

async function generateFromSchema(schemaLocation: string, command: any) {
  const {template, apiVersion} = command;
  const schema: OAS = schemaLocation.endsWith('.ts') ? (await import(schemaLocation)).default : (await import(schemaLocation));
  const location = schemaLocation.substring(0, schemaLocation.lastIndexOf('/'));
  const dir = 'generated/' + schema.info.title.toLowerCase().replace(/ /g, '-') + '/';
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
  const pathFinder = PathFinder.from(schema);
  const apiDefinition = generatorFor(template).generate(pathFinder, apiVersion);
  fs.writeFileSync(dir + 'api.ts', apiDefinition);
  const pathInfo = pathFinder.pathInfo();
  fs.writeFileSync(dir + 'paths.json', JSON.stringify(pathInfo, null, 2));
  if(template === 'hexlabs') {
    const apiDefinition = new HexlabsGenerator().generate(pathFinder, apiVersion);
    fs.writeFileSync(dir + 'api.ts', apiDefinition);
  }
  fs.writeFileSync(dir + 'schema.json', JSON.stringify({ components: { schemas: schema.components?.schemas ?? {} } }, null, 2));
  fs.writeFileSync(dir + 'oas.json', JSON.stringify(schema, null, 2));
  if(schema.servers) fs.writeFileSync(dir + 'servers.json', JSON.stringify(schema.servers, null, 2));
  fs.writeFileSync(dir + 'zod-model.ts', fs.readFileSync(location + '/model.ts'));
  fs.writeFileSync(dir + 'model.ts', await types(schema));
  fs.writeFileSync(dir + 'sdk.ts', generateSdkFrom(schema, apiVersion));
}

async function generateMockFromSchema(schemaLocation: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const schema: OAS = schemaLocation.endsWith('.ts') ? (await import(schemaLocation)).default : (await import(schemaLocation));
  const dir = 'generated/' + schema.info.title.toLowerCase().replace(/ /g, '-') + '/';
  fs.writeFileSync(dir + 'mock.ts', generateMockFrom(schema));
}

function generate(): any {
  return program.command('generate <schemaLocation>')
  .option('-t, --template <template>', 'Type of Api templating [hexlabs, middy]', 'hexlabs')
  .option('-a, --apiVersion <version>', 'API Version', '1.0.0')
  .action(generateFromSchema)
}

function generateMock(): any {
  return program.command('generateMock <schemaLocation>')
      .action(generateMockFromSchema)
}

(async () => {
  try {
    generate();
    generateMock();
    await program.parseAsync(process.argv);
  } catch(e) {
    console.log(e ?? 'Error');
    process.exit(1);
  }
})();
