"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
const setup_1 = require("../setup");
describe('User API Integration Tests', () => {
    describe('POST /api/users/register', () => {
        it('should create a new user with valid data', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'Password123',
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users/register')
                .send(userData)
                .expect(201);
            expect(response.body).toHaveProperty('message', 'User created successfully');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.name).toBe(userData.name);
            expect(response.body.user).not.toHaveProperty('password');
            const createdUser = await setup_1.prisma.user.findUnique({
                where: { email: userData.email },
            });
            expect(createdUser).toBeTruthy();
            expect(createdUser?.email).toBe(userData.email);
        });
        it('should return 400 for invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                name: 'Test User',
                password: 'Password123',
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users/register')
                .send(userData)
                .expect(400);
            expect(response.body).toHaveProperty('errors');
            expect(response.body.errors).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    msg: 'Please provide a valid email',
                }),
            ]));
        });
        it('should return 400 for weak password', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: '123',
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users/register')
                .send(userData)
                .expect(400);
            expect(response.body).toHaveProperty('errors');
            expect(response.body.errors).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    msg: 'Password must be at least 6 characters long',
                }),
            ]));
        });
        it('should return 409 for duplicate email', async () => {
            const userData = {
                email: 'duplicate@example.com',
                name: 'Test User',
                password: 'Password123',
            };
            await (0, supertest_1.default)(app_1.default)
                .post('/api/users/register')
                .send(userData)
                .expect(201);
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users/register')
                .send(userData)
                .expect(409);
            expect(response.body).toHaveProperty('message', 'Email already exists');
        });
    });
    describe('POST /api/users/login', () => {
        beforeEach(async () => {
            await (0, supertest_1.default)(app_1.default)
                .post('/api/users/register')
                .send({
                email: 'login@example.com',
                name: 'Login User',
                password: 'Password123',
            });
        });
        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'Password123',
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users/login')
                .send(loginData)
                .expect(200);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).not.toHaveProperty('password');
            expect(typeof response.body.token).toBe('string');
        });
        it('should return 401 for invalid email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'Password123',
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users/login')
                .send(loginData)
                .expect(401);
            expect(response.body).toHaveProperty('message', 'Invalid credentials');
        });
        it('should return 401 for invalid password', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'WrongPassword',
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users/login')
                .send(loginData)
                .expect(401);
            expect(response.body).toHaveProperty('message', 'Invalid credentials');
        });
        it('should return 400 for missing fields', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users/login')
                .send({})
                .expect(400);
            expect(response.body).toHaveProperty('errors');
        });
    });
    describe('GET /api/users/profile', () => {
        let authToken;
        let userId;
        beforeEach(async () => {
            const registerResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/users/register')
                .send({
                email: 'profile@example.com',
                name: 'Profile User',
                password: 'Password123',
            });
            userId = registerResponse.body.user.id;
            const loginResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/users/login')
                .send({
                email: 'profile@example.com',
                password: 'Password123',
            });
            authToken = loginResponse.body.token;
        });
        it('should get user profile with valid token', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.id).toBe(userId);
            expect(response.body.user.email).toBe('profile@example.com');
            expect(response.body.user).not.toHaveProperty('password');
        });
        it('should return 401 without token', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/users/profile')
                .expect(401);
            expect(response.body).toHaveProperty('message', 'Access token required');
        });
        it('should return 403 with invalid token', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/users/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(403);
            expect(response.body).toHaveProperty('message', 'Invalid or expired token');
        });
    });
});
//# sourceMappingURL=users.test.js.map