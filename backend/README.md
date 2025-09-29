# Express.js Server with Prisma - TDD Project

A robust Express.js server built with TypeScript, Prisma ORM, and following Test-Driven Development (TDD) principles. This project includes separate databases for development, testing, and production environments with comprehensive integration tests.

## Features

- 🚀 **Express.js** with TypeScript
- 🗄️ **Prisma ORM** with PostgreSQL
- 🔒 **JWT Authentication** with bcrypt password hashing
- 🧪 **Test-Driven Development** with Jest and Supertest
- 🔧 **Separate Database Environments** (dev/test/prod)
- ✅ **Integration Tests** against real test database (no mocking)
- 🛡️ **Security Middleware** (Helmet, CORS, Rate Limiting)
- 📝 **Request Validation** with express-validator
- 🔄 **Database Migrations** and seeding
- 📊 **Health Check Endpoint**
- 🎯 **Clean Architecture** with separation of concerns

## Project Structure

```
├── src/
│   ├── controllers/          # Request handlers
│   ├── services/            # Business logic
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── config.ts           # Configuration management
│   ├── database.ts         # Database connection
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── tests/
│   ├── integration/        # Integration tests
│   ├── unit/              # Unit tests
│   └── setup.ts           # Test setup and configuration
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding
└── ...configuration files
```

## Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database
- npm or yarn

## Installation

1. **Clone the repository** (if applicable)
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/express_prisma_dev"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

4. **Create databases**
```bash
# Create development database
createdb express_prisma_dev

# Create test database  
createdb express_prisma_test
```

5. **Run database migrations**
```bash
npm run db:migrate
```

6. **Seed the database** (optional)
```bash
npm run db:seed
```

## Scripts

### Development
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
```

### Database Management
```bash
npm run db:migrate        # Run database migrations (development)
npm run db:migrate:test   # Run database migrations (test)
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset development database
npm run db:reset:test    # Reset test database
npm run db:generate      # Generate Prisma client
npm run db:studio       # Open Prisma Studio
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:integration # Run only integration tests
npm run test:unit        # Run only unit tests
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user

### Users (Protected)
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/` - Get all users (Admin only)
- `PUT /api/users/:id` - Update user (Owner or Admin)
- `DELETE /api/users/:id` - Delete user (Owner or Admin)

### Health Check
- `GET /health` - Application health status

## Testing Strategy

This project follows **Test-Driven Development (TDD)** principles:

1. **Write failing tests first**
2. **Implement minimum code to pass tests**
3. **Refactor while keeping tests green**

### Test Types

- **Integration Tests**: Test complete API endpoints against real test database
- **Unit Tests**: Test individual services and functions in isolation

### Test Environment

- Uses a **separate test database** to avoid affecting development data
- **No mocking** in integration tests for realistic testing
- Automatic database cleanup between tests
- Test database is reset before each test run

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Database Schema

The project includes a sample schema with:

- **Users** - User accounts with authentication
- **Posts** - Blog posts associated with users
- **Roles** - USER and ADMIN roles

### Sample Data

The seed script creates:
- Admin user: `admin@example.com` (password: `admin123`)
- Regular user: `user@example.com` (password: `user123`)
- Sample blog posts

## Security Features

- **JWT Authentication** with secure token generation
- **Password Hashing** using bcrypt with salt rounds
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for cross-origin requests
- **Helmet** for security headers
- **Input Validation** with express-validator
- **SQL Injection Protection** via Prisma ORM

## Environment Configuration

The application supports multiple environments:

- **Development**: Local development with detailed logging
- **Test**: Isolated testing environment with separate database
- **Production**: Optimized for production deployment

Each environment has its own configuration file (`.env.development`, `.env.test`, `.env.production`).

## Error Handling

- Centralized error handling middleware
- Proper HTTP status codes
- Detailed error messages in development
- Sanitized error responses in production
- Prisma error mapping for common database errors

## Development Workflow

1. **Write a failing test** for the new feature
2. **Run the test** to confirm it fails
3. **Implement the minimum code** to make the test pass
4. **Run all tests** to ensure nothing breaks
5. **Refactor the code** if needed while keeping tests green
6. **Commit the changes**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Implement the feature
5. Ensure all tests pass
6. Submit a pull request

## Deployment

### Production Setup

1. Set up production PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Build the application
5. Start the production server

```bash
# Production build
npm run build

# Run migrations in production
DATABASE_URL="production-db-url" npx prisma migrate deploy

# Start production server
NODE_ENV=production npm start
```

## Health Monitoring

The application includes a health check endpoint at `/health` that returns:
- Application status
- Current timestamp
- Environment information

## License

This project is licensed under the MIT License.

## Support

For questions or support, please create an issue in the repository.