import { buildDataSourceOptions } from './typeorm-options';

describe('buildDataSourceOptions', () => {
  it('builds postgres options with schema sync enabled', () => {
    const options = buildDataSourceOptions('postgres://user:pass@localhost:5432/db');

    expect(options.type).toBe('postgres');
    expect(options).toMatchObject({
      url: 'postgres://user:pass@localhost:5432/db',
      synchronize: true,
    });
  });
});
