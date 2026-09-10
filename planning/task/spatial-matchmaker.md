# Task Breakdown: Module 5 - Real-Time Spatial Matchmaker Subsystem (`spatial-matchmaker`)

**Module Identifier:** `spatial-matchmaker`  
**Parent Subsystem:** Backend Application Layer (`SpatialMatchmakerModule`)  
**Input Documents:**  
- PRD: `backend/planning/01_prd.md` (FR-4.1, FR-4.2, Section 1.3, Section 7)  
- High-Level Design: `backend/planning/02_high-level-design.md` (Section 3, Module 5; Section 5.2, Flow 2; Section 6.1; Section 8.1)  
- Detailed Design: `backend/planning/03_detailed-design.md` (Section 3.1–3.2, Section 4, Section 5.5, Section 8.1)  

---

## 1. Module Overview & Scope
The **Real-Time Spatial Matchmaker Subsystem** is the core pairing engine of ParkLah. When a Leaver announces departure, this module discovers eligible Searchers within proximity ($1.0\text{km}$ radius) using Redis spatial queries, executes a multi-factor match scoring algorithm (ETA synchronization, proximity, driver rating), acquires a 15-second distributed mutex lock, and coordinates the mutual handshake state machine (`OFFERED` -> `ACCEPTED` / `DECLINED` / `TIMEOUT`). If no live match is found, it triggers the fallback to the Probabilistic Vacancy Engine.

---

## 2. Granular Task Checklist

### Phase 1: Database Migration & Persistence
- [x] **Task 5.1: PostgreSQL Migration for `matches` Table**
  - **File:** `backend/src/database/migrations/002_create_matches_table.sql`
  - **Details:**
    - Create `matches` table: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `searcher_id UUID NOT NULL REFERENCES users(id)`, `leaver_id UUID REFERENCES users(id)`, `probabilistic_spot_id UUID REFERENCES probabilistic_spots(id)`, `match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('REAL_TIME_P2P', 'PROBABILISTIC_DB'))`, `spot_geom GEOMETRY(Point, 4326) NOT NULL`, `spot_latitude NUMERIC(10,7) NOT NULL`, `spot_longitude NUMERIC(10,7) NOT NULL`, `status VARCHAR(20) NOT NULL DEFAULT 'OFFERED'`, `searcher_charge_amount NUMERIC(6,2) DEFAULT 0.50`, `leaver_reward_amount NUMERIC(6,2) DEFAULT 0.25`, `platform_fee_amount NUMERIC(6,2) DEFAULT 0.25`, `handshake_timeout_seconds INT DEFAULT 15`, timestamps (`offered_at`, `accepted_at`, `arrived_at`, `completed_at`, `cancelled_at`), `cancellation_reason VARCHAR(50)`.
    - Create indices on `matches(searcher_id)`, `matches(leaver_id)`, `matches(status)`.
  - **Acceptance Criteria:** Table created with foreign keys and check constraints.

### Phase 2: Domain Entities & Repository Ports
- [x] **Task 5.2: Match Entity & State Enum Definition**
  - **File:** `backend/src/modules/matchmaker/domain/entities/match.entity.ts`, `backend/src/modules/matchmaker/domain/enums/match-status.enum.ts`
  - **Details:** Define `MatchEntity` and `MatchStatus` enum (`OFFERED`, `ACCEPTED`, `EN_ROUTE`, `ARRIVED`, `COMPLETED`, `FAILED_SPOT_TAKEN`, `CANCELLED_SEARCHER`, `CANCELLED_LEAVER`, `TIMEOUT`).
  - **Acceptance Criteria:** Validates allowable state transitions according to DDD Section 5.5.4 state machine.

- [x] **Task 5.3: Match Repository Port & PostgreSQL Adapter**
  - **File:** `backend/src/modules/matchmaker/domain/ports/match-repository.port.ts`, `backend/src/modules/matchmaker/infrastructure/adapters/postgres-match.repository.ts`
  - **Details:** Implement `IMatchRepositoryPort` (`createMatch`, `findById`, `updateStatus`, `findActiveMatchByUserId`, `recordCancellation`).
  - **Acceptance Criteria:** Correctly maps spatial coordinates to PostGIS Point geometries.

