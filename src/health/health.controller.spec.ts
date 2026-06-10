import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports ok status', () => {
    const result = new HealthController().check();
    expect(result.status).toBe('ok');
    expect(typeof result.timestamp).toBe('string');
  });
});
