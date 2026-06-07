import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let users: { findByEmail: jest.Mock; createUser: jest.Mock };
  let jwt: { sign: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    users = { findByEmail: jest.fn(), createUser: jest.fn() };
    jwt = { sign: jest.fn().mockReturnValue('signed-token') };
    service = new AuthService(users as unknown as UsersService, jwt as unknown as JwtService);
  });

  describe('register', () => {
    it('hashes the password, creates the user and returns a token', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.createUser.mockResolvedValue({ id: 'user-1', role: 'user' });

      const result = await service.register('a@b.com', 'password123');

      const [, hash] = users.createUser.mock.calls[0];
      expect(await bcrypt.compare('password123', hash)).toBe(true);
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'user-1', role: 'user' });
      expect(result).toEqual({ accessToken: 'signed-token' });
    });

    it('rejects an already-registered email', async () => {
      users.findByEmail.mockResolvedValue({ id: 'existing' });
      await expect(service.register('a@b.com', 'password123')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      users.findByEmail.mockResolvedValue({ id: 'user-1', role: 'admin', passwordHash });

      const result = await service.login('a@b.com', 'password123');

      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'user-1', role: 'admin' });
      expect(result).toEqual({ accessToken: 'signed-token' });
    });

    it('rejects an unknown email', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(service.login('a@b.com', 'x')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      users.findByEmail.mockResolvedValue({ id: 'user-1', role: 'user', passwordHash });
      await expect(service.login('a@b.com', 'wrong-password')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
