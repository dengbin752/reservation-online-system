# Reservation Online System

A comprehensive online table reservation system built with Node.js, TypeScript, SolidJS, and Couchbase.

## 🏗️ Architecture

This monorepo application follows a service-oriented architecture with the following components:

```
reservation-online-system/
├── docker/                          # Docker configuration files
├── docs/                            # Documentation
├── packages/
│   ├── api/                        # REST API + GraphQL service
│   │   ├── src/
│   │   │   ├── controllers/        # Request handlers
│   │   │   ├── errors/            # Custom error classes
│   │   │   ├── middleware/         # Express middleware
│   │   │   ├── resolvers/          # GraphQL resolvers
│   │   │   ├── routes/             # REST routes
│   │   │   ├── services/           # Business logic
│   │   │   ├── logger.ts           # Logging utility
│   │   │   └── app.ts              # Express app
│   │   └── jest.config.ts          # Test configuration
│   ├── database/                   # Couchbase data layer
│   │   ├── src/
│   │   │   ├── models/             # Data models
│   │   │   ├── repositories/       # Data access
│   │   │   └── connection.ts        # Database connection
│   │   └── jest.config.ts
│   ├── shared/                     # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types/              # TypeScript interfaces
│   │   │   ├── utils/              # Utility functions
│   │   │   ├── interfaces/          # Service interfaces
│   │   │   └── graphql/            # GraphQL schema
│   │   └── jest.config.ts
│   ├── customer-ui/                # Customer-facing SolidJS app
│   │   ├── src/
│   │   │   ├── components/          # Reusable UI components
│   │   │   └── pages/               # Page components
│   │   └── package.json
│   └── admin-ui/                   # Admin Dashboard SolidJS app
│       ├── src/
│       │   ├── pages/               # Admin pages
│       │   └── components/           # Admin components
│       └── package.json
├── scripts/                        # Development scripts
├── docker-compose.yml               # Production Docker Compose
├── docker-compose.dev.yml          # Development Docker Compose
├── package.json                    # Root package.json
├── pnpm-workspace.yaml            # pnpm workspace config
└── README.md
```

## ✨ Features

### Backend
- **RESTful Authentication**: JWT-based authentication with role-based access control
- **GraphQL API**: Flexible queries and mutations for business logic
- **Enhanced Error Handling**: Custom error classes with proper HTTP status codes
- **Structured Logging**: Built-in logging system for debugging and monitoring
- **Input Validation**: Zod schemas for request validation

### Frontend
- **Customer Interface**: Modern SolidJS app for making reservations
- **Admin Dashboard**: Comprehensive reservation management
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

### Database
- **Couchbase**: NoSQL document database
- **Repository Pattern**: Clean data access layer
- **Auto-reconnection**: Automatic database connection management

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-------------|
| Runtime | Node.js 18+ |
| Language | TypeScript 5.x |
| Package Manager | pnpm |
| Backend Framework | Express.js + Apollo Server |
| Database | Couchbase |
| Frontend | SolidJS |
| Styling | Tailwind CSS |
| Testing | Jest + ts-jest |
| Containerization | Docker + Docker Compose |

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- pnpm 10.11.0 or higher
- Docker and Docker Compose

### Quick Start

1. Clone the repository:
```bash
git clone git@github.com:dengbin752/reservation-online-system.git
cd reservation-online-system
```

2. Start the development environment:
```bash
./scripts/start.sh
# Choose option 1 for full stack development
```

If network issues occur, use a proxy:
```bash
HTTPS_PROXY=http://127.0.0.1:7890 ./scripts/start.sh
```

### Access Points

| Service | URL |
|---------|-----|
| Customer UI | http://localhost:3001 |
| Admin UI | http://localhost:3002/admin/login |
| REST API | http://localhost:3000 |
| GraphQL Playground | http://localhost:3000/api/graphql |
| Couchbase Console | http://localhost:8091 |

## 👤 Default Accounts

### Couchbase Admin
- Username: `Administrator`
- Password: `password`

### Application Admin
- Email: `admin@hotel.com`
- Password: `admin123`

### Customer
Register a new account at: http://localhost:3001/register

## 📡 API Documentation

### REST Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/admin/login` | Admin login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/auth/profile` | Get user profile |

#### Reservations
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/reservations` | Get all reservations (paginated) |
| PUT | `/api/reservations/:id` | Update reservation status |
| GET | `/api/reservations/logs` | Get operation logs |

### GraphQL Operations

#### Queries
```graphql
# Get all reservations
query {
  reservations(limit: 10, offset: 0) {
    id
    date
    time
    status
    partySize
    customer { firstName lastName }
  }
}

# Check table availability
query {
  availableTables(date: "2024-01-15", time: "18:00", partySize: 4) {
    id
    number
    capacity
    location
  }
}
```

#### Mutations
```graphql
# Create reservation
mutation {
  createReservation(input: {
    customerId: "uuid"
    tableId: "uuid"
    date: "2024-01-15"
    time: "18:00"
    partySize: 4
  }) {
    id
    status
  }
}

# Update reservation status
mutation {
  updateReservationStatus(id: "uuid", status: CONFIRMED) {
    id
    status
  }
}
```

## 🧪 Testing

Run all tests:
```bash
pnpm run test
```

Run tests for specific package:
```bash
pnpm --filter @api/reservation-system run test
pnpm --filter @database/reservation-system run test
pnpm --filter @shared/reservation-system run test
```

## 📝 Environment Variables

### API Service
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | API port | 3000 |
| `COUCHBASE_HOST` | Couchbase host | localhost |
| `COUCHBASE_USERNAME` | Couchbase username | Administrator |
| `COUCHBASE_PASSWORD` | Couchbase password | password |
| `COUCHBASE_BUCKET` | Bucket name | reservation |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration | 1h |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | 7d |
| `LOG_LEVEL` | Logging level | debug/info |

### Frontend Services
| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Backend API URL | http://localhost:3000 |

## 🔧 Development Commands

```bash
# Build all packages
pnpm run build:all

# Build individual packages
pnpm run build:shared
pnpm run build:database
pnpm run build:api
pnpm run build:customer
pnpm run build:admin

# Development mode
pnpm run dev

# Docker commands
docker compose up -d           # Start all services
docker compose down           # Stop all services
docker compose logs -f         # View logs

# Create admin user
pnpm run create-admin
```

## 📊 Code Quality

### Current Status
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint configured
- **Testing**: Jest with ts-jest
- **Error Handling**: Custom error classes with proper HTTP codes
- **Logging**: Structured logging system

### Best Practices
- Use Zod for input validation
- Follow RESTful conventions
- Implement proper error handling
- Write unit tests for critical paths

## 📄 License

This project is proprietary software for Hotel Reservation.

## 👥 Support

For issues and questions, please contact the development team.
