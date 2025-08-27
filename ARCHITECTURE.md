# Architecture and Design Document

## Overview

This project is a full-stack application built with Next.js, utilizing its App Router for both frontend pages and backend API routes in a monolithic structure. It connects to a PostgreSQL database via the Prisma ORM.

## Tech Stack Rationale

-   [cite_start]**Next.js**: Chosen as the primary framework because it allows for rapid development of both the React frontend and the Node.js backend in a single, cohesive project, which is what the company uses. [cite: 30]
-   [cite_start]**PostgreSQL**: A relational database was selected to effectively implement the bonus objective's "relational access model," enabling straightforward data filtering based on user and restaurant country relationships. [cite: 27]
-   **Prisma**: Used as the ORM to provide a type-safe and developer-friendly interface for all database operations.

## Data Model

The database schema, defined in `prisma/schema.prisma`, models the key entities and their relationships.

-   **User**: Stores user credentials, along with their assigned `role` and `country`.
-   **Restaurant**: Contains restaurant details, including its `country`.
-   **MenuItem**: Belongs to a single Restaurant.
-   **Order** & **OrderItem**: Manages user carts and order history.

## Authentication and Authorization

Access control is handled in two layers:

1.  **Authentication (Middleware)**: A middleware at `src/middleware.ts` protects all API routes. It inspects the `Authorization` header for a valid JWT. If the token is valid, it decodes the user's information (`userId`, `role`, `country`) and attaches it to the request headers for downstream use.
2.  **Authorization (API Endpoints)**: Each API endpoint performs specific authorization checks based on the user data provided by the middleware. [cite_start]For example, the checkout endpoint verifies that the user's role is not `MEMBER` before proceeding. [cite: 16] This enforces the rules defined in the assignment.