import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async ensureExists(id: string): Promise<void> {
    if (!(await this.users.existsBy({ id }))) {
      await this.users.insert({ id, email: `${id}@placeholder.local`, passwordHash: '' });
    }
  }
}
