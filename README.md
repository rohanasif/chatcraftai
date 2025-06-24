# ChatCraftAI

A real-time, AI-augmented messaging platform built with Node.js, TypeScript, Express, PostgreSQL, Redis, OpenAI SDK, WebSocket, and Next.js.

## Overview

ChatCraftAI is a modern messaging platform that combines real-time communication with AI-powered features to enhance user experience. The platform supports both 1:1 conversations and group chats, with intelligent features like grammar correction, quick reply suggestions, and conversation analytics.

## User Roles & Permissions

### Admin Users

- **Group Management**: Create, edit, and delete group conversations
- **User Management**: View all users, update user roles, and delete users
- **Access Control**: Full access to all platform features
- **Admin Dashboard**: Dedicated interface for managing users and groups

### Regular Users

- **1:1 Conversations**: Start direct chats with other users
- **Group Participation**: Join public groups and participate in conversations
- **Limited Access**: Cannot create or manage groups

## User Flow

### Sign Up & Sign In

- New users register with email, password, display name, and optional avatar
- Registered users log in and land on their Conversations dashboard
- Admin users have additional "Admin Dashboard" access

### Conversation Management

- **1:1 Chat**: Click "New Chat," select another user by email or username to start a private conversation
- **Group Chats**: Managed exclusively by Admin users. Admins create and configure all group conversations (sets title, invites users, controls public/private status)
- **Group Discovery**: All users can view and join existing public groups from the dashboard without requiring an invitation
- **Dashboard** lists all conversations with:
  - Title (or other user's name for 1:1 chats)
  - Last message snippet
  - Unread message count badge

### Real-Time Messaging

- Enter a conversation: message feed auto-loads recent history and listens for new messages via WebSocket
- Typing indicators show when others are typing
- Presence: Avatars of currently online conversation members

### AI-Powered Enhancements

- **Inline Grammar Correction**: As you type, underlined errors appear; hover or press a shortcut to accept corrections
- **Quick-Reply Suggestions**: Click the "🤖" button to fetch 3–5 AI-generated reply options based on the last few messages. Click to send
- **Post-Chat Summaries**: If a conversation is inactive for 1 hour, an AI-generated summary and sentiment chart become available in the Analytics tab

### Analytics & Insights

Within each conversation (accessible to all conversation members):

- **Summary**: 2–3 sentence overview of the chat (available after 1 hour of inactivity)
- **Stats**: Total messages, word count, number of AI suggestions used
- **Sentiment Analysis**: Breakdown of positive, neutral, and negative messages
- **Sentiment Timeline Chart**: Visual representation of sentiment changes over time with message count correlation

### Admin Features

- **User Management**: View all users, change user roles (admin/user), delete users
- **Group Management**: Create, edit, and delete groups, control public/private status
- **Admin Dashboard**: Centralized interface for all administrative tasks

## Technical Stack

### Backend

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (v15+) with Prisma ORM
- **Cache**: Redis (v7+)
- **AI**: OpenAI Node.js SDK
- **Real-time**: WebSocket (ws)
- **Authentication**: JWT with HttpOnly cookies
- **Authorization**: Role-based access control (RBAC)

### Frontend

- **Framework**: Next.js (v15+)
- **Language**: TypeScript
- **UI**: React (v19+)
- **Styling**: Tailwind CSS v4 + Material-UI (MUI)
- **State Management**: React Context API
- **Real-time**: WebSocket client (ws)
- **Charts**: Chart.js with react-chartjs-2
- **Role-based UI**: Conditional rendering based on user permissions

### DevOps

- **Containerization**: Docker & Docker Compose
- **Testing**: Jest, React Testing Library, PGlite for database testing
- **Linting**: ESLint v9
- **Database Migrations**: Prisma Migrate
- **Code Quality**: Prettier, lint-staged, husky

## Project Structure

```
chatcraftai/
├── backend/           # Node.js API server
│   ├── routes/        # API endpoints
│   ├── middleware/    # Express middleware (auth, admin)
│   ├── services/      # Business logic
│   ├── prisma/        # Database schema & migrations
│   ├── scripts/       # Database seeding
│   └── server.ts      # Main server file
├── frontend/          # Next.js React app
│   ├── src/
│   │   ├── app/       # Next.js app router
│   │   ├── components/ # React components
│   │   │   ├── admin/  # Admin-specific components
│   │   │   ├── chat/   # Chat components
│   │   │   └── ui/     # UI components
│   │   ├── contexts/   # React contexts
│   │   ├── services/   # API & WebSocket services
│   │   └── types/      # TypeScript types
│   └── package.json
├── docker/            # Docker configuration
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   └── nginx/nginx.conf
├── tests/             # Test files
│   ├── src/
│   │   ├── routes/    # Backend API tests
│   │   ├── middleware/ # Middleware tests
│   │   ├── services/  # Service tests
│   │   ├── frontend/  # Frontend component tests
│   │   └── integration/ # End-to-end tests
│   └── package.json
└── README.md
```

## Database Schema

### Production Schema

The main database schema (`backend/prisma/schema.prisma`) includes:

- **Named Relations**: Explicit relation names for better query control
- **Cascade Rules**: Proper `onDelete` cascade rules for data integrity
- **AI Features**: `isAISuggestion` field to track AI-generated messages
- **Full PostgreSQL Features**: Leverages all PostgreSQL capabilities

### Test Schema

The test schema (`tests/prisma/schema.prisma`) is a simplified version optimized for testing:

- **Default Relations**: Uses Prisma's default relation naming
- **No Cascade Rules**: Simplified for PGlite compatibility
- **Core Features Only**: Focuses on essential functionality for testing
- **PGlite Optimized**: Designed for lightweight, file-based PostgreSQL testing

## Setup Instructions

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

#### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatcraftai"

# Redis
REDIS_URL="redis://localhost:6379"

# OpenAI
OPENAI_API_KEY="your_openai_api_key"

# JWT
JWT_SECRET="your_jwt_secret_key"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
```

### Quick Start with Docker

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chatcraftai
   ```

2. **Set up environment variables**

   ```bash
   # Create and edit the environment files
   nano backend/.env
   nano frontend/.env.local
   # Add your configuration values to these files
   ```

3. **Start all services**

   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

4. **Run database migrations**

   ```bash
   docker exec chatcraftai-backend npx prisma migrate deploy
   ```

5. **Seed the database with initial data**

   ```bash
   docker exec chatcraftai-backend npm run prisma:seed
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432
   - Redis: localhost:6379

> **Important**: After starting the containers, you must seed the database to have initial users and data. Run:
>
> ```bash
> docker exec chatcraftai-backend npm run prisma:seed
> ```

### Default Users

After seeding the database, you'll have access to these default accounts:

#### Admin User

- **Email**: admin@chatcraft.com
- **Password**: admin123
- **Role**: Admin (full access to all features)

#### Regular Users

- **Email**: user1@chatcraft.com
- **Password**: user123
- **Role**: User (limited access)

- **Email**: user2@chatcraft.com
- **Password**: user123
- **Role**: User (limited access)

### Manual Setup

1. **Backend Setup**

   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run prisma:seed
   npm run dev
   ```

2. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Admin Only

- `GET /api/auth/admin/users` - Get all users
- `PUT /api/auth/admin/users/:userId/role` - Update user role
- `DELETE /api/auth/admin/users/:userId` - Delete user
- `GET /api/conversations/admin/groups` - Get all groups
- `PUT /api/conversations/admin/groups/:groupId` - Update group
- `DELETE /api/conversations/admin/groups/:groupId` - Delete group

### Conversations

- `GET /api/conversations/:userId` - Get user conversations
- `POST /api/conversations/direct` - Create direct chat
- `POST /api/conversations/group` - Create group (admin only)
- `GET /api/conversations/discover/:userId` - Discover public groups
- `POST /api/conversations/:groupId/join` - Join group

### Messages

- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages/:conversationId` - Send message
- `GET /api/messages/:conversationId/analytics` - Get analytics

### Invitations

- `POST /api/invitations/:groupId` - Send group invitation
- `GET /api/invitations/:token` - Validate invitation token
- `POST /api/invitations/:token/accept` - Accept invitation

## Features

### Core Features

- ✅ Real-time messaging with WebSocket
- ✅ User authentication with JWT
- ✅ Role-based access control (Admin/User)
- ✅ 1:1 and group conversations
- ✅ Group discovery and joining
- ✅ Message history and persistence
- ✅ Typing indicators
- ✅ Online presence
- ✅ Group invitations via email

### Admin Features

- ✅ Admin dashboard for user management
- ✅ Group creation and management
- ✅ User role management
- ✅ Public/private group control
- ✅ User deletion capabilities

### AI Features

- ✅ Grammar correction
- ✅ Quick reply suggestions
- ✅ Conversation analytics with AI-powered summary
- ✅ Sentiment analysis with timeline visualization
- ✅ Redis caching for improved performance

### UI/UX Features

- ✅ Responsive design with Material-UI
- ✅ Dark/light theme support
- ✅ Real-time updates
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Interactive charts and analytics

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Integration tests
cd tests
npm test
```

### Database Migrations

```bash
cd backend
npx prisma migrate dev    # Create and apply migration
npx prisma generate       # Generate Prisma client
npx prisma studio         # Open database GUI
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formatting
npm run format
```

## Deployment

### Production Docker

```bash
docker compose -f docker/docker-compose.prod.yml up -d
```

### Environment Variables for Production

Make sure to set appropriate production values for:

- `JWT_SECRET` (use a strong, random string)
- `DATABASE_URL` (production database)
- `REDIS_URL` (production Redis)
- `OPENAI_API_KEY` (valid OpenAI API key)
- `NODE_ENV=production`
- `FRONTEND_URL` (production frontend URL)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
