import { describe, it, expect, vi } from 'vitest';
import { updateStatesVisited } from '../../src/services/state-detection';

describe('updateStatesVisited', () => {
  it('does not reference non-schema last_drive_id column in upsert SQL', async () => {
    const run = vi.fn().mockResolvedValue({ success: true });
    let capturedSql = '';
    const bind = vi.fn().mockReturnValue({ run });
    const db = {
      prepare: vi.fn((sql: string) => {
        capturedSql = sql;
        return { bind };
      })
    };

    await updateStatesVisited(db as any, 'journey-1', 'CA', 'California', 34.05, -118.24, 'drive-1');

    expect(capturedSql).not.toContain('last_drive_id');
    expect(bind).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledOnce();
  });
});
