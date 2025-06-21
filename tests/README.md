# ChatCraftAI Tests

This directory contains all tests for the ChatCraftAI application.

## Structure

```
tests/
├── backend/           # Backend integration tests
│   ├── auth.test.ts   # Authentication tests
│   ├── conversations.test.ts  # Conversation management tests
│   ├── messages.test.ts       # Messaging tests
│   ├── ai.test.ts     # AI service tests
│   └── websocket.test.ts      # WebSocket tests
├── frontend/          # Frontend E2E tests
│   ├── auth.test.ts   # Authentication flow tests
│   ├── chat.test.ts   # Chat functionality tests
│   ├── analytics.test.ts      # Analytics tests
│   └── components.test.ts     # Component tests
└── integration/       # End-to-end integration tests
    ├── user-flow.test.ts      # Complete user journey tests
    └── api.test.ts    # API integration tests
```

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### All Tests

```bash
npm run test:all
```

## Test Coverage

- **Backend**: API endpoints, WebSocket functionality, AI services, database operations
- **Frontend**: User interactions, component rendering, state management
- **Integration**: End-to-end user flows, cross-service communication

## Test Environment

Tests use separate test databases and Redis instances to avoid affecting development data.
