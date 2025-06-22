# ChatCraftAI Backend Tests

This directory contains comprehensive tests for the ChatCraftAI backend application. The tests are organized to cover all major components including authentication, conversations, messages, invitations, middleware, and services.

## Test Structure

```
tests/
├── src/
│   ├── routes/           # API route tests
│   │   ├── auth.test.ts
│   │   ├── conversations.test.ts
│   │   ├── messages.test.ts
│   │   └── invitations.test.ts
│   ├── middleware/       # Middleware tests
│   │   └── auth.test.ts
│   ├── services/         # Service tests
│   │   ├── aiService.test.ts
│   │   └── emailService.test.ts
│   ├── integration/      # Integration tests
│   │   ├── app.test.ts
│   │   └── pglite-setup.test.ts
│   ├── utils/            # Test utilities
│   │   ├── testUtils.ts
│   │   └── pgliteTestUtils.ts
│   ├── setup-backend.ts  # Backend test setup
│   └── setup-frontend.ts # Frontend test setup
├── prisma/               # Test database schema
│   └── schema.prisma
├── jest.config.ts        # Jest configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Test dependencies
└── README.md            # This file
```

## Test Coverage

### Authentication Routes (`auth.test.ts`)

- User registration with validation
- User login with credential verification
- JWT token generation and validation
- User logout functionality
- Current user retrieval
- Error handling for invalid credentials
- Password hashing verification

### Conversation Routes (`conversations.test.ts`)

- Direct chat creation between users
- Group chat creation with multiple members
- Public group discovery
- Group joining functionality
- Conversation listing for users
- Unread message counting
- Conversation read status management
- Error handling for invalid operations

### Message Routes (`messages.test.ts`)

- Message retrieval with pagination
- Message analytics and statistics
- Message read status tracking
- AI-powered reply suggestions
- Conversation summarization
- Error handling for message operations

### Invitation Routes (`invitations.test.ts`)

- Group invitation sending
- Invitation token validation
- Invitation acceptance workflow
- Permission checking for group creators
- Error handling for invalid invitations

### Authentication Middleware (`auth.test.ts`)

- JWT token validation
- Cookie-based authentication
- Authorization header parsing
- Token expiration handling
- Admin role verification
- Error responses for invalid tokens

### AI Service (`aiService.test.ts`)

- Grammar correction functionality
- Reply suggestion generation
- Conversation summarization
- Redis caching integration
- OpenAI API integration
- Error handling for API failures

### Email Service (`emailService.test.ts`)

- Group invitation email sending
- Invitation token generation and validation
- Token expiration handling
- Error handling for invalid tokens

### Integration Tests (`app.test.ts`)

- Complete user workflows
- End-to-end API testing
- Health check endpoints
- CORS configuration
- Error handling across the application

### PGlite Database Tests (`pglite-setup.test.ts`)

- Database initialization and setup
- Test data creation and cleanup
- Database reset functionality
- Prisma client integration with pglite

## Prerequisites

Before running the tests, ensure you have:

1. **Node.js** (v18 or higher)
2. **Redis** instance for caching (optional for some tests)
3. **Environment variables** configured

## Environment Setup

Create a `.env` file in the `tests` directory with the following variables:

```env
# Test Redis (optional)
TEST_REDIS_URL="redis://localhost:6379/1"

# JWT Secret for testing
JWT_SECRET="test-jwt-secret-key-for-testing-only"

# OpenAI API Key (for AI service tests)
OPENAI_KEY="test-openai-key"
```

## Database Setup

The tests use **PGlite** for lightweight, file-based PostgreSQL testing. This eliminates the need for a separate PostgreSQL installation:

- **PGlite** creates temporary database files for each test run
- **Automatic cleanup** removes database files after tests complete
- **No external dependencies** required for database testing
- **Fast setup** and teardown for efficient testing

## Installation

Install test dependencies:

```bash
cd tests
npm install
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test Categories

```bash
# Frontend tests only
npm run test:frontend

# Backend tests only
npm run test:backend
```

## Test Utilities

The test utilities provide helper functions for:

### `testUtils.ts`

- Test user creation and management
- Test conversation setup
- Test message creation
- JWT token generation
- Mock setup for external services

### `pgliteTestUtils.ts`

- PGlite database initialization
- Prisma client setup with pglite
- Database schema creation
- Database cleanup and reset
- Connection management

## Key Features

### PGlite Integration

- **Lightweight**: No external PostgreSQL installation required
- **Fast**: In-memory database operations
- **Isolated**: Each test gets a fresh database
- **Automatic cleanup**: Database files are removed after tests

### Test Isolation

- Each test runs with a clean database state
- No test interference or data leakage
- Automatic setup and teardown

### Mock Services

- OpenAI API mocking for AI service tests
- Redis mocking for caching tests
- External service isolation

## Troubleshooting

### Common Issues

1. **PGlite initialization errors**: Ensure you have the latest version of pglite installed
2. **Test timeout errors**: Increase Jest timeout in setup files if needed
3. **Memory issues**: Tests automatically clean up database files, but you can manually delete `test-db-*.db` files if needed

### Debug Mode

Run tests with verbose output:

```bash
npm test -- --verbose
```

### Database Debugging

To inspect the database during tests, you can modify `pgliteTestUtils.ts` to log the database path:

```typescript
console.log("Test database path:", dbPath);
```

## Continuous Integration

The tests are designed to run in CI/CD pipelines. Ensure your CI environment has:

- PostgreSQL service
- Redis service
- Node.js runtime
- Proper environment variables

Example GitHub Actions configuration:

```yaml
- name: Run Backend Tests
  run: |
    cd tests/backend
    npm install
    npm test
  env:
    TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    TEST_REDIS_URL: ${{ secrets.TEST_REDIS_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Use the provided test utilities
3. Add appropriate error handling tests
4. Update this README if adding new test categories
5. Ensure tests are isolated and don't depend on each other
6. Add integration tests for new features

## Coverage Goals

- **Lines**: >90%
- **Functions**: >90%
- **Branches**: >85%
- **Statements**: >90%

Run coverage report to check current coverage:

```bash
npm run test:coverage
```
