import {OAS, OASOperation} from "./oas";
import {methodOperations, pathsFrom, typeFrom} from "./sdk-mapper";

interface Method {
  method: string
  statusCode: string
  type: string
}

interface Path {
  path: string
  methods: Method[]
}

export interface Mock {
  name: string
  paths: Path[]
}

function firstReturnType(oas: OAS, method: OASOperation, imports: string[]): [string, string] {
  const statusCode = Object.keys(method.responses).find(x => x)!;
  const response = method.responses[statusCode];
  const [type, newImports] = typeFrom(oas, response);
  imports.push(...newImports);
  return [statusCode, type]
}

const mockFrom = (spec: OAS): Mock => ({
  name: spec.info.title.replace(/ /g, '') + 'Mock',
  paths: pathsFrom(spec).map(path => ({
    path: path.path,
    methods: methodOperations(path.definition!).map(methodOperation => {
      const [statusCode, type] = firstReturnType(spec, methodOperation.definition, []);
      return {
        statusCode,
        type,
        method: methodOperation.method,
      }
    })
  }))
})

export const generateMockFrom = (spec: OAS): string => {
  const mock = mockFrom(spec);
  return `import {mock} from "intermock";
import path from 'path';
import {readFileSync} from 'fs';

const ${mock.name} = (app: any) => {
  ${mock.paths.map(path => path.methods.map(method => `app.${method.method}("${path.path}", (req, res) => res.status(${method.statusCode}).json(mock({files: [["", readFileSync(path.resolve(__dirname, './model.ts'), 'utf-8')]], interfaces: ["${method.type}"]})));`).join("\n  ")).join("\n  ")}
}

export default ${mock.name};
`
}

