import {JSONSchema} from "json-schema-to-typescript";
import {traversePath} from "./sdk-mapper";


interface Invalid {
  location: string;
  message: string;
  schema: JSONSchema;
  value: any;
}

class SchemaError {
  constructor(public readonly location: string, public readonly message: string){}
}

interface SchemaInfo {
  schema: JSONSchema;
  current: JSONSchema;
}

/**
 * https://json-schema.org/draft/2019-09/json-schema-validation.html
 */
export class Validator {
  static constValidation(value: any, constValue: any, location: string, schema: SchemaInfo): Invalid[] {
    const valid = constValue === undefined || value === constValue;
    return validate(value, location, schema, () => `Expected value to exactly equal ${constValue}`, valid)
  }
  
  static enumValidation(value: any, enumValues: any, location: string, schema: SchemaInfo): Invalid[] {
    const valid = enumValues === undefined || (Array.isArray(enumValues) && enumValues.includes(value))
    return validate(value, location, schema, () => `Expected value to exactly one of [${enumValues.join(', ')}]`, valid)
  }
  
  static validateGlobal(value: any, location: string, schema: SchemaInfo): Invalid[] {
    return [
      this.constValidation(value, schema.current.const, location, schema),
      this.enumValidation(value, schema.current.enum, location, schema)
    ].flat();
  }
  
  static actualSchema(schema: JSONSchema, current: JSONSchema): JSONSchema {
    if(!current['$ref']) return current;
    return traversePath(current['$ref'], schema);
  }
  
  static validateUnknown(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const current = this.actualSchema(schema.schema, schema.current);
    const info = {schema: schema.schema, current };
    switch (current.type) {
      case 'string': return StringValidator.validate(value, location, info);
      case 'integer': case 'number': return NumberValidator.validate(value, location, info);
      case 'array': return ArrayValidator.validate(value, location, info);
      case 'boolean': return BooleanValidator.validate(value, location, info);
      case 'null': return NullValidator.validate(value, location, info);
      default: return ObjectValidator.validate(value, location, info);
    }
  }
  
  static validate(value: any, schema: JSONSchema, parentSchema?: JSONSchema): Invalid[] {
    return this.validateUnknown(value, '#', {schema: parentSchema ?? schema, current: schema});
  }
}

class NumberValidator {
  
  static numberValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const valid = typeof value === 'number'
    return validate(value, location, schema, () => `Expected value to be a number`, valid)
  }
  
  static integerValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const valid = schema.current.type !== 'integer' || Number.isInteger(value)
    return validate(value, location, schema, () => `Expected value to be an integer`, valid)
  }
  
  static numericValidation(key: keyof JSONSchema, value: any, location: string, schema: SchemaInfo, validation: (schema: number) => boolean, message: (schema: number) => string): Invalid[] {
    if(schema.current[key] === undefined) return [];
    if(typeof schema.current[key] === 'number') {
      return validate(value, location, schema, () => message(schema.current[key]), validation(schema.current[key]))
    }
    throw new SchemaError(`${location}/${key}`, 'must be a number');
  }
  
  static multipleOfValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    return this.numericValidation(
      'multipleOf', value, location, schema,
        multipleOf => multipleOf > 0 && value % multipleOf === 0,
        multipleOf => `Expected value to be a multiple of ${multipleOf} and ${multipleOf} to be greater than 0`
    );
  }
  
  static maximumValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    return this.numericValidation(
      'maximum', value, location, schema,
      maximum => value <= maximum,
      maximum => `Expected value to be less than or equal to ${maximum}`
    );
  }
  static exclusiveMaximumValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    return this.numericValidation(
      'exclusiveMaximum', value, location, schema,
      exclusiveMaximum => value < exclusiveMaximum,
      exclusiveMaximum => `Expected value to be less than ${exclusiveMaximum}`
    );
  }
  
  static minimumValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    return this.numericValidation(
      'minimum', value, location, schema,
      exclusiveMinimum => value >= exclusiveMinimum,
      exclusiveMinimum => `Expected value to be greater than or equal to ${exclusiveMinimum}`
    );
  }
  static exclusiveMinimumValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    return this.numericValidation(
      'exclusiveMinimum', value, location, schema,
      exclusiveMinimum => value > exclusiveMinimum,
      exclusiveMinimum => `Expected value to be greater than ${exclusiveMinimum}`
    );
  }
  
  static validate(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const isNumber = this.numberValidation(value, location, schema);
    if(isNumber.length === 0) {
      return [
        Validator.validateGlobal(value, location, schema),
        this.integerValidation(value, location, schema),
        this.multipleOfValidation(value, location, schema),
        this.maximumValidation(value, location, schema),
        this.exclusiveMaximumValidation(value, location, schema),
        this.minimumValidation(value, location, schema),
        this.exclusiveMinimumValidation(value, location, schema)
      ].flat();
    }
    return isNumber;
  }
}

