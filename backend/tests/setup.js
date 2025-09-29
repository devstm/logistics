"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
beforeAll(async () => {
    try {
        (0, child_process_1.execSync)('npx prisma migrate reset --force', {
            env: { ...process.env, NODE_ENV: 'test' },
            stdio: 'inherit',
        });
    }
    catch (error) {
        console.error('Failed to reset test database:', error);
    }
});
afterAll(async () => {
    await prisma.$disconnect();
});
beforeEach(async () => {
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
});
//# sourceMappingURL=setup.js.map