import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const snapshotPath = path.resolve(__dirname, 'schema-canonical.snapshot.json');
const schemaPath = path.resolve(__dirname, '../../../shared/schemas/canonical/event-types.ts');

describe('Canonical schema snapshot', () => {
  it('matches the recorded sha256 hash', () => {
    const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8')) as {
      schemaFile: string;
      sha256: string;
    };

    const schemaContents = readFileSync(schemaPath, 'utf-8');
    const hash = createHash('sha256').update(schemaContents).digest('hex');

    expect(hash).toEqual(snapshot.sha256);
  });
});