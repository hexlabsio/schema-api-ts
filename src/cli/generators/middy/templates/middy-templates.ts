import { Method } from '../../../paths/method';
import { Path } from '../../../paths/path';

function eventType(method: Method): string {
  return method.requestType ? `z.infer<typeof ${method.requestType}Event>` : 'APIGatewayEvent';
}

export function handlerMethodType(method: Method): string {
  return `'${method.operationId}': (request: ${eventType(method)}) => Promise<APIGatewayProxyResult>;`
}

export function route(path: Path, method: Method): string {
  return `{
      method: '${method.method.toUpperCase()}',
      path: '/{stage}${path.pathString()}',
      handler: this.${method.operationId}()
    }`;
}

export function handlerFunction(method: Method): string {

  const validator = method.requestType ? `.use(parser({ schema: ${method.requestType}Event }))\n      `: '';
  return '' +
    `${method.operationId}() {
    return middy()
      ${validator}.handler(this.handlers.${method.operationId}.bind(this))
  }`;
}
