# Task Breakdown: Module 6 - Probabilistic Vacancy & Decay Subsystem (`probabilistic-vacancy`)

**Module Identifier:** `probabilistic-vacancy`  
**Parent Subsystem:** Backend Application Layer (`ProbabilisticVacancyModule`)  
**Input Documents:**  
- PRD: `backend/planning/01_prd.md` (FR-5.1, FR-5.2, FR-5.3, Section 4.5, Section 7)  
- High-Level Design: `backend/planning/02_high-level-design.md` (Section 3, Module 6; Section 5.3, Flow 3; Section 6.1; Section 8.2)  
- Detailed Design: `backend/planning/03_detailed-design.md` (Section 3.1–3.2, Section 5.6, Section 8.2)  

---

## 1. Module Overview & Scope
The **Probabilistic Vacancy & Decay Subsystem** captures and maintains parking spots vacated by Leavers who had no immediate real-time match. It stores spots in PostgreSQL using PostGIS spatial indexing (`location_geom`), applies a continuous mathematical exponential decay formula ($P(t) = P_0 \cdot e^{-\lambda t} \cdot M_{\text{traffic}}$), purges expired spots ($t > 15\text{ min}$ or $P(t) < 15\%$), and routes arriving Searchers to the highest-probability candidate spot within $500\text{m}$.

---

## 2. Granular Task Checklist