class StringValidator {
  
  static stringValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const valid = typeof value === 'string'
    return validate(value, location, schema, () => `Expected value to be a string`, valid)
  }
  
  static maxLengthValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    return NumberValidator.numericValidation(
      'maxLength', value, location, schema,
      maxLength => maxLength > 0 && Number.isInteger(maxLength) && value.length <= maxLength,
      maxLength => `Expected value to have length less than or equal to ${maxLength}`
    );
  }
  
  static minLengthValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    return NumberValidator.numericValidation(
      'minLength', value, location, schema,
      minLength => minLength > 0 && Number.isInteger(minLength) && value.length >= minLength,
      minLength => `Expected value to have length greater than or equal to ${minLength}`
    );
  }
  
  static patternValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    if(schema.current.pattern === undefined) return [];
    const pattern = new RegExp(schema.current.pattern);
    const isValid = value.match(pattern);
    return validate(value, location, schema, () => `Expected value to match pattern /${schema.current.pattern}/`, isValid);
  }
  
  static validate(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const isString = this.stringValidation(value, location, schema);
    if (isString.length === 0) {
      return [
        Validator.validateGlobal(value, location, schema),
        this.maxLengthValidation(value, location, schema),
        this.minLengthValidation(value, location, schema),
        this.patternValidation(value, location, schema)
      ].flat();
    }
    return isString;
  }
}

class BooleanValidator {
  static booleanValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const valid = typeof value === 'boolean'
    return validate(value, location, schema, () => `Expected value to be a boolean`, valid);
  }
  static validate(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const isBool = this.booleanValidation(value, location, schema);
    if (isBool.length === 0) {
      return Validator.validateGlobal(value, location, schema);
    }
    return isBool;
  }
}

class NullValidator {
  static nullValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const valid = value === null;
    return validate(value, location, schema, () => `Expected value to be null`, valid);
  }
  static validate(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const isNull = this.nullValidation(value, location, schema);
    if (isNull.length === 0) {
      return Validator.validateGlobal(value, location, schema);
    }
    return isNull;
  }
}


class ArrayValidator {
  
  static arrayValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const valid = Array.isArray(value);
    return validate(value, location, schema, () => `Expected value to be an array`, valid)
  }
  
  static itemsValidation(value: any[], location: string, schema: SchemaInfo): Invalid[] {
    if(schema.current.items === undefined) return [];
    if(Array.isArray(schema.current.items)) {
      const itemValidation = value.slice(0,schema.current.items.length).flatMap((item, index) => Validator.validateUnknown(item, `${location}/${index}`, { schema: schema.schema, current: (schema.current.items as any)[index] }));
      if(value.length > schema.current.items.length && schema.current.additionalItems) {
        return [...itemValidation, ...value.slice(schema.current.items.length).flatMap((item, index) => Validator.validateUnknown(item, `${location}/${schema.current.items!.length + index}`, { schema: schema.schema, current: schema.current.additionalItems as JSONSchema }))]
      }
      return itemValidation;
    }
    return value.flatMap((item, index) => Validator.validateUnknown(item, `${location}/${index}`, { schema: schema.schema, current: schema.current.items! }))
  }
  
  static containsValidation(value: any[], location: string, schema: SchemaInfo): Invalid[] {
    if(schema.current.contains === undefined) return [];
    if(value.find(it => Validator.validateUnknown(it, '', schema.current.contains).length === 0)) {
      return [];
    }
    return validate(value, location, schema, () => `Expected array to contain at least one item complying with ${schema.current.contains}`, false)
  }
  
  static uniqueValidation(value: any[], location: string, schema: SchemaInfo): Invalid[] {
    if(!schema.current.uniqueItems) return [];
    if(new Set(value).size === value.length) return [];
    return validate(value, location, schema, () => `Expected array items to all be unique`, false)
  }
  
  static maxItemsValidation(value: any[], location: string, schema: SchemaInfo): Invalid[] {
    return NumberValidator.numericValidation(
      'maxItems', value, location, schema,
      maxItems => maxItems >= 0 && Number.isInteger(maxItems) && value.length <= maxItems,
      maxItems => `Expected array to have length less than or equal to ${maxItems}`
    );
  }
  
  static minItemsValidation(value: any[], location: string, schema: SchemaInfo): Invalid[] {
    return NumberValidator.numericValidation(
      'minItems', value, location, schema,
      minItems => minItems >= 0 && Number.isInteger(minItems) && value.length >= minItems,
      minItems => `Expected array ${value} to have length greater than or equal to ${minItems}`
    );
  }
  
  static validate(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const isArray = this.arrayValidation(value, location, schema);
    if (isArray.length === 0) {
      return [
        Validator.validateGlobal(value, location, schema),
        this.itemsValidation(value, location, schema),
        this.containsValidation(value, location, schema),
        this.uniqueValidation(value, location, schema),
        this.maxItemsValidation(value, location, schema),
        this.minItemsValidation(value, location, schema),
      ].flat();
    }
    return isArray;
  }
}

