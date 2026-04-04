import { getConnection, Repository } from 'typeorm';

interface CanonicalEntity {
  id: number;
  name: string;
  [key: string]: any;
}

async function populateCanonicalTable<
  T extends CanonicalEntity
>(repository: Repository<T>, data: Partial<T>[]): Promise<void> {
  const manager = getConnection().manager;
  for (const item of data) {
    const existing = await repository.findOne({ where: { id: item.id } });
    if (existing) {
      await repository.merge(existing, item);
      await repository.save(existing);
    } else {
      const newItem = repository.create(item);
      await repository.save(newItem);
    }
  }
}

async function run() {
  try {
    await getConnection();

    // Example: populate canonical tables
    // Adjust imports and repository calls according to your entities
    const countryRepo = getConnection().getRepository('Country'); // replace 'Country' with your entity name
    const countries: Partial<{ id: number; name: string; code: string }>[] = [
      { id: 1, name: 'United States', code: 'US' },
      { id: 2, name: 'Canada', code: 'CA' },
      { id: 3, name: 'Mexico', code: 'MX' },
    ];
    await populateCanonicalTable(countryRepo, countries);

    const currencyRepo = getConnection().getRepository('Currency'); // replace 'Currency'
    const currencies: Partial<{ id: number; name: string; symbol: string }>[] = [
      { id: 1, name: 'US Dollar', symbol: '$' },
      { id: 2, name: 'Euro', symbol: '€' },
      { id: 3, name: 'Canadian Dollar', symbol: 'C$' },
    ];
    await populateCanonicalTable(currencyRepo, currencies);

    console.log('Canonical tables populated successfully');
    await getConnection().close();
  } catch (error) {
    console.error('Error populating canonical tables:', error);
    process.exit(1);
  }

  // Execute immediately
  run();
}
