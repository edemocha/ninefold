import { FAMILIES, type Family, type Layer } from './manifest';

type Schema = Record<string, unknown>;

/** The schema for one snippet: a string, or an object of plain-text fields. */
function item(family: Family): Schema {
  if (!family.fields) return { type: 'string', minLength: 1 };
  return {
    type: 'object',
    additionalProperties: false,
    required: [...family.fields],
    properties: Object.fromEntries(
      family.fields.map((field) => {
        const allowed = family.enums?.[field];
        return [field, allowed ? { type: 'string', enum: [...allowed] } : { type: 'string', minLength: 1 }];
      }),
    ),
  };
}

function leaf(family: Family, keys: string[]): Schema {
  const last = keys[keys.length - 1] as string;
  const count = family.variants?.[last];
  if (count !== undefined) {
    return { type: 'array', minItems: count, maxItems: count, items: item(family) };
  }
  return item(family);
}

function node(family: Family, depth: number, keys: string[]): Schema {
  if (depth === family.axes.length) return leaf(family, keys);
  const axis = family.axes[depth] as readonly string[];
  return {
    type: 'object',
    additionalProperties: false,
    required: [...axis],
    properties: Object.fromEntries(axis.map((k) => [k, node(family, depth + 1, [...keys, k])])),
  };
}

type Trie = { schema?: Schema; children: Map<string, Trie> };

function insert(root: Trie, path: string[], schema: Schema): void {
  let cur = root;
  for (const part of path) {
    let next = cur.children.get(part);
    if (!next) {
      next = { children: new Map() };
      cur.children.set(part, next);
    }
    cur = next;
  }
  cur.schema = schema;
}

function toSchema(t: Trie): Schema {
  if (t.schema) return t.schema;
  const keys = [...t.children.keys()];
  return {
    type: 'object',
    additionalProperties: false,
    required: keys,
    properties: Object.fromEntries(keys.map((k) => [k, toSchema(t.children.get(k) as Trie)])),
  };
}

/** The JSON Schema for one released layer, generated from the manifest. */
export function layerSchema(layer: Layer): Schema {
  const root: Trie = { children: new Map() };
  for (const family of FAMILIES.filter((f) => f.layer === layer)) {
    insert(root, family.path, node(family, 0, []));
  }
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://numerology.invalid/schema/${layer}.schema.json`,
    title: `Numerology content layer: ${layer}`,
    ...toSchema(root),
  };
}

/** The core layer holds the theme words every layer uses. */
export function coreSchema(): Schema {
  const theme = {
    type: 'object',
    additionalProperties: false,
    required: ['adj', 'activity', 'stage', 'tile'],
    properties: {
      adj: { type: 'string', minLength: 1 },
      activity: { type: 'string', minLength: 1 },
      stage: { type: 'string', minLength: 1 },
      tile: { type: 'string', minLength: 1 },
    },
  };
  const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '22', '33'];
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://numerology.invalid/schema/core.schema.json',
    title: 'Numerology content layer: core',
    type: 'object',
    additionalProperties: false,
    required: ['themes'],
    properties: {
      themes: {
        type: 'object',
        additionalProperties: false,
        required: values,
        properties: Object.fromEntries(values.map((v) => [v, theme])),
      },
    },
  };
}

export function allSchemas(): Record<'core' | Layer, Schema> {
  return {
    core: coreSchema(),
    life: layerSchema('life'),
    year: layerSchema('year'),
    month: layerSchema('month'),
    day: layerSchema('day'),
  };
}
