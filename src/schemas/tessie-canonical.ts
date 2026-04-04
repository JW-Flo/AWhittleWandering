/**
 * Canonical Tessie Data Schema
 * Defines core data structures and validation for Tessie entities
 */
export interface TessieCanonical {
  id: string;
  name: string;
  type: 'standard' | 'custom';
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class TessieCanonicalSchema {
  /**
   * Validate Tessie Canonical data
   * @param data Raw input data
   * @returns Validated and normalized Tessie Canonical object
   */
  static validate(data: Partial<TessieCanonical>): TessieCanonical {
    // TODO: Implement comprehensive validation logic
    if (!data.id) {
      throw new Error('Tessie Canonical requires an ID');
    }

    return {
      id: data.id,
      name: data.name || '',
      type: data.type || 'standard',
      metadata: data.metadata || {},
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date()
    };
  }
}

export default TessieCanonicalSchema;
