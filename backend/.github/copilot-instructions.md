<!-- Use this file to provide workspace-specific custom instructions to Copilot. -->

# Express.js Server with Prisma - TDD Project

## Project Structure
- Express.js server with TypeScript
- Prisma ORM for database management
- Separate databases for development, testing, and production
- Test-Driven Development approach
- Integration tests running against test database

## Development Guidelines
- Follow TDD principles: write tests first, then implement features
- Use Jest for testing framework
- Use Supertest for API integration tests
- Separate database configurations for each environment
- No mocking in integration tests - use real test database

## Database Strategy
- Development: Local PostgreSQL database
- Testing: Separate test database (automatically created/destroyed)
- Production: Production PostgreSQL database

✅ **Completed Steps:**
- [x] Project requirements clarified
- [x] Copilot instructions created
- [x] Scaffold the project structure
- [x] Set up package.json with dependencies
- [x] Configure Prisma with multiple databases
- [x] Set up testing framework
- [x] Create initial server structure
- [x] Set up environment configurations
- [x] Create sample tests and implementation
- [x] Build system configured

**Next Steps:**
- [ ] Set up PostgreSQL database credentials
- [ ] Run database migrations
- [ ] Start development server
- [ ] Run tests against test database