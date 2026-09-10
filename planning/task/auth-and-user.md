# Task Breakdown: Module 2 - Authentication & User Management Subsystem (`auth-and-user`)

**Module Identifier:** `auth-and-user`  
**Parent Subsystem:** Backend Application Layer (`AuthAndUserModule`)  
**Input Documents:**  
- PRD: `backend/planning/01_prd.md` (FR-1.1, FR-1.2, FR-1.3, Section 6.3)  
- High-Level Design: `backend/planning/02_high-level-design.md` (Section 3, Module 2; Section 6.1; Section 7.2)  
- Detailed Design: `backend/planning/03_detailed-design.md` (Section 3.1–3.2, Section 5.2, Section 7)  

---

## 1. Module Overview & Scope
The **Authentication & User Management Subsystem** handles user registration and login via Malaysian mobile numbers (`+60`), SMS OTP generation and validation, JWT access and refresh token lifecycle, vehicle profile management with 4-digit plate suffix masking, default role selection, and user reliability ratings.

---

## 2. Granular Task Checklist

### Phase 1: Database Migration & Schema Setup
- [x] **Task 2.1: PostgreSQL Migration for `users` and `user_vehicles`**
  - **File:** `backend/src/database/migrations/001_create_users_and_vehicles.sql` (or TypeORM / Prisma migration)
  - **Details:**
    - Create `users` table: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `phone_number VARCHAR(20) NOT NULL UNIQUE`, `full_name VARCHAR(100)`, `default_role VARCHAR(10) DEFAULT 'SEARCHER'`, `reliability_rating NUMERIC(3,2) DEFAULT 5.00`, `total_completed_matches INT DEFAULT 0`, `total_disputes_count INT DEFAULT 0`, `is_active BOOLEAN DEFAULT TRUE`, timestamps.
    - Create `user_vehicles` table: `id UUID PRIMARY KEY`, `user_id UUID REFERENCES users(id) ON DELETE CASCADE`, `make_model VARCHAR(50)`, `color VARCHAR(30)`, `plate_suffix VARCHAR(4)`, `is_default BOOLEAN DEFAULT FALSE`, timestamps.
    - Add indices on `users(phone_number)` and `user_vehicles(user_id)`.
  - **Acceptance Criteria:** Migration runs cleanly forward and backward against PostgreSQL 16 + PostGIS.

### Phase 2: Domain Entities & Repository Ports
- [x] **Task 2.2: Define Domain Entities & Interfaces**
  - **File:** `backend/src/modules/auth/domain/entities/user.entity.ts`, `backend/src/modules/auth/domain/entities/user-vehicle.entity.ts`
  - **Details:** Define rich TypeScript domain models with business invariants (plate suffix must be 4 digits, phone must start with `+601`, rating clamped to `0.00`–`5.00`).
  - **Acceptance Criteria:** Entities enforce validation upon instantiation.

- [x] **Task 2.3: Repository Ports & PostgreSQL Adapters**
  - **File:** `backend/src/modules/auth/domain/ports/user-repository.port.ts`, `backend/src/modules/auth/infrastructure/adapters/postgres-user.repository.ts`
  - **Details:** Implement `IUserRepositoryPort` (`findByPhone`, `findById`, `create`, `update`, `incrementCompletedMatches`, `adjustRating`) and `IVehicleRepositoryPort` (`findByUserId`, `createVehicle`, `setDefaultVehicle`, `deleteVehicle`).
  - **Acceptance Criteria:** Methods execute isolated CRUD queries with proper error wrapping.

### Phase 3: External Ports & Redis Integration
- [x] **Task 2.4: SMS Gateway Port & Mock Adapter**
  - **File:** `backend/src/modules/auth/domain/ports/sms-gateway.port.ts`, `backend/src/modules/auth/infrastructure/adapters/mock-sms.adapter.ts`
  - **Details:** Define `ISmsGatewayPort` (`sendOtp(phone: string, otp: string): Promise<boolean>`). Implement `MockSmsGatewayAdapter` for local development/testing and create stub for telco SMS provider.
  - **Acceptance Criteria:** Mock adapter logs OTP to console and returns `true`.

- [x] **Task 2.5: Redis OTP Storage & Rate Limiting Service**
  - **File:** `backend/src/modules/auth/infrastructure/services/otp-cache.service.ts`
  - **Details:**
    - Store OTP in Redis key `otp:${phoneNumber}` with 300s TTL.
    - Enforce rate limit using Redis key `ratelimit:otp:${phoneNumber}` with 60s TTL (max 1 request per 60 seconds).
  - **Acceptance Criteria:** Rejects OTP requests within 60s window with `429 Too Many Requests`.

