"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userService_1 = require("../../src/services/userService");
const setup_1 = require("../setup");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
describe('UserService Unit Tests', () => {
    let userService;
    beforeEach(() => {
        userService = new userService_1.UserService();
    });
    describe('createUser', () => {
        it('should create a new user with hashed password', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123',
            };
            const createdUser = await userService.createUser(userData);
            expect(createdUser).toHaveProperty('id');
            expect(createdUser.email).toBe(userData.email);
            expect(createdUser.name).toBe(userData.name);
            expect(createdUser).not.toHaveProperty('password');
            const userInDb = await setup_1.prisma.user.findUnique({
                where: { id: createdUser.id },
            });
            expect(userInDb?.password).not.toBe(userData.password);
            const isPasswordHashed = await bcryptjs_1.default.compare(userData.password, userInDb.password);
            expect(isPasswordHashed).toBe(true);
        });
        it('should create user with default USER role', async () => {
            const userData = {
                email: 'user@example.com',
                password: 'password123',
            };
            const createdUser = await userService.createUser(userData);
            expect(createdUser.role).toBe('USER');
        });
        it('should create user with ADMIN role when specified', async () => {
            const userData = {
                email: 'admin@example.com',
                password: 'password123',
                role: 'ADMIN',
            };
            const createdUser = await userService.createUser(userData);
            expect(createdUser.role).toBe('ADMIN');
        });
        it('should throw error for duplicate email', async () => {
            const userData = {
                email: 'duplicate@example.com',
                password: 'password123',
            };
            await userService.createUser(userData);
            await expect(userService.createUser(userData)).rejects.toThrow();
        });
    });
    describe('loginUser', () => {
        beforeEach(async () => {
            await userService.createUser({
                email: 'login@example.com',
                name: 'Login User',
                password: 'password123',
            });
        });
        it('should login with correct credentials', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'password123',
            };
            const result = await userService.loginUser(loginData);
            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user.email).toBe(loginData.email);
            expect(result.user).not.toHaveProperty('password');
            expect(typeof result.token).toBe('string');
        });
        it('should throw error for non-existent user', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };
            await expect(userService.loginUser(loginData)).rejects.toThrow('Invalid credentials');
        });
        it('should throw error for incorrect password', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'wrongpassword',
            };
            await expect(userService.loginUser(loginData)).rejects.toThrow('Invalid credentials');
        });
    });
    describe('getUserById', () => {
        let userId;
        beforeEach(async () => {
            const user = await userService.createUser({
                email: 'getuser@example.com',
                name: 'Get User',
                password: 'password123',
            });
            userId = user.id;
        });
        it('should return user without password', async () => {
            const user = await userService.getUserById(userId);
            expect(user).toBeTruthy();
            expect(user?.id).toBe(userId);
            expect(user?.email).toBe('getuser@example.com');
            expect(user).not.toHaveProperty('password');
        });
        it('should return null for non-existent user', async () => {
            const user = await userService.getUserById('non-existent-id');
            expect(user).toBeNull();
        });
    });
    describe('updateUser', () => {
        let userId;
        beforeEach(async () => {
            const user = await userService.createUser({
                email: 'update@example.com',
                name: 'Update User',
                password: 'password123',
            });
            userId = user.id;
        });
        it('should update user name', async () => {
            const updateData = { name: 'Updated Name' };
            const updatedUser = await userService.updateUser(userId, updateData);
            expect(updatedUser.name).toBe('Updated Name');
            expect(updatedUser.email).toBe('update@example.com');
        });
        it('should update user password and hash it', async () => {
            const updateData = { password: 'newpassword123' };
            await userService.updateUser(userId, updateData);
            const userInDb = await setup_1.prisma.user.findUnique({
                where: { id: userId },
            });
            expect(userInDb?.password).not.toBe(updateData.password);
            const isPasswordCorrect = await bcryptjs_1.default.compare(updateData.password, userInDb.password);
            expect(isPasswordCorrect).toBe(true);
        });
        it('should throw error for non-existent user', async () => {
            await expect(userService.updateUser('non-existent-id', { name: 'New Name' })).rejects.toThrow();
        });
    });
    describe('deleteUser', () => {
        let userId;
        beforeEach(async () => {
            const user = await userService.createUser({
                email: 'delete@example.com',
                name: 'Delete User',
                password: 'password123',
            });
            userId = user.id;
        });
        it('should delete user', async () => {
            await userService.deleteUser(userId);
            const deletedUser = await setup_1.prisma.user.findUnique({
                where: { id: userId },
            });
            expect(deletedUser).toBeNull();
        });
        it('should throw error for non-existent user', async () => {
            await expect(userService.deleteUser('non-existent-id')).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=userService.test.js.map