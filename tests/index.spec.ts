import * as path from 'path';
import { describe, expect, test } from 'vitest';
import { createComponentMetaChecker, createComponentMetaCheckerByJsonConfig, MetaCheckerOptions, ComponentMetaChecker, TypeMeta } from 'vue-component-meta';

const worker = (checker: ComponentMetaChecker, withTsconfig: boolean) => describe(`vue-component-meta ${withTsconfig ? 'with tsconfig' : 'without tsconfig'}`, () => {

	test('empty-component', () => {
		const componentPath = path.resolve(__dirname, '../vue-component-meta/empty-component/component.vue');
		console.log(' componentPath', componentPath);
		const meta = checker.getComponentMeta(componentPath);

		expect(meta.props.map(prop => prop.name)).toEqual([
			'key',
			'ref',
			'ref_for',
			'ref_key',
			'class',
			'style',
		]);
		expect(meta.props.filter(prop => !prop.global)).toEqual([]);
	});

	test('reference-type-props', () => {
		const componentPath = path.resolve(__dirname, '../vue-component-meta/reference-type-props/component.vue');
		const meta = checker.getComponentMeta(componentPath);

		expect(meta.type).toEqual(TypeMeta.Class);

		const foo = meta.props.find(prop => prop.name === 'foo');
		const bar = meta.props.find(prop => prop.name === 'bar');
		const baz = meta.props.find(prop => prop.name === 'baz');

		const union = meta.props.find(prop => prop.name === 'union');
		const unionOptional = meta.props.find(prop => prop.name === 'unionOptional');
		const nested = meta.props.find(prop => prop.name === 'nested');
		const nestedIntersection = meta.props.find(prop => prop.name === 'nestedIntersection');
		const nestedOptional = meta.props.find(prop => prop.name === 'nestedOptional');
		const array = meta.props.find(prop => prop.name === 'array');
		const arrayOptional = meta.props.find(prop => prop.name === 'arrayOptional');
		const enumValue = meta.props.find(prop => prop.name === 'enumValue');
		const literalFromContext = meta.props.find(prop => prop.name === 'literalFromContext');
		const inlined = meta.props.find(prop => prop.name === 'inlined');
		const recursive = meta.props.find(prop => prop.name === 'recursive');

		expect(foo).toBeDefined();
		expect(foo?.required).toBeTruthy();
		expect(foo?.type).toEqual('string');
		expect(foo?.schema).toEqual('string');
		expect(foo?.description).toEqual('string foo');
		if (process.platform !== 'win32') { // TODO
			expect(foo?.tags).toEqual([
				{
					name: 'default',
					text: '"rounded"',
				},
				{
					name: 'since',
					text: 'v1.0.0',
				},
				{
					name: 'see',
					text: 'https://vuejs.org/',
				},
				{
					name: 'example',
					text: '```vue\n<template>\n  <component foo="straight" />\n</template>\n```',
				},
			]);
		}

		expect(bar).toBeDefined();
		expect(bar?.default).toEqual('1');
		expect(bar?.required).toBeFalsy();
		expect(bar?.type).toEqual('number | undefined');
		expect(bar?.description).toEqual('optional number bar');
		expect(bar?.schema).toEqual({
			kind: 'enum',
			type: 'number | undefined',
			schema: ['undefined', 'number']
		});

		expect(baz).toBeDefined();
		// When initializing an array, users have to do it in a function to avoid
		// referencing always the same instance for every component
		// if no params are given to the function and it is simply an Array,
		// the array is the default value and should be given instead of the function
		expect(baz?.default).toEqual(`["foo", "bar"]`);
		expect(baz?.required).toBeFalsy();
		expect(baz?.type).toEqual('string[] | undefined');
		expect(baz?.description).toEqual('string array baz');
		expect(baz?.schema).toEqual({
			kind: 'enum',
			type: 'string[] | undefined',
			schema: [
				'undefined',
				{
					kind: 'array',
					type: 'string[]',
					schema: ['string']
				}
			]
		});

		expect(union).toBeDefined();
		expect(union?.default).toBeUndefined();
		expect(union?.required).toBeTruthy();
		expect(union?.type).toEqual('string | number');
		expect(union?.description).toEqual('required union type');
		expect(union?.schema).toEqual({
			kind: 'enum',
			type: 'string | number',
			schema: ['string', 'number']
		});

		expect(unionOptional).toBeDefined();
		expect(unionOptional?.default).toBeUndefined();
		expect(unionOptional?.required).toBeFalsy();
		expect(unionOptional?.type).toEqual('string | number | undefined');
		expect(unionOptional?.description).toEqual('optional union type');
		expect(unionOptional?.schema).toEqual({
			kind: 'enum',
			type: 'string | number | undefined',
			schema: ['undefined', 'string', 'number']
		});

		expect(nested).toBeDefined();
		expect(nested?.default).toBeUndefined();
		expect(nested?.required).toBeTruthy();
		expect(nested?.type).toEqual('MyNestedProps');
		expect(nested?.description).toEqual('required nested object');
		expect(nested?.schema).toEqual({
			kind: 'object',
			type: 'MyNestedProps',
			schema: {
				nestedProp: {
					name: 'nestedProp',
					description: 'nested prop documentation',
					tags: [],
					global: false,
					required: true,
					type: 'string',
					declarations: [],
					schema: 'string'
				}
			}
		});

		expect(nestedIntersection).toBeDefined();
		expect(nestedIntersection?.default).toBeUndefined();
		expect(nestedIntersection?.required).toBeTruthy();
		expect(nestedIntersection?.type).toEqual('MyNestedProps & { additionalProp: string; }');
		expect(nestedIntersection?.description).toEqual('required nested object with intersection');
		expect(nestedIntersection?.schema).toEqual({
			kind: 'object',
			type: 'MyNestedProps & { additionalProp: string; }',
			schema: {
				nestedProp: {
					name: 'nestedProp',
					description: 'nested prop documentation',
					tags: [],
					global: false,
					required: true,
					type: 'string',
					declarations: [],
					schema: 'string'
				},
				additionalProp: {
					name: 'additionalProp',
					description: 'required additional property',
					tags: [],
					global: false,
					required: true,
					type: 'string',
					declarations: [],
					schema: 'string'
				}
			}
		});

		expect(nestedOptional).toBeDefined();
		expect(nestedOptional?.default).toBeUndefined();
		expect(nestedOptional?.required).toBeFalsy();
		expect(nestedOptional?.type).toEqual('MyNestedProps | MyIgnoredNestedProps | undefined');
		expect(nestedOptional?.description).toEqual('optional nested object');
		expect(nestedOptional?.schema).toEqual({
			kind: 'enum',
			type: 'MyNestedProps | MyIgnoredNestedProps | undefined',
			schema: [
				'undefined',
				{
					kind: 'object',
					type: 'MyNestedProps',
					schema: {
						nestedProp: {
							name: 'nestedProp',
							description: 'nested prop documentation',
							tags: [],
							global: false,
							required: true,
							type: 'string',
							declarations: [],
							schema: 'string'
						}
					}
				},
				'MyIgnoredNestedProps',
			]
		});

		expect(array).toBeDefined();
		expect(array?.default).toBeUndefined();
		expect(array?.required).toBeTruthy();
		expect(array?.type).toEqual('MyNestedProps[]');
		expect(array?.description).toEqual('required array object');
		expect(array?.schema).toEqual({
			kind: 'array',
			type: 'MyNestedProps[]',
			schema: [
				{
					kind: 'object',
					type: 'MyNestedProps',
					schema: {
						nestedProp: {
							name: 'nestedProp',
							description: 'nested prop documentation',
							tags: [],
							global: false,
							required: true,
							type: 'string',
							declarations: [],
							schema: 'string'
						}
					}
				}
			]
		});

		expect(arrayOptional).toBeDefined();
		expect(arrayOptional?.default).toBeUndefined();
		expect(arrayOptional?.required).toBeFalsy();
		expect(arrayOptional?.type).toEqual('MyNestedProps[] | undefined');
		expect(arrayOptional?.description).toEqual('optional array object');
		expect(arrayOptional?.schema).toEqual({
			kind: 'enum',
			type: 'MyNestedProps[] | undefined',
			schema: [
				'undefined',
				{
					kind: 'array',
					type: 'MyNestedProps[]',
					schema: [
						{
							kind: 'object',
							type: 'MyNestedProps',
							schema: {
								nestedProp: {
									name: 'nestedProp',
									description: 'nested prop documentation',
									tags: [],
									global: false,
									required: true,
									type: 'string',
									declarations: [],
									schema: 'string'
								}
							}
						}
					]
				}
			]
		});

		expect(enumValue).toBeDefined();
		expect(enumValue?.default).toBeUndefined();
		expect(enumValue?.required).toBeTruthy();
		expect(enumValue?.type).toEqual('MyEnum');
		expect(enumValue?.description).toEqual('enum value');
		expect(enumValue?.schema).toEqual({
			kind: 'enum',
			type: 'MyEnum',
			schema: ['MyEnum.Small', 'MyEnum.Medium', 'MyEnum.Large']
		});

		expect(inlined).toBeDefined();
		expect(inlined?.default).toBeUndefined();
		expect(inlined?.required).toBeTruthy();
		expect(inlined?.schema).toEqual({
			kind: 'object',
			type: '{ foo: string; }',
			schema: {
				foo: {
					name: 'foo',
					description: '',
					tags: [],
					global: false,
					required: true,
					type: 'string',
					declarations: [],
					schema: 'string'
				}
			}
		});

		expect(literalFromContext).toBeDefined();
		expect(literalFromContext?.default).toBeUndefined();
		expect(literalFromContext?.required).toBeTruthy();
		expect(literalFromContext?.type).toEqual('"Uncategorized" | "Content" | "Interaction" | "Display" | "Forms" | "Addons"');
		expect(literalFromContext?.description).toEqual('literal type alias that require context');
		expect(literalFromContext?.schema).toEqual({
			kind: 'enum',
			type: '"Uncategorized" | "Content" | "Interaction" | "Display" | "Forms" | "Addons"',
			schema: [
				'"Uncategorized"',
				'"Content"',
				'"Interaction"',
				'"Display"',
				'"Forms"',
				'"Addons"'
			]
		});

		expect(recursive).toBeDefined();
		expect(recursive?.default).toBeUndefined();
		expect(recursive?.required).toBeTruthy();
		expect(recursive?.type).toEqual('MyNestedRecursiveProps');
		expect(recursive?.schema).toEqual({
			kind: 'object',
			type: 'MyNestedRecursiveProps',
			schema: {
				recursive: {
					name: 'recursive',
					description: '',
					tags: [],
					global: false,
					required: true,
					type: 'MyNestedRecursiveProps',
					declarations: [],
					schema: 'MyNestedRecursiveProps'
				}
			}
		});
	});

});

const checkerOptions: MetaCheckerOptions = {
	forceUseTs: true,
	noDeclarations: true,
	schema: { ignore: ['MyIgnoredNestedProps'] },
	printer: { newLine: 1 },
};
const tsconfigChecker = createComponentMetaChecker(
	path.resolve(__dirname, '../vue-component-meta/tsconfig.json'),
	checkerOptions,
);
console.log(' absolutePathToProjectRoot', path.resolve(__dirname, '../vue-component-meta/tsconfig.json'));
const noTsConfigChecker = createComponentMetaCheckerByJsonConfig(
	path.resolve(__dirname, '../vue-component-meta'),
	{
		"extends": "../tsconfig.json",
		"include": [
			"**/*",
		],
	},
	checkerOptions,
);

worker(tsconfigChecker, true);
worker(noTsConfigChecker, false);
