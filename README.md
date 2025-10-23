# Log Analysis Application

Next.js + Spring Boot 통합 데모 프로젝트

## 프로젝트 구조

```
demo/
├── frontend/          # Next.js 15 (React 19 + TypeScript)
├── backend/           # Spring Boot 3.4.3 (Java 17)
└── docker-compose.yml
```

## 기술 스택

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS

### Backend
- Spring Boot 3.4.3
- Java 17
- PostgreSQL 16
- Spring Data JPA
- Lombok

## 빠른 시작

### 로컬 개발 환경

1. **PostgreSQL 시작**
   ```bash
   docker-compose up -d postgres
   ```

2. **백엔드 실행**
   ```bash
   cd backend
   ./gradlew bootRun
   ```

3. **프론트엔드 실행**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. 브라우저에서 `http://localhost:3000` 접속

### Docker로 실행

```bash
docker-compose up -d
```

## 포트

- Frontend: 3000
- Backend: 8080
- PostgreSQL: 5432

## 데이터베이스 정보

- **Host**: localhost
- **Port**: 5432
- **Database**: loki_logs
- **Username**: vsncpdba
- **Password**: Qltkdelql!12

## API 엔드포인트

### Trace Logs API

1. **날짜/시간 구간별 조회**
   ```
   GET /api/trace-logs-launcher/range?startDate=2024-01-01T00:00:00&endDate=2024-01-31T23:59:59&limit=100
   ```

2. **최근 로그 조회**
   ```
   GET /api/trace-logs-launcher/recent?limit=200
   ```

## 개발 문서

자세한 개발 가이드는 [CLAUDE.md](./CLAUDE.md) 참고
