import {JSONSchema} from "json-schema-to-typescript";
import {SchemaBuilder} from "../src";
import {Validator} from "../src/validator";

const s = SchemaBuilder.create();
describe('Validation', () => {
  
  describe('Primitives', () => {
    it('should validate null', () => {
      const schema = s.null();
      expect(Validator.validate(null, schema)).toEqual([]);
      expect(Validator.validate(false, schema)).toEqual([{value: false, location: '#', schema, message: 'Expected value to be null'}]);
      expect(Validator.validate(undefined, schema)).toEqual([{value: undefined, location: '#', schema, message: 'Expected value to be null'}]);
      expect(Validator.validate(0, schema)).toEqual([{value: 0, location: '#', schema, message: 'Expected value to be null'}]);
    });
    
    it('should validate boolean', () => {
      const schema = s.boolean();
      expect(Validator.validate(true, schema)).toEqual([]);
      expect(Validator.validate(false, schema)).toEqual([]);
      expect(Validator.validate(undefined, schema)).toEqual([{value: undefined, location: '#', schema, message: 'Expected value to be a boolean'}]);
      expect(Validator.validate(0, schema)).toEqual([{value: 0, location: '#', schema, message: 'Expected value to be a boolean'}]);
    });
  
    it('should validate string', () => {
      const schema = s.string();
      expect(Validator.validate('a string', schema)).toEqual([]);
      expect(Validator.validate(false, schema)).toEqual([{value: false, location: '#', schema, message: 'Expected value to be a string'}]);
      expect(Validator.validate(0, schema)).toEqual([{value: 0, location: '#', schema, message: 'Expected value to be a string'}]);
      expect(Validator.validate(undefined, schema)).toEqual([{value: undefined, location: '#', schema, message: 'Expected value to be a string'}]);
    });
  
    it('should validate number', () => {
      const schema = s.number();
      expect(Validator.validate(0, schema)).toEqual([]);
      expect(Validator.validate(-7600000, schema)).toEqual([]);
      expect(Validator.validate(123.321, schema)).toEqual([]);
      expect(Validator.validate('a string', schema)).toEqual([{value: 'a string', location: '#', schema, message: 'Expected value to be a number'}]);
      expect(Validator.validate(false, schema)).toEqual([{value: false, location: '#', schema, message: 'Expected value to be a number'}]);
      expect(Validator.validate(undefined, schema)).toEqual([{value: undefined, location: '#', schema, message: 'Expected value to be a number'}]);
    });
  
    it('should validate integer', () => {
      const schema = s.integer();
      expect(Validator.validate(0, schema)).toEqual([]);
      expect(Validator.validate(-7600000, schema)).toEqual([]);
      expect(Validator.validate(123.321, schema)).toEqual([{value: 123.321, location: '#', schema, message: 'Expected value to be an integer'}]);
      expect(Validator.validate('a string', schema)).toEqual([{value: 'a string', location: '#', schema, message: 'Expected value to be a number'}]);
      expect(Validator.validate(false, schema)).toEqual([{value: false, location: '#', schema, message: 'Expected value to be a number'}]);
      expect(Validator.validate(undefined, schema)).toEqual([{value: undefined, location: '#', schema, message: 'Expected value to be a number'}]);
    });
  });
  
  describe('Object Validation', () => {
    it('should validate object type by default', () => {
      const schema = {};
      expect(Validator.validate({}, schema)).toEqual([]);
      expect(Validator.validate(12, schema)).toEqual([{value: 12, location: '#', schema, message: 'Expected value to be an object'}]);
    });
    
    it('should validate object type', () => {
      const schema = s.object(undefined, undefined, true) as JSONSchema;
      expect(Validator.validate({a: 'b'}, schema)).toEqual([]);
      expect(Validator.validate('a string', schema)).toEqual([{value: 'a string', location: '#', schema, message: 'Expected value to be an object'}]);
      expect(Validator.validate(['a'], schema)).toEqual([{value: ['a'], location: '#', schema, message: 'Expected value to be an object'}]);
      expect(Validator.validate(false, schema)).toEqual([{value: false, location: '#', schema, message: 'Expected value to be an object'}]);
      expect(Validator.validate(0, schema)).toEqual([{value: 0, location: '#', schema, message: 'Expected value to be an object'}]);
      expect(Validator.validate(undefined, schema)).toEqual([{value: undefined, location: '#', schema, message: 'Expected value to be an object'}]);
    });
    
    it('should validate object has required properties', () => {
      const schema = s.object({a: s.string(), b: s.number()}, undefined, false) as JSONSchema;
      expect(Validator.validate({a: 'b', b: 5}, schema)).toEqual([]);
      expect(Validator.validate({a: 'b'}, schema)).toEqual([{value: {a: 'b'}, location: '#', schema, message: 'Expected the following keys that were not present: [b]'}]);
    });
  
    it('should validate child property', () => {
      const schema = s.object({a: s.string(), b: s.number()}, undefined, false) as JSONSchema;
      expect(Validator.validate({a: 'b', b: 4}, schema)).toEqual([]);
      expect(Validator.validate({a: 'b', b: 'o'}, schema)).toEqual([{value: 'o', schema: s.number(), location: '#/b', message: 'Expected value to be a number'}]);
    });
  
    it('should validate child of child property', () => {
      const schema = s.object({a: s.string(), b: s.object({x: s.string() })}, undefined, false) as JSONSchema;
      expect(Validator.validate({a: 'b', b: { x: 'x' }}, schema)).toEqual([]);
      expect(Validator.validate({a: 'b', b: { x: 4 }}, schema)).toEqual([{value: 4, schema: s.string(), location: '#/b/x', message: 'Expected value to be a string'}]);
    });
  
    it('should validate reference', () => {
      const schema = SchemaBuilder.create()
      .add('Abc', s => s.object({a: s.string()}))
      .add('Def', s => s.reference('Abc'))
      .build();
      expect(Validator.validate({a: 'b'}, schema.components.schemas.Def, schema)).toEqual([]);
      expect(Validator.validate({a: 5}, schema.components.schemas.Def, schema)).toEqual([{value: 5, schema: s.string(), location: '#/a', message: 'Expected value to be a string'}]);
    });
  
    it('should validate additional properties', () => {
      const schema = s.object({a: s.string()}, undefined, s.boolean());
      expect(Validator.validate({a: 'b', b: true}, schema)).toEqual([]);
      expect(Validator.validate({a: 'b', b: 78}, schema)).toEqual([{value: 78, schema: s.boolean(), location: '#/b', message: 'Expected value to be a boolean'}]);
    });
  
    it('should validate optional properties', () => {
      const schema = s.object({a: s.string()}, {b: s.boolean()});
      expect(Validator.validate({a: 'b', b: true}, schema)).toEqual([]);
      expect(Validator.validate({a: 'b'}, schema)).toEqual([]);
      expect(Validator.validate({a: 'b', b: 78}, schema)).toEqual([{value: 78, schema: s.boolean(), location: '#/b', message: 'Expected value to be a boolean'}]);
    });
  
    it('should validate anyof', () => {
      const schema: JSONSchema = { anyOf: [{type: 'string', const: 'X'}, {type: 'string', const: 'Y'}]}
      expect(Validator.validate('X', schema)).toEqual([]);
      expect(Validator.validate('Y', schema)).toEqual([]);
      expect(Validator.validate('T', schema).length).toEqual(1);
    });
  });
  
});
