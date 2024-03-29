import {OAS, OASOperation, OASRef, OASResponse} from "./oas.js";
import {methodOperations, pathsFrom, traversePath} from "./sdk-mapper.js";

interface Method {
  method: string
  statusCode: string
  response: any
}

interface Path {
  path: string
  methods: Method[]
}

export interface Mock {
  name: string
  paths: Path[]
}

export const responseFrom = (oas: OAS, method: OASOperation): [string, any] => {
  const statusCode = Object.keys(method.responses!).find(x => x)!;
  const refResponse = method.responses![statusCode];
  const response = Object.prototype.hasOwnProperty.call(refResponse, '$ref') ? traversePath<OASResponse>((refResponse as OASRef)['$ref'], oas) : refResponse as OASResponse;
  const contentType = Object.keys(response.content ?? '')[0]
  const content = response.content ? response.content[contentType] : undefined;
  return [statusCode, content?.example ?? {}];
}

export const mockFrom = (spec: OAS): Mock => ({
  name: spec.info.title.replace(/ /g, '') + 'Mock',
  paths: pathsFrom(spec).map(path => ({
    path: path.path,
    methods: methodOperations(path.definition!).map(methodOperation => {
      const [statusCode, response] = responseFrom(spec, methodOperation.definition);
      return {
        statusCode,
        response,
        method: methodOperation.method,
      }
    })
  }))
})

export const generateMockFrom = (spec: OAS): string => {
  const mock = mockFrom(spec);
  return `
const ${mock.name} = (app: any, basePath: string) => {
  ${mock.paths.map(path => path.methods.map(method => `app.${method.method}(basePath + "${path.path.replace(/{([^/{}]+)}/g, ':$1')}", (req: any, res: any) => res.status(${method.statusCode}).json(${JSON.stringify(method.response)}));`).join("\n  ")).join("\n  ")}
}

export default ${mock.name};
`
}

