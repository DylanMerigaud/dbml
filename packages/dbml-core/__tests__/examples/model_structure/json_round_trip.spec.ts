import Parser from '../../../src/parse/Parser';
import ModelExporter from '../../../src/export/ModelExporter';
import { test, expect, describe } from 'vitest';

// Export a DBML source to JSON, parse that JSON back, and export both databases to DBML.
function roundTrip (source: string): { before: string, after: string } {
  const database = (new Parser()).parse(source, 'dbmlv2');
  const json = ModelExporter.export(database, 'json', { isNormalized: false });
  const parsed = (new Parser()).parse(json, 'json');
  return {
    before: ModelExporter.export(database, 'dbml', { isNormalized: false }),
    after: ModelExporter.export(parsed, 'dbml', { isNormalized: false }),
  };
}

describe('@dbml/core - exported JSON parses back', () => {
  test('a ref between tables of the default schema', () => {
    const { before, after } = roundTrip(`
Table users {
  id integer
  username varchar
}

Table posts {
  id integer [primary key]
  user_id integer
}

Ref: posts.user_id > users.id
`);
    expect(after).toBe(before);
  });

  test('a ref to a table of a schema exported after the ref', () => {
    // The ref and `users` are in the default schema, which is exported before `s`
    const { before, after } = roundTrip(`
Table users {
  id integer [pk]
}

Table s.posts {
  id integer [pk]
  user_id integer
}

Ref: s.posts.user_id > users.id
`);
    expect(after).toBe(before);
  });

  test('a table group', () => {
    const { before, after } = roundTrip(`
Table users {
  id integer [pk]
}

Table posts {
  id integer [pk]
}

TableGroup blog {
  users
  posts
}
`);
    expect(after).toBe(before);
  });

  test('a dep between tables of the default schema', () => {
    const { before, after } = roundTrip(`
Table raw_users {
  id integer [pk]
}

Table stg_users {
  user_id integer [pk]
}

Dep: raw_users.id -> stg_users.user_id
`);
    expect(after).toBe(before);
  });

  test('an enum used by a field', () => {
    const { before, after } = roundTrip(`
Enum s.status {
  active
  inactive
}

Table s.users {
  id integer [pk]
  status s.status
}
`);
    expect(after).toBe(before);
  });
});
