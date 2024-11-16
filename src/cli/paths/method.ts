import { OASOperation, OASParameter, OASRef, OASRequestBody, OASResponse } from '../../oas';
import { ParamType } from './param-type';


export interface Method {
  method: string,
  responses: Record<string, OASResponse>;
  queryParams: ParamType[];
  headerParams: ParamType[];
  scopes: string[];
  requestType?: string;
  operationId?: string;
}

function isOASParam(param: OASParameter | OASRef): param is OASParameter {
  return !Object.keys(param).includes("$ref");
}

export function methodFrom(method: string, definition: OASOperation): Method {
    const queries = definition.parameters?.filter(p => isOASParam(p) && p.in === "query")?.map(p => (p as OASParameter)) ?? [];
    const headers = definition.parameters?.filter(p => isOASParam(p) && p.in === "header")?.map(p => (p as OASParameter)) ?? [];
    const queryDefinitions: ParamType[] = queries.map(it => ({name: it.name, required: !!it.required, multi: it.schema?.type === 'array'}))
    const headerDefinitions: ParamType[] = headers.map(it => ({name: it.name, required: !!it.required, multi: it.schema?.type === 'array'}))
    const scopes = (definition.security ?? []).flatMap(it => Object.keys(it).flatMap(key => it[key]))
    const requestType = (definition.requestBody as OASRequestBody)?.content?.['application/json']?.schema?.$ref;
    const requestTypeName = requestType?.substring(requestType?.lastIndexOf('/') + 1);
    return {
      method,
      responses: definition.responses as any,
      queryParams: queryDefinitions,
      headerParams: headerDefinitions,
      scopes: [...new Set(scopes)],
      requestType: requestTypeName,
      operationId: definition.operationId
    }
}
