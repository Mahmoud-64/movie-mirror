import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let service: { register: jest.Mock; login: jest.Mock };
  let controller: AuthController;

  beforeEach(() => {
    service = {
      register: jest.fn().mockResolvedValue({ accessToken: 't1' }),
      login: jest.fn().mockResolvedValue({ accessToken: 't2' }),
    };
    controller = new AuthController(service as unknown as AuthService);
  });

  it('delegates register', async () => {
    await expect(
      controller.register({ email: 'a@b.com', password: 'password123' }),
    ).resolves.toEqual({
      accessToken: 't1',
    });
    expect(service.register).toHaveBeenCalledWith('a@b.com', 'password123');
  });

  it('delegates login', async () => {
    await expect(controller.login({ email: 'a@b.com', password: 'password123' })).resolves.toEqual({
      accessToken: 't2',
    });
    expect(service.login).toHaveBeenCalledWith('a@b.com', 'password123');
  });
});