### Phase 1: Database Migration & PostGIS Spatial Indexing
- [x] **Task 6.1: PostgreSQL Migration for `probabilistic_spots` Table**
  - **File:** `backend/src/database/migrations/003_create_probabilistic_spots_table.sql`
  - **Details:**
    - Create `probabilistic_spots` table: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `leaver_id UUID REFERENCES users(id) ON DELETE SET NULL`, `location_geom GEOMETRY(Point, 4326) NOT NULL`, `latitude NUMERIC(10,7) NOT NULL`, `longitude NUMERIC(10,7) NOT NULL`, `initial_p NUMERIC(4,3) DEFAULT 0.950`, `current_p NUMERIC(4,3) DEFAULT 0.950`, `area_traffic_multiplier NUMERIC(3,2) DEFAULT 1.00`, `landmark_note VARCHAR(100)`, `status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'EXPIRED'))`, `vacated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `expires_at TIMESTAMPTZ NOT NULL`, timestamps.
    - Create GiST spatial index: `CREATE INDEX idx_probabilistic_spots_geom ON probabilistic_spots USING GIST(location_geom);`
    - Create status and expiration composite indices: `CREATE INDEX idx_probabilistic_spots_status_p ON probabilistic_spots(status, current_p DESC);`
  - **Acceptance Criteria:** PostGIS spatial queries on table execute with sub-10ms latency.

### Phase 2: Domain Entity & PostGIS Repository Port
- [x] **Task 6.2: Domain Entity & Status Enum Definition**
  - **File:** `backend/src/modules/probabilistic/domain/entities/probabilistic-spot.entity.ts`, `backend/src/modules/probabilistic/domain/enums/spot-status.enum.ts`
  - **Details:** Define `ProbabilisticSpotEntity` with domain methods: `isExpired()`, `applyDecay(p: number)`, `markOccupied()`.
  - **Acceptance Criteria:** Entity enforces valid probability ranges $[0.000, 1.000]$.

- [x] **Task 6.3: PostGIS Spatial Repository Port & Adapter**
  - **File:** `backend/src/modules/probabilistic/domain/ports/probabilistic-spot-repository.port.ts`, `backend/src/modules/probabilistic/infrastructure/adapters/postgres-probabilistic-spot.repository.ts`
  - **Details:** Implement `IProbabilisticSpotRepositoryPort`:
    - `create(spot)`: Inserts new spot with `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`.
    - `findActiveWithinRadius(coords: LatLng, radiusMeters: number, limit: number)`: Uses `ST_DWithin` on geography with `ORDER BY current_p DESC, ST_Distance_Sphere(...) ASC`.
    - `updateBatchProbabilities(updates: Array<{ id: string, p: number }>)`: Batch updates decayed probability values.
    - `expireSpotsBatch(cutoffTime: Date)`: Marks spots with $t > 15\text{m}$ or $P(t) < 0.15$ as `EXPIRED`.
    - `markOccupied(spotId: string)`: Updates spot status to `OCCUPIED`.
  - **Acceptance Criteria:** Queries leverage the GiST index and avoid full table scans.

### Phase 3: Mathematical Time-Decay Engine Formulation
- [x] **Task 6.4: Time-Decay Model Formulation (`DecayEngine`)**
  - **File:** `backend/src/modules/probabilistic/domain/services/decay.engine.ts`
  - **Details:** Implement exact mathematical decay formula:
    $$P(t) = P_0 \cdot e^{-\lambda t} \cdot M_{\text{traffic}}$$
    - $P_0 = 0.950$ (initial confidence score).
    - $\lambda = 0.150$ (decay rate constant).
    - $M_{\text{traffic}} \in [0.80, 1.00]$ (traffic density multiplier).
    - Cutoff rule: If $t > 15.0\text{ min}$ or $P(t) < 0.150 \implies P(t) = 0.0$ and status becomes `EXPIRED`.
  - **Acceptance Criteria:** Matches exact decay values from DDD Section 5.6.3 table ($t=0 \rightarrow 95\%$, $t=5 \rightarrow 44.8\%$, $t=10 \rightarrow 21.2\%$, $t=15 \rightarrow \text{EXPIRED}$).

### Phase 4: Application Service & Candidate Routing
- [x] **Task 6.5: Probabilistic Vacancy Service (`ProbabilisticVacancyService`)**
  - **File:** `backend/src/modules/probabilistic/application/services/probabilistic-vacancy.service.ts`
  - **Details:**
    - `persistVacatedSpot(dto)`: Creates record with $P_0 = 0.95$, sets `expires_at = NOW() + INTERVAL '15 MIN'`, and returns spot DTO.
    - `queryTopCandidateSpots(searcherCoords, radiusMeters = 500)`: Executes spatial candidate query and returns top 3 candidate spots with their current probability and human-readable probability labels (*"High Chance"*, *"Moderate"*, *"Low"*).
    - `batchDecayTick()`: Fetches all `AVAILABLE` spots, recalculates $P(t)$, updates active spots, and marks expired spots as `EXPIRED`.
    - `invalidateSpot(spotId, reason)`: Marks spot `OCCUPIED` (e.g. when taken by another driver or app user).
  - **Acceptance Criteria:** Fast and resilient spot management with deterministic decay progression.

### Phase 5: REST API & Socket Event Handlers
- [x] **Task 6.6: Spot Query Controller & Socket Listeners**
  - **File:** `backend/src/modules/probabilistic/infrastructure/controllers/probabilistic-spot.controller.ts`, `backend/src/modules/probabilistic/infrastructure/gateways/probabilistic-spot.gateway.ts`
  - **Details:**
    - REST: `GET /api/v1/spots/candidates?lat=...&lng=...&radius=500`
    - Socket: `searcher:query_spots` $\rightarrow$ emits `searcher:routed_db_spot` with top candidate details.
  - **Acceptance Criteria:** Returns ranked candidates with distance in meters and probability score.

### Phase 6: Automated Unit & Spatial Integration Testing
- [x] **Task 6.7: Decay Engine Unit Test Suite**
  - **File:** `backend/test/unit/probabilistic/decay-engine.spec.ts`
  - **Details:** Test exact decay calculations across time intervals ($t=0, 3, 5, 8, 10, 12, 15$), traffic multiplier scaling, and hard expiration at $15.1\text{ mins}$.
  - **Acceptance Criteria:** 100% test pass rate matching DDD Section 8.2 test cases.

- [x] **Task 6.8: Spatial Candidate Query Integration Tests**
  - **File:** `backend/test/integration/probabilistic/spatial-spot.repository.spec.ts`
  - **Details:** Test PostGIS `ST_DWithin` spatial query accuracy, distance sorting, and exclusion of `EXPIRED` / `OCCUPIED` spots.
  - **Acceptance Criteria:** 100% test pass rate on test PostGIS instance.
