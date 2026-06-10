import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let repo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((input) => input),
      save: jest.fn((user) => Promise.resolve({ id: 'user-1', ...user })),
    };
    service = new UsersService(repo as unknown as Repository<User>);
  });

  it('finds a user by email', async () => {
    repo.findOne.mockResolvedValue({ id: 'user-1' });
    await expect(service.findByEmail('a@b.com')).resolves.toEqual({ id: 'user-1' });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
  });

  it('creates a user with the default role', async () => {
    const user = await service.createUser('a@b.com', 'hash');
    expect(repo.create).toHaveBeenCalledWith({
      email: 'a@b.com',
      passwordHash: 'hash',
      role: UserRole.USER,
    });
    expect(user).toMatchObject({ id: 'user-1' });
  });
});
