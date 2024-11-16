import {
  OAS,
  OASPath,
  OASRef,
  OASSecurityScheme
} from "../../oas.js";
import { Path } from './path';

export interface PathInfo {
  paths?: {
    [key: string]: PathInfo;
  };
  methods?: string[];
  security?: {
    [method: string]: {
      scopes: string[]
    }
  }
}

export class PathFinder {

  constructor(public apiName: string, public paths: Path[] = []) { }

  append(route: string, path: OASPath, securitySchemes?: Record<string, OASSecurityScheme | OASRef>): this {
    const [root, ...rest] = route.substring(1).split('/');
    const existing = this.paths.find(it => it.part === root);
    if (existing) {
      existing.append(rest, path, securitySchemes);
    } else {
      this.paths.push(new Path(root).append(rest, path, securitySchemes));
    }
    return this;
  }

  pathInfo(): { [key: string]: PathInfo } {
    return this.paths.reduce((paths, path) => ({ ...paths, ...path.pathInfo() }), {});
  }

  static from(openapi: OAS): PathFinder {
    return Object.keys(openapi.paths).reduce((pathFinder, path) => {
      return pathFinder.append(path, openapi.paths[path] as OASPath, openapi.components?.securitySchemes);
    }, new PathFinder(openapi.info.title.replace(/\W+/g, ''), []));
  }
}
