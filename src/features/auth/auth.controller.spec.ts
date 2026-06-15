import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('delegates to authService and returns auth response', async () => {
      const dto = {
        email: 'parent@example.com',
        password: 'password123',
        role: Role.PARENT,
      };
      const response = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { id: '1', email: dto.email, role: Role.PARENT },
      };
      authServiceMock.register.mockResolvedValue(response);

      await expect(controller.register(dto)).resolves.toEqual(response);
      expect(authServiceMock.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('delegates to authService and returns auth response', async () => {
      const dto = { email: 'parent@example.com', password: 'password123' };
      const response = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { id: '1', email: dto.email, role: Role.PARENT },
      };
      authServiceMock.login.mockResolvedValue(response);

      await expect(controller.login(dto)).resolves.toEqual(response);
      expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('getCurrentUser', () => {
    it('returns user info from JWT payload', async () => {
      const payload = {
        sub: 'user-1',
        email: 'parent@example.com',
        role: Role.PARENT,
      };

      await expect(controller.getCurrentUser(payload)).resolves.toEqual({
        id: 'user-1',
        email: 'parent@example.com',
        role: Role.PARENT,
      });
    });
  });
});
