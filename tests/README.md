# ChatCraftAI Tests

This directory contains comprehensive tests for the ChatCraftAI application, covering both backend and frontend components. The tests are organized to cover all major components including authentication, conversations, messages, invitations, middleware, services, and frontend components.

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
│   ├── frontend/         # Frontend component tests
│   │   ├── Avatar.test.tsx
│   │   ├── Button.test.tsx
│   │   ├── ChatHeader.test.tsx
│   │   ├── ConversationAnalytics.test.tsx
│   │   ├── Input.test.tsx
│   │   ├── MessageInput.test.tsx
│   │   ├── MessageList.test.tsx
│   │   └── Sidebar.test.tsx
│   ├── integration/      # Integration tests
│   │   └── app.test.ts
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

### Backend Tests

#### Authentication Routes (`auth.test.ts`)

- User registration with validation
- User login with credential verification
- JWT token generation and validation
- User logout functionality
- Current user retrieval
- Error handling for invalid credentials
- Password hashing verification

#### Conversation Routes (`conversations.test.ts`)

- Direct chat creation between users
- Group chat creation with multiple members
- Public group discovery
- Group joining functionality
- Conversation listing for users
- Unread message counting
- Conversation read status management
- Error handling for invalid operations

#### Message Routes (`messages.test.ts`)

- Message retrieval with pagination
- Message analytics and statistics
- Message read status tracking
- AI-powered reply suggestions
- Conversation summarization
- Error handling for message operations

#### Invitation Routes (`invitations.test.ts`)

- Group invitation sending
- Invitation token validation
- Invitation acceptance workflow
- Permission checking for group creators
- Error handling for invalid invitations

#### Authentication Middleware (`auth.test.ts`)

- JWT token validation
- Cookie-based authentication
- Authorization header parsing
- Token expiration handling
- Admin role verification
- Error responses for invalid tokens

#### AI Service (`aiService.test.ts`)

- Grammar correction functionality
- Reply suggestion generation
- Conversation summarization
- Redis caching integration
- OpenAI API integration
- Error handling for API failures

#### Email Service (`emailService.test.ts`)

- Group invitation email sending
- Invitation token generation and validation
- Token expiration handling
- Error handling for invalid tokens

#### Integration Tests (`app.test.ts`)

- Complete user workflows
- End-to-end API testing
- Health check endpoints
- CORS configuration
- Error handling across the application

### Frontend Tests

#### Component Tests

- **Avatar.test.tsx**: Avatar component rendering and props
- **Button.test.tsx**: Button component interactions and states
- **ChatHeader.test.tsx**: Chat header functionality and user info
- **ConversationAnalytics.test.tsx**: Analytics charts and data display
- **Input.test.tsx**: Input component validation and events
- **MessageInput.test.tsx**: Message input functionality and AI features
- **MessageList.test.tsx**: Message list rendering and interactions
- **Sidebar.test.tsx**: Sidebar navigation and conversation list

### PGlite Database Tests

- Database initialization and setup
- Test data creation and cleanup
- Database reset functionality
- Prisma client integration with pglite

## Database Schema

### Test Schema vs Production Schema

The test schema (`tests/prisma/schema.prisma`) is a simplified version of the main schema (`backend/prisma/schema.prisma`) designed for testing purposes:

#### Key Differences:

1. **Named Relations**: The test schema uses default relation names instead of explicit named relations
2. **Cascade Rules**: The test schema doesn't include `onDelete` cascade rules
3. **AI Features**: The test schema doesn't include the `isAISuggestion` field
4. **PGlite Compatibility**: The test schema is optimized for PGlite's simplified PostgreSQL implementation

#### Why Simplified?

- **Performance**: Faster test execution with simplified relations
- **Compatibility**: Better compatibility with PGlite's lightweight PostgreSQL
- **Isolation**: Reduced complexity for isolated testing
- **Maintenance**: Easier to maintain test-specific schema changes

The test schema maintains all core functionality while being optimized for the testing environment.

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
OPENAI_API_KEY="test-openai-key"
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

### Cleanup

```bash
# Clean up test database files
npm run cleanup:db

# Full cleanup including cache
npm run cleanup:all
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

### Frontend Testing

- React Testing Library for component testing
- Jest DOM for DOM testing utilities
- User event simulation for interactions
- Component isolation and mocking

## Troubleshooting

### Common Issues

1. **PGlite initialization errors**: Ensure you have the latest version of pglite installed
2. **Test timeout errors**: Increase Jest timeout in setup files if needed
3. **Memory issues**: Tests automatically clean up database files, but you can manually delete `test-db-*.db` files if needed
4. **Frontend test failures**: Ensure all required dependencies are installed

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

### Frontend Test Debugging

For frontend component tests:

```bash
# Run specific component test
npm test -- Avatar.test.tsx

# Run with coverage for specific component
npm test -- Avatar.test.tsx --coverage
```

## Continuous Integration

The tests are designed to run in CI/CD pipelines. Ensure your CI environment has:

- Node.js runtime
- Proper environment variables
- Sufficient memory for PGlite operations

Example GitHub Actions configuration:

```yaml
- name: Run Tests
  run: |
    cd tests
    npm install
    npm test
  env:
    TEST_REDIS_URL: ${{ secrets.TEST_REDIS_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Use the provided test utilities
3. Add appropriate error handling tests
4. Update this README if adding new test categories
5. Ensure tests are isolated and don't depend on each other
6. Add integration tests for new features
7. For frontend components, test both happy path and error scenarios

## Coverage Goals

- **Lines**: >90%
- **Functions**: >90%
- **Branches**: >85%
- **Statements**: >90%

Run coverage report to check current coverage:

```bash
npm run test:coverage
```

## Test Best Practices

### Backend Tests

1. **Use PGlite**: Leverage the lightweight database for fast, isolated tests
2. **Mock External Services**: Mock OpenAI API and Redis for reliable tests
3. **Test Error Scenarios**: Include tests for error conditions and edge cases
4. **Use Test Utilities**: Leverage the provided test utilities for common operations

### Frontend Tests

1. **Test User Interactions**: Use `@testing-library/user-event` for realistic user interactions
2. **Test Component Props**: Verify components handle different prop combinations correctly
3. **Test Error States**: Ensure components handle errors gracefully
4. **Mock External Dependencies**: Mock API calls and WebSocket connections

### Integration Tests

1. **Test Complete Workflows**: Test end-to-end user journeys
2. **Verify API Contracts**: Ensure frontend and backend work together correctly
3. **Test Real-time Features**: Verify WebSocket functionality works as expected
