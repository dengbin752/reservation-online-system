
export const typeDefs = `#graphql
  scalar Date

  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    phone: String
    role: UserRole!
    createdAt: Date!
    updatedAt: Date!
  }

  enum UserRole {
    CUSTOMER
    ADMIN
    STAFF
  }

  type Table {
    id: ID!
    number: Int!
    capacity: Int!
    location: String!
    status: TableStatus!
    createdAt: Date!
    updatedAt: Date!
  }

  enum TableStatus {
    AVAILABLE
    RESERVED
    OCCUPIED
    MAINTENANCE
  }

  type Reservation {
    id: ID!
    title: String
    customerId: String!
    tableId: String!
    date: Date!
    time: String!
    partySize: Int!
    status: ReservationStatus!
    contactInfo: String
    specialRequests: String
    createdAt: Date!
    updatedAt: Date!
    customer: User!
    table: Table!
  }

  enum ReservationStatus {
    PENDING
    CONFIRMED
    CANCELLED
    COMPLETED
    NO_SHOW
  }

  type AuthResponse {
    user: User!
    token: String!
    refreshToken: String!
  }

  type AvailableTables {
    tables: [Table!]!
    date: Date!
    time: String!
    partySize: Int!
  }

  type PaginatedReservations {
    data: [Reservation!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  input CreateReservationInput {
    customerId: ID!
    tableId: ID!
    date: Date!
    time: String!
    partySize: Int!
    title: String
    contactInfo: String
    specialRequests: String
  }

  input UpdateReservationInput {
    tableId: ID
    date: Date
    time: String
    partySize: Int
    specialRequests: String
    status: ReservationStatus
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    phone: String
    role: UserRole!
  }

  input AvailableTablesQuery {
    date: Date!
    time: String!
    partySize: Int!
  }

  input ReservationFilters {
    status: ReservationStatus
    date: Date
    customerId: ID
    tableId: ID
  }

  input PaginationParams {
    page: Int = 1
    limit: Int = 10
    sortBy: String = "createdAt"
    sortOrder: String = "DESC"
  }

  type Query {
    # User queries
    me: User
    users: [User!]!

    # Table queries
    tables: [Table!]!
    table(id: ID!): Table

    # Reservation queries
    reservations(filters: ReservationFilters, pagination: PaginationParams): PaginatedReservations!
    reservation(id: ID!): Reservation
    customerReservations(customerId: ID!): [Reservation!]!
    availableTables(query: AvailableTablesQuery!): AvailableTables!
  }

  type Mutation {
    # Authentication mutations
    login(input: LoginInput!): AuthResponse!
    register(input: RegisterInput!): AuthResponse!
    refreshToken(token: String!): AuthResponse!
    logout(token: String!): Boolean!

    # Table mutations
    createTable(input: CreateTableInput!): Table!
    updateTable(id: ID!, input: UpdateTableInput!): Table!
    deleteTable(id: ID!): Boolean!
    updateTableStatus(id: ID!, status: TableStatus!): Table!

    # Reservation mutations
    createReservation(input: CreateReservationInput!): Reservation!
    updateReservation(id: ID!, input: UpdateReservationInput!): Reservation!
    cancelReservation(id: ID!): Reservation!
    updateReservationStatus(id: ID!, status: ReservationStatus!): Reservation!
  }

  input CreateTableInput {
    number: Int!
    capacity: Int!
    location: String!
  }

  input UpdateTableInput {
    number: Int
    capacity: Int
    location: String
    status: TableStatus
  }
`;
