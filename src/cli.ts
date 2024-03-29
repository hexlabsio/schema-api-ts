#!/usr/bin/env -S node --loader ts-node/esm --no-warnings
import {compile, JSONSchema} from "json-schema-to-typescript";
import {PathFinder} from "./mapper.js";
import * as fs from 'fs';
import {OAS} from "./oas.js";
import chalk from 'chalk';
import { Command } from 'commander';
import {generateSdkFrom} from "./sdk-mapper.js";
import {generateMockFrom} from "./mock-mapper.js";

const program = new Command();

export async function types(oas: OAS): Promise<string> {
  const schemas = oas.components?.schemas ?? {};
  const fakeSchema: JSONSchema = {
    anyOf: Object.keys(schemas).map(it => ({'$ref': '#/components/schemas/' + it})),
    components: { schemas }
  }
  return await compile(fakeSchema, '__ALL__', {bannerComment: ''});
}

async function generateFromSchema(schemaLocation: string, command: any) {
  const {hydra, aws} = command;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const schema: OAS = schemaLocation.endsWith('.ts') ? (await import(schemaLocation)).default : (await import(schemaLocation));
  const pathFinder = PathFinder.from(schema, hydra, aws);
  const args = process.argv;
  const version = args.find(it => it.startsWith('v='))?.substring(2);
  const apiDefinition = pathFinder.apiDefinition(version);
  const dir = 'generated/' + schema.info.title.toLowerCase().replace(/ /g, '-') + '/';
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(dir + 'schema.json', JSON.stringify({ components: { schemas: schema.components?.schemas ?? {} } }, null, 2));
  fs.writeFileSync(dir + 'oas.json', JSON.stringify(schema, null, 2));
  fs.writeFileSync(dir + 'api.ts', apiDefinition);
  const pathInfo = pathFinder.pathInfo();
  fs.writeFileSync(dir + 'paths.json', JSON.stringify(pathInfo, null, 2));
  if(schema.servers) fs.writeFileSync(dir + 'servers.json', JSON.stringify(schema.servers, null, 2));
  fs.writeFileSync(dir + 'model.ts', await types(schema));
  fs.writeFileSync(dir + 'sdk.ts', generateSdkFrom(schema, version));
}

async function generateMockFromSchema(schemaLocation: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const schema: OAS = schemaLocation.endsWith('.ts') ? (await import(schemaLocation)).default : (await import(schemaLocation));
  const dir = 'generated/' + schema.info.title.toLowerCase().replace(/ /g, '-') + '/';
  fs.writeFileSync(dir + 'mock.ts', generateMockFrom(schema));
}

function generate(): any {
  return program.command('generate <schemaLocation>')
  .option('-h, --hydra', 'Include Operations, Collections and Resources', true)
  .option('-a, --aws', 'Include Api Gateway Operations', true)
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
    console.log(chalk.red(e ?? 'Error'));
    process.exit(1);
  }
})();
