import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TessieAdapter } from '../../../../src/providers/tessie/adapter';
import { CanonicalEventSchema } from '@awhittlewandering/shared/schemas/canonical/event-types';

const basePath = path.join(__dirname, 'raw');

describe('Tessie Adapter Contract (golden)', () => {
  it('maps golden payloads into canonical events', () => {
    const adapter = new TessieAdapter();
    const rawPayload = JSON.parse(
      fs.readFileSync(path.join(basePath, 'drive_sample.json'), 'utf-8')
    );

    const parsed = adapter.parse(rawPayload, 'v1');
    const result = adapter.mapToCanonical(parsed);

    const expected = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'canonical', 'drive_sample.json'), 'utf-8')
    );

    expect(Array.isArray(result.canonicalEvents)).toBe(true);
    CanonicalEventSchema.array().parse(result.canonicalEvents);
    expect(result.canonicalEvents).toEqual(expected);
  });
});