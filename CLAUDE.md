# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**로그분석 (LOG ANALYSIS)** - A trace logs analysis application with Next.js frontend and Spring Boot backend.

## Project Structure

This is a **monorepo** with frontend and backend applications:

```
log-analysis/
├── frontend/          # Next.js 15 application
│   ├── app/          # App Router pages
│   ├── components/   # React components
│   ├── lib/          # Utilities and API client
│   └── public/       # Static assets
├── backend/          # Spring Boot application
│   ├── src/
│   ├── build.gradle
│   └── settings.gradle
└── CLAUDE.md
```

## Frontend (Next.js 15)

### Tech Stack
- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS** for styling

### Frontend Commands

```bash
cd frontend
npm install                  # Install dependencies
npm run dev                  # Start development server (port 3000)
npm run build               # Build for production
npm run start               # Start production server
npm run lint                # Run ESLint
npm run format              # Format code with Prettier
```

### Frontend Architecture

- **App Router**: Using Next.js 15 App Router with React Server Components
- **Styling**: Tailwind CSS with utility classes

### Key Frontend Files

- `app/layout.tsx`: Root layout with Providers
- `app/providers.tsx`: QueryClientProvider setup for TanStack Query
- `app/page.tsx`: Home page
- `lib/utils.ts`: Utility functions (cn for classnames)

## Backend (Spring Boot)

### Build System

This project supports **both Gradle and Maven** build systems:

- **Gradle** (primary): Uses Spring Boot 3.4.3
- **Maven**: Uses Spring Boot 3.2.3, configured in Docker builds

### Backend Commands

```bash
cd backend

# Gradle
./gradlew build                    # Build the project
./gradlew bootRun                  # Run the application
./gradlew test                     # Run all tests
./gradlew test --tests ClassName   # Run a specific test class

# Maven (used in Docker)
./mvnw clean install              # Build with Maven
./mvnw spring-boot:run            # Run with Maven
./mvnw test                       # Run tests with Maven
```

## Docker Commands

```bash
# From project root
docker-compose up -d              # Start all services (PostgreSQL, backend, frontend)
docker-compose down               # Stop all containers
docker-compose logs -f backend    # View backend logs
docker-compose logs -f frontend   # View frontend logs
docker-compose logs -f postgres   # View PostgreSQL logs
docker-compose restart backend    # Restart backend only
docker-compose restart frontend   # Restart frontend only
```

## Architecture Overview

### Layered Architecture Pattern

```
Controller → Service → Repository → Database
```

The application follows Spring Boot's standard MVC layered architecture:

1. **Controllers** (`controller/`): REST API endpoints, handle HTTP requests
2. **Services** (`service/`): Business logic layer
3. **Repositories** (`repository/`): JPA data access layer
4. **Models** (`model/`): Entity classes and enums
5. **Config** (`config/`): Application configuration

### Key Architectural Decisions

- **Database Strategy**: JPA uses `create-drop` mode, which **recreates the schema on every startup**

## Database Configuration

### PostgreSQL

**Local Development:**
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `loki_logs`
- **Username**: `vsncpdba`
- **Password**: `Qltkdelql!12`
- **JDBC URL**: `jdbc:postgresql://localhost:5432/loki_logs`

**Docker Environment:**
- PostgreSQL 16 container automatically started via docker-compose
- Backend waits for PostgreSQL health check before starting
- Database URL changes to `jdbc:postgresql://postgres:5432/loki_logs` in container
- Uses same credentials as local development

## Development Workflow

### Adding New Endpoints

1. Create request/response DTOs as inner classes or in a `dto/` package
2. Add controller method with `@PostMapping` or `@GetMapping`
3. Implement business logic in service layer
4. Create repository method if database access needed

### Working with JPA Entities

- All entities use Lombok's `@Builder` pattern
- Remember that schema recreates on restart (consider changing to `update` for persistence)

### CORS Configuration

To configure CORS for API endpoints:
1. Create a `@Configuration` class with `WebMvcConfigurer`
2. Override `addCorsMappings()` method
3. Configure allowed origins, methods, and headers

## Package Structure

```
com.visang.tutor.demo/
├── DemoApplication.java              # Spring Boot entry point
├── controller/
│   └── TraceLogController.java       # Trace logs REST API
├── service/
│   └── TraceLogService.java          # Trace logs business logic
├── repository/
│   └── TraceLogRepository.java       # Trace logs JPA repository
└── model/
    └── TraceLog.java                 # Trace log entity
```

## API Endpoints

### Trace Logs API

**Base URL:** `/api/trace-logs-launcher`

1. **날짜/시간 구간별 조회**
   ```
   GET /api/trace-logs-launcher/range?startDate={startDate}&endDate={endDate}&limit={limit}
   ```
   - Parameters:
     - `startDate` (required): 시작 날짜/시간 (ISO 8601 형식: `yyyy-MM-ddTHH:mm:ss`)
     - `endDate` (required): 종료 날짜/시간 (ISO 8601 형식: `yyyy-MM-ddTHH:mm:ss`)
     - `limit` (optional): 조회 개수 (기본값: 100, 허용값: 100, 200, 300, 1000)
   - Example: `/api/trace-logs-launcher/range?startDate=2024-01-01T00:00:00&endDate=2024-01-31T23:59:59&limit=100`

2. **최근 로그 조회**
   ```
   GET /api/trace-logs-launcher/recent?limit={limit}
   ```
   - Parameters:
     - `limit` (optional): 조회 개수 (기본값: 100, 허용값: 100, 200, 300, 1000)
   - Example: `/api/trace-logs-launcher/recent?limit=200`

## Environment Variables

When running in Docker, these environment variables override application.properties:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

## Ports

- **Frontend**: 3000
- **Backend**: 8080
- **PostgreSQL**: 5432

## Development Workflow

### Running Locally

1. **Start PostgreSQL**:
   ```bash
   docker-compose up -d postgres
   ```

2. **Start Backend**:
   ```bash
   cd backend
   ./gradlew bootRun
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Access the application at `http://localhost:3000`

### Running with Docker

```bash
# From project root
docker-compose up -d
```

All services will start automatically. Frontend will be available at `http://localhost:3000`.

## Frontend-Backend Integration

- Backend can be called from frontend at `http://localhost:8080`
- Configure CORS in backend if needed for API endpoints

## Adding New Features

### Adding a Frontend Page

1. Create new directory in `frontend/app/[page-name]/`
2. Add `page.tsx` with your component
3. Use `"use client"` directive if client-side rendering needed
4. Add route to navigation if necessary

### Adding a Backend API Endpoint

1. Create request/response DTOs in controller or separate package
2. Add controller method with appropriate mapping annotation
3. Implement business logic in service layer
4. Add repository method if database access needed
5. Configure CORS if frontend needs to call the endpoint
