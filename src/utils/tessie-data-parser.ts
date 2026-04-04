import { 
  TessieDataFile, 
  TessieDataRecord, 
  ValidationResult 
} from '../types/tessie-data.types';
import { TessieDataValidator } from './tessie-data-validator';

export class TessieDataParser {
  static parseFile(rawData: string): { 
    file?: TessieDataFile, 
    validationResult: ValidationResult 
  } {
    try {
      // Parse JSON
      const parsedData: TessieDataFile = JSON.parse(rawData);

      // Validate parsed data
      const validationResult = TessieDataValidator.validateFile(parsedData);

      // Return parsed file if valid
      return {
        file: validationResult.isValid ? parsedData : undefined,
        validationResult
      };
    } catch (error) {
      // Handle JSON parsing errors
      return {
        validationResult: {
          isValid: false,
          errors: [
            'Invalid JSON format',
            error instanceof Error ? error.message : 'Unknown parsing error'
          ]
        }
      };
    }
  }

  static parseRecord(rawRecord: string): { 
    record?: TessieDataRecord, 
    validationResult: ValidationResult 
  } {
    try {
      // Parse JSON record
      const parsedRecord: TessieDataRecord = JSON.parse(rawRecord);

      // Validate parsed record
      const recordErrors = TessieDataValidator.validateRecord(parsedRecord);

      // Prepare validation result
      const validationResult: ValidationResult = {
        isValid: recordErrors.length === 0,
        errors: recordErrors
      };

      // Return parsed record if valid
      return {
        record: validationResult.isValid ? parsedRecord : undefined,
        validationResult
      };
    } catch (error) {
      // Handle JSON parsing errors
      return {
        validationResult: {
          isValid: false,
          errors: [
            'Invalid record JSON format',
            error instanceof Error ? error.message : 'Unknown record parsing error'
          ]
        }
      };
    }
  }
}