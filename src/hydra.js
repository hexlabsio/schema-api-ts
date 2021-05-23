"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var hydraSpec = {
    'HydraOperation': {
        title: 'Hydra Operation',
        type: 'object',
        required: ['statusCodes', 'method'],
        additionalProperties: false,
        properties: {
            method: { type: 'string' },
            expects: { type: 'string' },
            returns: { type: 'string' },
            statusCodes: { type: 'array', items: { type: 'string' } },
        }
    },
    'HydraResource': {
        title: 'Hydra Resource',
        type: 'object',
        additionalProperties: false,
        properties: {
            '@id': { type: 'string' },
            '@operation': { type: 'array', items: { $ref: '#/components/schemas/HydraOperation' } }
        }
    },
    'HydraCollection': {
        title: 'Hydra Collection',
        allOf: [
            { $ref: '#/components/schemas/HydraResource' },
            { type: 'object', properties: { member: { type: 'array', items: { $ref: '#/components/schemas/HydraResource' } } } }
        ]
    }
};
exports.default = hydraSpec;
