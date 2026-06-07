import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let repo: { existsBy: jest.Mock; insert: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    repo = { existsBy: jest.fn(), insert: jest.fn() };
    service = new UsersService(repo as unknown as Repository<User>);
  });

  it('inserts a placeholder user when the id is unknown', async () => {
    repo.existsBy.mockResolvedValue(false);
    await service.ensureExists('user-1');
    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', passwordHash: '' }),
    );
  });

  it('does nothing when the user already exists', async () => {
    repo.existsBy.mockResolvedValue(true);
    await service.ensureExists('user-1');
    expect(repo.insert).not.toHaveBeenCalled();
  });
});
