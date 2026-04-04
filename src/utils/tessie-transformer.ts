/**
 * Tessie Data Transformation Utility
 * Provides core data transformation capabilities
 */
export interface TessieTransformOptions {
  ignoreCase?: boolean;
  trimWhitespace?: boolean;
}

export class TessieTransformer {
  private options: TessieTransformOptions;

  constructor(options: TessieTransformOptions = {}) {
    this.options = {
      ignoreCase: options.ignoreCase ?? false,
      trimWhitespace: options.trimWhitespace ?? true
    };
  }

  /**
   * Transform input data based on configured options
   * @param input Raw input data to transform
   * @returns Transformed data
   */
  transform(input: string | any[]): string | any[] {
    // TODO: Implement complex transformation logic
    if (typeof input === 'string') {
      return this.transformString(input);
    }

    if (Array.isArray(input)) {
      return this.transformArray(input);
    }

    return input;
  }

  private transformString(input: string): string {
    let result = input;

    if (this.options.trimWhitespace) {
      result = result.trim();
    }

    if (this.options.ignoreCase) {
      result = result.toLowerCase();
    }

    return result;
  }

  private transformArray(input: any[]): any[] {
    // TODO: Implement array transformation with configurable options
    return input.map(item => 
      typeof item === 'string' ? this.transformString(item) : item
    );
  }
}

/**
 * Convenience function for quick transformations
 * @param input Data to transform
 * @param options Optional transformation settings
 */
export function tessieTransform(
  input: string | any[], 
  options: TessieTransformOptions = {}
): string | any[] {
  const transformer = new TessieTransformer(options);
  return transformer.transform(input);
}