class ObjectValidator {
  
  static objectValidation(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const valid = typeof value === 'object' && !Array.isArray(value);
    return validate(value, location, schema, () => `Expected value to be an object`, valid)
  }
  
  static minPropertiesValidation(value: Record<string, unknown>, location: string, schema: SchemaInfo): Invalid[] {
    const properties = Object.keys(value).length;
    return NumberValidator.numericValidation(
      'minProperties', value, location, schema,
      minProperties => minProperties >= 0 && Number.isInteger(minProperties) && properties >= minProperties,
      minProperties => `Expected object ${value} to have min properties of ${minProperties} but had ${properties}`
    );
  }
  
  static maxPropertiesValidation(value: Record<string, unknown>, location: string, schema: SchemaInfo): Invalid[] {
    const properties = Object.keys(value).length;
    return NumberValidator.numericValidation(
      'maxProperties', value, location, schema,
      maxProperties => maxProperties >= 0 && Number.isInteger(maxProperties) && properties <= maxProperties,
      maxProperties => `Expected object ${value} to have max properties of ${maxProperties} but had ${properties}`
    );
  }
  
  static requiredValidation(value: Record<string, unknown>, location: string, schema: SchemaInfo): Invalid[] {
    if(!schema.current.required) return [];
    const keys = Object.keys(value);
    const requiredMissing =  schema.current.required.flatMap(key => {
      if(!keys.includes(key)) return [key];
      return [];
    });
    if(requiredMissing.length === 0) return [];
    return [{ schema: schema.current, location, value, message: `Expected the following keys that were not present: [${requiredMissing.join(', ')}]` }]
  }
  
  static propertyValidation(value: Record<string, unknown>, location: string, schema: SchemaInfo): Invalid[] {
    if(!schema.current.properties || Object.keys(schema.current.properties).length === 0) return [];
    return Object.keys(schema.current.properties).flatMap(property => {
      const subElement = value[property];
      if(!subElement) return [];
      return Validator.validateUnknown(subElement, `${location}/${property}`, {schema: schema.schema, current: schema.current.properties![property]})
    });
  }
  
  static additionalPropertyValidation(value: Record<string, unknown>, location: string, schema: SchemaInfo): Invalid[] {
    const aps = schema.current.additionalProperties;
    const ps = Object.keys(schema.current.properties ?? {});
    if(aps === undefined || aps === true) return [];
    const excessKeys = Object.keys(value ?? {}).filter(it => !ps.includes(it));
    if(excessKeys.length === 0) return [];
    if(aps === false) return [{value, location, schema: schema.current, message: `Expected no additional properties but found the following: [${excessKeys.join(', ')}]`}];
    return excessKeys.flatMap(property => {
      const subElement = value[property];
      return Validator.validateUnknown(subElement, `${location}/${property}`, {schema: schema.schema, current: aps})
    });
  }
  
  static validate(value: any, location: string, schema: SchemaInfo): Invalid[] {
    const isObject = this.objectValidation(value, location, schema);
    if(isObject.length === 0) {
      return [
        Validator.validateGlobal(value, location, schema),
        this.minPropertiesValidation(value, location, schema),
        this.maxPropertiesValidation(value, location, schema),
        this.requiredValidation(value, location, schema),
        this.propertyValidation(value, location, schema),
        this.additionalPropertyValidation(value, location, schema),
      ].flat();
    }
    return isObject;
  }
}

function validate(value: any, location: string, schema: SchemaInfo, message: () => string, valid: boolean): Invalid[] {
  return valid ? [] : [{ location, message: message(), schema: schema.current, value }];
}
