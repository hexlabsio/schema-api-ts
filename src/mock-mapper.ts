import {OAS, OASOperation, OASResponse} from "./oas";
import {methodOperations, pathsFrom} from "./sdk-mapper";

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
  const statusCode = Object.keys(method.responses).find(x => x)!;
  const response = method.responses[statusCode] as OASResponse;
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
const ${mock.name} = (app: any) => {
  ${mock.paths.map(path => path.methods.map(method => `app.${method.method}("${path.path}", (req, res) => res.status(${method.statusCode}).json(${method.response});`).join("\n  ")).join("\n  ")}
}

export default ${mock.name};
`
}