### Phase 4: Application Services & DTOs
- [x] **Task 2.6: DTOs & Validation Rules**
  - **File:** `backend/src/modules/auth/application/dto/request-otp.dto.ts`, `backend/src/modules/auth/application/dto/verify-otp.dto.ts`, `backend/src/modules/auth/application/dto/create-vehicle.dto.ts`
  - **Details:**
    - `RequestOtpDto`: `@Matches(/^\+601[0-9]{8,9}$/)`
    - `VerifyOtpDto`: `@Matches(/^\+601[0-9]{8,9}$/)`, `@Length(6, 6)`, `@Matches(/^[0-9]{6}$/)`
    - `CreateVehicleDto`: `makeModel` (string), `color` (string), `plateSuffix` (`@Length(4, 4)`, `@Matches(/^[0-9]{4}$/)`)
  - **Acceptance Criteria:** Validation pipes reject malformed payloads with RFC 7807 error responses.

- [x] **Task 2.7: Authentication Service (`AuthService`)**
  - **File:** `backend/src/modules/auth/application/services/auth.service.ts`
  - **Details:**
    - `requestOtp(dto)`: Validates phone format, checks rate limit, generates secure random 6-digit OTP, saves in Redis, sends via SMS port.
    - `verifyOtp(dto)`: Validates OTP against Redis; if valid, finds or creates `UserEntity`, generates JWT Access Token (1 hour) & Refresh Token (7 days), stores session claims in Redis `session:token:{userId}`.
    - `refreshToken(refreshToken)`: Validates refresh token and returns refreshed token pair.
  - **Acceptance Criteria:** Successful verification returns tokens and user profile; invalid OTP returns `401 Unauthorized`.

- [x] **Task 2.8: User & Vehicle Management Services (`UserService`, `VehicleService`)**
  - **File:** `backend/src/modules/auth/application/services/user.service.ts`, `backend/src/modules/auth/application/services/vehicle.service.ts`
  - **Details:**
    - `getUserProfile(userId)`: Returns user metadata, rating, and vehicle list.
    - `updateDefaultRole(userId, role)`: Toggles default role between `SEARCHER` and `LEAVER`.
    - `addVehicle(userId, dto)`: Inserts new vehicle record ensuring only 4-digit plate suffix is saved.
    - `setDefaultVehicle(userId, vehicleId)`: Sets selected vehicle as active default.
  - **Acceptance Criteria:** Plate privacy masking strictly enforced; all vehicle queries return masked plate suffixes.

### Phase 5: Ingress REST Controllers & Security Guards
- [x] **Task 2.9: JWT Passport Strategy & NestJS Auth Guard**
  - **File:** `backend/src/modules/auth/infrastructure/guards/jwt-auth.guard.ts`, `backend/src/modules/auth/infrastructure/strategies/jwt.strategy.ts`
  - **Details:** Extracts Bearer token, validates signature and expiration, checks active session key in Redis (`session:token:{userId}`), and injects authenticated user into request context.
  - **Acceptance Criteria:** Unauthenticated requests to protected endpoints return `401 Unauthorized`.

- [x] **Task 2.10: REST Controllers (`AuthController`, `UserController`)**
  - **File:** `backend/src/modules/auth/infrastructure/controllers/auth.controller.ts`, `backend/src/modules/auth/infrastructure/controllers/user.controller.ts`
  - **Details:**
    - `POST /api/v1/auth/otp/request`
    - `POST /api/v1/auth/otp/verify`
    - `POST /api/v1/auth/token/refresh`
    - `GET /api/v1/user/profile`
    - `PATCH /api/v1/user/role`
    - `GET /api/v1/user/vehicles`
    - `POST /api/v1/user/vehicles`
    - `PATCH /api/v1/user/vehicles/:id/default`
  - **Acceptance Criteria:** Endpoints strictly conform to OpenAPI/Swagger schemas and return RFC 7807 problem details on error.

### Phase 6: Automated Unit & Integration Testing
- [x] **Task 2.11: Unit Test Suite for `AuthService`**
  - **File:** `backend/test/unit/auth/auth.service.spec.ts`
  - **Details:** Test OTP generation, Redis TTL, 60s rate limit exception, valid OTP token generation, invalid OTP rejection.
  - **Acceptance Criteria:** 100% test pass rate.

- [x] **Task 2.12: Unit Test Suite for `VehicleService`**
  - **File:** `backend/test/unit/auth/vehicle.service.spec.ts`
  - **Details:** Test 4-digit plate suffix validation, multi-vehicle default toggling, and masked plate persistence.
  - **Acceptance Criteria:** 100% test pass rate.
