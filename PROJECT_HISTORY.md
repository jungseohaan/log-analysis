# 로그분석 (LOG ANALYSIS) 프로젝트 히스토리

## 프로젝트 개요
- **프로젝트 이름**: 로그분석 (LOG ANALYSIS)
- **목적**: Trace logs 및 Error logs 분석 애플리케이션
- **아키텍처**: Monorepo (Frontend + Backend)
- **데이터베이스**: PostgreSQL (loki_logs database, aidt schema)

## 기술 스택

### Backend
- **Framework**: Spring Boot 3.4.3
- **Language**: Java 17
- **Database**: PostgreSQL 13.13
- **ORM**: Spring Data JPA, Hibernate
- **Dependencies**: Lombok, spring-dotenv
- **Build Tool**: Gradle

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios

---

## 주요 구현 내역

### 1. 프로젝트 초기 설정
- Monorepo 구조로 frontend와 backend 분리
- Next.js 15 최신 기술 스택으로 frontend 구축
- Spring Boot 3.4.3으로 backend 구축

### 2. 데이터베이스 연결 설정
**테이블 구조**:
- **trace_logs**:
  - id (bigserial)
  - log_payload (jsonb)
  - created_at (timestamptz)

- **refined_error_logs**:
  - id (bigserial)
  - trace_logs_id (int8)
  - profile (varchar(20))
  - app_name (varchar(20))
  - err_cd (varchar(20))
  - schl_cd (varchar(50))
  - cla_id (varchar(128))
  - user_id (varchar(64))
  - url (varchar(500))
  - hash (varchar(20))
  - exception (varchar(50))
  - err_msg (text)
  - message (text)
  - created_at (timestamptz)
  - user_se_cd (bpchar(1))

**주요 설정**:
- Schema: `aidt` (public이 아님)
- JDBC URL: `jdbc:postgresql://localhost:5432/loki_logs?currentSchema=aidt`
- Hibernate ddl-auto: `none` (기존 테이블 보호)

### 3. 환경 변수 설정
**Backend (.env)**:
```bash
DB_URL=jdbc:postgresql://localhost:5432/loki_logs?currentSchema=aidt
DB_USERNAME=vsncpdba
DB_PASSWORD=Qltkdelql!12
```

**Frontend (.env.local)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

- spring-dotenv 라이브러리 추가로 .env 파일 자동 로드
- .gitignore에 환경 변수 파일 추가
- .env.example 파일 생성 (개발자 가이드)

### 4. Trace Logs 기능 구현

#### Backend API
**엔드포인트**:
- `GET /api/trace-logs-launcher/recent?limit=100&appName=vlmsapi`
  - 최근 로그 조회 (100, 200, 300, 1000, 10000개)
  - appName 필터 지원

- `GET /api/trace-logs-launcher/range?startDate=...&endDate=...&limit=100&appName=vlmsapi`
  - 날짜 범위 로그 조회
  - appName 필터 지원

**주요 구현**:
- TraceLog Entity (JSONB 매핑)
- TraceLogRepository (네이티브 쿼리로 JSONB 필터링)
- TraceLogService, TraceLogController

#### Frontend
**페이지**: `/logs`

**주요 기능**:
- 조회 타입: 최근 로그 / 날짜 범위
- appName 필터: All, vlmsapi, socket, lcmsapi, tool, VIEWER
- 조회 개수: 100, 200, 300, 1000
- 2단 레이아웃:
  - 왼쪽 (2/3): 로그 목록
  - 오른쪽 (1/3): 로그 상세 (JSON 포맷팅)

### 5. Error Logs 기능 구현

#### Backend API
**엔드포인트**:
- `GET /api/error-logs/recent?minutes=10&profile=dev&appName=vlmsapi&limit=100`
  - 최근 시간대 에러 로그 (10분, 30분, 1시간)
  - profile 필터: all, dev, stg, access, r-engl, r-math
  - appName 필터: all, vlmsapi, launcher, socket, tool, VIEWER

- `GET /api/error-logs/range?startDate=...&endDate=...&profile=dev&appName=vlmsapi&limit=100`
  - 날짜 범위 에러 로그
  - 동일한 필터 지원

**주요 구현**:
- RefinedErrorLog Entity (15개 필드)
- RefinedErrorLogRepository (복합 필터 쿼리)
- RefinedErrorLogService, RefinedErrorLogController

#### Frontend
**페이지**: `/error-logs`

**주요 기능**:
- 조회 타입: 최근 시간대 (10분, 30분, 1시간) / 날짜 범위
- Profile 필터: All, dev, stg, access, r-engl, r-math
- App Name 필터: All, vlmsapi, launcher, socket, tool, VIEWER
- 조회 개수: 100, 200, 300, 500, 1000
- 2단 레이아웃:
  - 왼쪽 (2/3): 에러 로그 목록 (profile, appName 배지 표시)
  - 오른쪽 (1/3): 에러 로그 상세 정보

### 6. UI/UX 개선

#### 전역 레이아웃
- 루트 레이아웃에 Sidebar 통합
- 모든 페이지에서 일관된 사이드바 표시
- 중복 레이아웃 제거 (`/app/logs/layout.tsx` 삭제)

#### Sidebar 메뉴
- 📋 로그 (`/logs`)
- ⚠️ 에러로그 (`/error-logs`)
- 활성 메뉴 하이라이트 (파란색)

