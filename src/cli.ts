#!/usr/bin/env node
import {compile, JSONSchema} from "json-schema-to-typescript";
import {PathFinder} from "./mapper";
import * as fs from 'fs';
import {OAS} from "./oas";
import chalk from 'chalk';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('ts-node').register({typeCheck: false});
import { Command } from 'commander';

const program = new Command();

async function generateFromSchema(schemaLocation: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const schema: OAS = schemaLocation.endsWith('.ts') ? require(schemaLocation).default : require(schemaLocation);
  const pathFinder = PathFinder.from(schema);
  const apiDefinition = pathFinder.apiDefinition();
  const dir = 'generated/' + schema.info.title.toLowerCase().replace(/ /g, '-') + '/';
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(dir + 'api.ts', apiDefinition);
  const pathInfo = pathFinder.pathInfo();
  fs.writeFileSync(dir + 'paths.json', JSON.stringify(pathInfo, null, 2));
  const fakeSchema: JSONSchema = {
    anyOf: Object.keys(schema.components?.schemas ?? {}).map(it => ({'$ref': '#/components/schemas/' + it})),
    components: { schemas: schema.components?.schemas }
  }
  const model = await compile(fakeSchema, '__ALL__');
  fs.writeFileSync(dir + 'model.ts', model);
}


function generate(): any {
  return program.command('generate <schemaLocation>')
  .action(generateFromSchema)
}

(async () => {
  try {
    generate();
    await program.parseAsync(process.argv);
  } catch(e) {
    console.log(chalk.red(e));
    process.exit(1);
  }
})();
