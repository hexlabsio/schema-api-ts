import { OASPath, OASRef, OASSecurityScheme } from '../../oas';
import { Method, methodFrom } from './method';
import { PathInfo } from './path-finder';

export class Path {
  constructor(public part: string, public paths: Path[] = [], public methods: Method[] = [], public parent?: Path) {
  }

  operations(): {path: Path, method: Method}[] {
    const children = this.paths.flatMap(path => path.operations());
    const currentLevel = this.methods.map(method => ({ path: this, method }));
    return [...currentLevel, ...children];
  }

  append(route: string[], path: OASPath, securitySchemes?: Record<string, OASSecurityScheme | OASRef>): this {
    if (route.length === 0) {
      const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
      Object.keys(path).filter(it => methods.includes(it)).forEach(verb => {
          this.methods.push(methodFrom(verb, (path as any)[verb]))
        }
      );
    } else {
      const [root, ...rest] = route;
      const existing = this.paths.find(it => it.part === root);
      if (existing) {
        existing.append(rest, path, securitySchemes);
      } else {
        this.paths.push(new Path(root, [], [], this).append(rest, path, securitySchemes));
      }
    }
    return this;
  }

  pathInfo(): { [key: string]: PathInfo } {
    return {
      ['/' + this.part]: {
        security: this.methods.reduce((prev, method) => ({...prev, [method.method.toUpperCase()]: { scopes: method.scopes }}), {}),
        methods: this.methods.map(method => method.method.toUpperCase()),
        paths: this.paths.reduce((paths, path) => ({ ...paths, ...path.pathInfo() }), {})
      }
    };
  }

  pathString(): string {
    return (this.parent?.pathString() ?? '') + '/' + this.part;
  }

  private capitilize(name: string): string {
    return name.substring(0, 1).toUpperCase() + name.substring(1);
  }

  public name(): string {
    return this.part.startsWith('{') ? ('By' + this.capitilize(this.part.substring(1, this.part.length - 1))) : this.capitilize(this.part);
  }
}
