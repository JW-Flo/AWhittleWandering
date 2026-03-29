import { MongoClient, Db } from 'mongodb';

export class Database {
  private client: MongoClient;
  private dbName: string;

  constructor(connectionString: string, dbName: string) {
    this.client = new MongoClient(connectionString);
    this.dbName = dbName;
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('Connected to database successfully');
    } catch (error) {
      console.error('Database connection failed', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Failed to close database connection', error);
    }
  }

  collection(name: string) {
    return this.client.db(this.dbName).collection(name);
  }
}