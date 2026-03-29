import { Pool } from 'pg';

export class Database {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async bulkInsert(tableName: string, records: any[]): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const columns = Object.keys(records[0]).join(', ');
      const values = records.map(record => 
        '(${Object.values(record).map(v => ''${v}'').join(', ')})'
      ).join(', ');

      const query = 'INSERT INTO ${tableName} (${columns}) VALUES ${values}';
      
      await client.query(query);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Bulk insert failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}