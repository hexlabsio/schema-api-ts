import { PathFinder } from '../paths/path-finder';

export interface ApiGenerator {
  generate(definition: PathFinder, version?: string): string;
}