### Phase 3: Distributed Mutex & Concurrency Lock
- [x] **Task 5.4: Distributed Lock Port & Redis Mutex Adapter**
  - **File:** `backend/src/modules/matchmaker/domain/ports/distributed-lock.port.ts`, `backend/src/modules/matchmaker/infrastructure/adapters/redis-lock.adapter.ts`
  - **Details:** Implement `IDistributedLockPort`:
    - `acquireSpotLock(spotId: string, searcherId: string, ttlMs = 15000): Promise<boolean>`: Executes `SET lock:spot:{spotId} {searcherId} NX PX 15000`.
    - `releaseSpotLock(spotId: string): Promise<void>`: Deletes lock key atomically via Lua script verifying ownership.
  - **Acceptance Criteria:** Prevents simultaneous match offers on the same spot to multiple Searchers.

### Phase 4: Match Scoring Engine & Spatial Discovery
- [x] **Task 5.5: Multi-Factor Match Scoring Engine (`MatchScoringEngine`)**
  - **File:** `backend/src/modules/matchmaker/domain/services/match-scoring.engine.ts`
  - **Details:** Implement the mathematical scoring formula:
    $$S_i = w_1 \cdot \left(1 - \frac{|\text{ETA}_{\text{searcher}} - t_{\text{leave}}|}{300}\right) + w_2 \cdot \left(1 - \frac{d}{1000}\right) + w_3 \cdot \left(\frac{\text{Rating}}{5.0}\right)$$
    With calibrated weights: $w_1 = 0.50$, $w_2 = 0.35$, $w_3 = 0.15$.
  - **Acceptance Criteria:** Output score $S_i$ is bounded in $[0.0, 1.0]$; candidate with closest ETA synchronization receives highest score.

- [x] **Task 5.6: Proximity Candidate Discovery Service**
  - **File:** `backend/src/modules/matchmaker/infrastructure/services/candidate-discovery.service.ts`
  - **Details:** Queries Redis `GEORADIUS geo:searchers:active` at Leaver coordinates with radius $R = 1.0\text{km}$. Retrieves searcher metadata hashes from `searcher:state:{searcherId}`, passes candidates through `MatchScoringEngine`, and returns ranked list.
  - **Acceptance Criteria:** Returns ranked candidates in $<5\text{ms}$.

### Phase 5: Handshake State Machine & Application Service
- [x] **Task 5.7: Matchmaking Application Service (`SpatialMatchmakerService`)**
  - **File:** `backend/src/modules/matchmaker/application/services/spatial-matchmaker.service.ts`
  - **Details:**
    - `processLeaverBroadcast(broadcastEvent)`: Discovers candidates. If found, acquires 15s lock on top candidate, persists `OFFERED` match, schedules 15s timeout job in BullMQ, and dispatches `match:offer` event.
    - If 0 candidates found: Calls `ProbabilisticVacancyService.persistVacatedSpot()`.
    - `acceptMatch(matchId, searcherId)`: Validates lock and state, transitions match to `ACCEPTED` / `EN_ROUTE`, cancels timeout job, dispatches `match:confirmed` with coordinates and route polyline to both parties.
    - `declineMatch(matchId, searcherId)`: Releases lock, transitions match to `DECLINED`, cascades offer to candidate #2.
    - `handleHandshakeTimeout(matchId)`: Triggered after 15s; releases lock, transitions match to `TIMEOUT`, cascades offer to candidate #2 or falls back to probabilistic persistence.
  - **Acceptance Criteria:** Atomic state transitions, zero dangling locks, automatic fallback to next candidate.

### Phase 6: Automated Unit & Concurrency Testing
- [x] **Task 5.8: Match Scoring Engine Unit Tests**
  - **File:** `backend/test/unit/matchmaker/match-scoring.spec.ts`
  - **Details:** Verify score formula outputs, weight distribution, and ranking ordering across diverse test cases (ETA sync vs proximity trade-offs).
  - **Acceptance Criteria:** 100% test pass rate matching DDD Section 8.1 test cases.

- [x] **Task 5.9: Matchmaker Concurrency & Handshake Unit Tests**
  - **File:** `backend/test/unit/matchmaker/matchmaker.service.spec.ts`
  - **Details:** Test concurrent offer collision handling, accept workflow, decline workflow, 15s timeout cascade, and zero-candidate fallback to `ProbabilisticVacancyModule`.
  - **Acceptance Criteria:** 100% test pass rate.