#### 페이지 타이틀
- 브라우저 탭: "로그분석 (LOG ANALYSIS)"
- 로그 페이지 헤더: "로그분석 (LOG ANALYSIS)"
- 에러로그 페이지 헤더: "에러로그 검색"

### 7. 데이터 분석
**10,000개 trace_logs 분석 결과**:
| appName | Count | Percentage |
|---------|-------|------------|
| vlmsapi | 4,843 | 48.43% |
| socket  | 3,629 | 36.29% |
| lcmsapi | 939   | 9.39% |
| tool    | 583   | 5.83% |
| VIEWER  | 6     | 0.06% |

---

## 프로젝트 구조

```
log-analysis/
├── backend/
│   ├── src/main/
│   │   ├── java/com/visang/tutor/demo/
│   │   │   ├── model/
│   │   │   │   ├── TraceLog.java
│   │   │   │   └── RefinedErrorLog.java
│   │   │   ├── repository/
│   │   │   │   ├── TraceLogRepository.java
│   │   │   │   └── RefinedErrorLogRepository.java
│   │   │   ├── service/
│   │   │   │   ├── TraceLogService.java
│   │   │   │   └── RefinedErrorLogService.java
│   │   │   ├── controller/
│   │   │   │   ├── TraceLogController.java
│   │   │   │   └── RefinedErrorLogController.java
│   │   │   └── DemoApplication.java
│   │   └── resources/
│   │       └── application.yml
│   ├── build.gradle
│   ├── settings.gradle
│   ├── .env (gitignore)
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── logs/
│   │   │   └── page.tsx
│   │   ├── error-logs/
│   │   │   └── page.tsx
│   │   ├── layout.tsx (루트 레이아웃 + Sidebar)
│   │   ├── page.tsx (리다이렉트)
│   │   ├── providers.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   └── api/
│   │       ├── trace-logs.ts
│   │       └── error-logs.ts
│   ├── package.json
│   ├── .env.local (gitignore)
│   └── .env.example
│
├── .gitignore
├── CLAUDE.md
└── PROJECT_HISTORY.md (이 파일)
```

---

## API 엔드포인트 정리

### Trace Logs API
| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| GET | `/api/trace-logs-launcher/recent` | `limit`, `appName` | 최근 로그 조회 |
| GET | `/api/trace-logs-launcher/range` | `startDate`, `endDate`, `limit`, `appName` | 날짜 범위 로그 조회 |

### Error Logs API
| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| GET | `/api/error-logs/recent` | `minutes`, `profile`, `appName`, `limit` | 최근 에러 로그 조회 |
| GET | `/api/error-logs/range` | `startDate`, `endDate`, `profile`, `appName`, `limit` | 날짜 범위 에러 로그 조회 |

---

## 실행 방법

### Backend
```bash
cd backend
gradle bootRun
# 서버: http://localhost:8080
```

### Frontend
```bash
cd frontend
npm run dev
# 서버: http://localhost:3000
```

### 환경 변수 설정
1. `backend/.env.example`을 `backend/.env`로 복사
2. `frontend/.env.example`을 `frontend/.env.local`로 복사
3. 필요한 환경 변수 값 입력

---

## 주요 기술적 결정사항

### 1. PostgreSQL JSONB 필터링
- Native Query 사용: `log_payload->>'appName' = :appName`
- JPA에서 직접 JSONB 연산자 지원

### 2. 환경 변수 관리
- Backend: spring-dotenv 라이브러리
- Frontend: Next.js 기본 .env 지원
- Git에서 제외, .example 파일로 가이드

### 3. Schema 명시
- PostgreSQL 기본 schema가 아닌 `aidt` schema 사용
- JDBC URL에 `?currentSchema=aidt` 추가
- Hibernate 설정에 `default_schema: aidt` 추가

### 4. 기존 테이블 보호
- `spring.jpa.hibernate.ddl-auto: none`
- 테이블 자동 생성/삭제 방지

### 5. 프론트엔드 상태 관리
- TanStack Query로 서버 상태 관리
- 자동 캐싱, 리페칭, 에러 핸들링

---

## 문제 해결 사례

### 1. Schema 인식 문제
**문제**: "relation 'trace_logs' does not exist"
**원인**: PostgreSQL schema가 `public`이 아닌 `aidt`
**해결**: JDBC URL과 Hibernate 설정에 schema 명시

### 2. 중복 Sidebar 표시
**문제**: "로그" 메뉴 클릭 시 사이드바가 2개 표시됨
**원인**: `/app/logs/layout.tsx`에 중복 Sidebar
**해결**: 해당 레이아웃 파일 삭제, 루트 레이아웃만 사용

### 3. 환경 변수 로드
**문제**: Spring Boot에서 .env 파일 인식 안됨
**해결**: spring-dotenv 라이브러리 추가

---

## 향후 개선 사항 (제안)

1. **페이지네이션**: 대량 데이터 처리를 위한 페이지네이션 추가
2. **검색 기능**: 로그 메시지 전문 검색
3. **통계 대시보드**: 시간대별, profile별 에러 통계
4. **알림 기능**: 특정 조건 에러 발생 시 알림
5. **Export 기능**: CSV, JSON 형식으로 로그 다운로드
6. **실시간 모니터링**: WebSocket으로 실시간 로그 스트리밍

---

## 버전 정보
- **프로젝트 버전**: 0.0.1-SNAPSHOT
- **Spring Boot**: 3.4.3
- **Java**: 17
- **Next.js**: 15.1.3
- **React**: 19.0.0
- **PostgreSQL**: 13.13
- **작성일**: 2025-10-22
