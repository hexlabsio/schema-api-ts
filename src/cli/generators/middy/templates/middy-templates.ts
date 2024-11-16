import { Method } from '../../../paths/method';
import { Path } from '../../../paths/path';

function eventType(method: Method): string {
  return method.requestType ? `APIGatewayEvent & { body: model.${method.requestType} }` : 'APIGatewayEvent';
}

export function handlerMethodType(method: Method): string {
  return `'${method.operationId}': (request: ${eventType(method)}) => Promise<APIGatewayProxyResult>;`
}

export function route(path: Path, method: Method): string {
  return `{
      method: '${method.method.toUpperCase()}',
      path: '${path.pathString()}',
      handler: this.${method.operationId}()
    }`;
}

export function handlerFunction(method: Method): string {
  const validator = method.requestType ? `.use(validatorMiddleware({eventSchema: () => schema.components.schemas.${method.requestType} }))\n      `: '';
  return '' +
    `${method.operationId}() {
    return middy()
      ${validator}.use(httpJsonBodyParser<${eventType(method)}>())
      .handler(this.handlers.${method.operationId}.bind(this))
  }`;
}
