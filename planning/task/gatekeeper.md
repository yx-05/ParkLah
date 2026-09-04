# Task Breakdown: Module 3 - Searcher & Distance Gatekeeper Subsystem (`gatekeeper`)

**Module Identifier:** `gatekeeper`  
**Parent Subsystem:** Backend Application Layer (`GatekeeperModule`)  
**Input Documents:**  
- PRD: `backend/planning/01_prd.md` (FR-2.1, FR-2.2, FR-2.3, Section 4.2)  
- High-Level Design: `backend/planning/02_high-level-design.md` (Section 3, Module 3; Section 5.1, Flow 1; Section 6.2; Section 7.2)  
- Detailed Design: `backend/planning/03_detailed-design.md` (Section 4, Section 5.3, Section 7)  

---

## 1. Module Overview & Scope
The **Searcher & Distance Gatekeeper Subsystem** manages the Searcher's pre-matchmaking journey. It resolves destinations using Google Places API, evaluates travel ETA and driving distance using Google Distance Matrix API, and enforces the core constraint: matchmaking is **locked** unless the driver is within $\text{ETA} \le 10\text{ minutes}$ AND $\text{Distance} \le 3.0\text{ km}$ from the destination. When unlocked, it registers the driver into the active Redis spatial matchmaking queue.

---

## 2. Granular Task Checklist

### Phase 1: DTOs & Domain Interfaces
- [x] **Task 3.1: Define Gatekeeper DTOs & Validation Schemas**
  - **File:** `backend/src/modules/gatekeeper/application/dto/evaluate-destination.dto.ts`, `backend/src/modules/gatekeeper/application/dto/start-search.dto.ts`, `backend/src/modules/gatekeeper/application/dto/gatekeeper-evaluation.dto.ts`
  - **Details:**
    - `EvaluateDestinationDto`: `origin` (`{ latitude: number, longitude: number }`), `destination` (`{ latitude: number, longitude: number, placeId?: string, name: string }`).
    - `StartSearchDto`: `destCoords` (`{ latitude: number, longitude: number }`), `destName` (string), `radiusMeters` (default 1000m, range 500m–1500m).
    - `GatekeeperEvaluationDto`: `isUnlocked: boolean`, `distanceMeters: number`, `durationSeconds: number`, `polyline: string`, `unlockThreshold: string`.
  - **Acceptance Criteria:** DTOs validate latitude/longitude coordinate bounds and radius ranges.

- [x] **Task 3.2: Domain Exceptions Definition**
  - **File:** `backend/src/modules/gatekeeper/domain/exceptions/gatekeeper-locked.exception.ts`
  - **Details:** Define `GatekeeperLockedException` extending `ParkLahException` (HTTP 403, error code `GATEKEEPER_LOCKED`).
  - **Acceptance Criteria:** Thrown when a Searcher attempts to start active matchmaking while outside the 3km / 10min boundary.

### Phase 2: External Ports & Routing Adapters
- [x] **Task 3.3: Google Maps Routing Port & Mock Adapter**
  - **File:** `backend/src/modules/gatekeeper/domain/ports/google-maps-routing.port.ts`, `backend/src/modules/gatekeeper/infrastructure/adapters/mock-google-maps.adapter.ts`
  - **Details:**
    - Define `IGoogleMapsRoutingPort`:
      - `searchPlace(query: string, proximity: LatLng): Promise<PlacePrediction[]>`
      - `getDistanceAndEta(origin: LatLng, destination: LatLng): Promise<RouteMetrics>`
      - `getPolyline(origin: LatLng, destination: LatLng): Promise<string>`
    - Implement `MockGoogleMapsRoutingAdapter` allowing deterministic configuration of distance, duration, and dummy polylines for isolated tests.
  - **Acceptance Criteria:** Mock adapter returns configurable route metrics without making external network calls.

- [x] **Task 3.4: Production Google Maps Platform Adapter**
  - **File:** `backend/src/modules/gatekeeper/infrastructure/adapters/google-maps.adapter.ts`
  - **Details:** Implement `IGoogleMapsRoutingPort` calling Google Places API (New) and Google Distance Matrix API with API key authorization, caching frequent routes in Redis with 5 min TTL.
  - **Acceptance Criteria:** Accurately parses Google API JSON responses into strongly-typed `RouteMetrics`.

### Phase 3: In-Memory Spatial Repository (Redis)
- [x] **Task 3.5: Searcher Spatial Repository Port & Redis Adapter**
  - **File:** `backend/src/modules/gatekeeper/domain/ports/searcher-spatial-repository.port.ts`, `backend/src/modules/gatekeeper/infrastructure/adapters/redis-searcher-spatial.repository.ts`
  - **Details:** Implement `ISearcherSpatialRepositoryPort`:
    - `registerActiveSearcher(searcherId, currentCoords, destCoords, radiusMeters)`: Executes `GEOADD geo:searchers:active {lng} {lat} {searcherId}` and `HSET searcher:state:{searcherId}` with 600s TTL.
    - `updateSearcherLocation(searcherId, coords)`: Updates coordinates in Redis `geo:searchers:active` and refreshes heartbeat.
    - `removeActiveSearcher(searcherId)`: Executes `ZREM geo:searchers:active {searcherId}` and `DEL searcher:state:{searcherId}`.
    - `getActiveSearcherState(searcherId)`: Retrieves cached session metadata.
  - **Acceptance Criteria:** Redis keys maintain proper TTL and spatial index consistency.

### Phase 4: Application Service & Core Gatekeeper Logic
- [x] **Task 3.6: Distance Gatekeeper Algorithm Formulation**
  - **File:** `backend/src/modules/gatekeeper/domain/services/gatekeeper-evaluator.service.ts`
  - **Details:** Implement gatekeeper validation rule:
    $$\text{isUnlocked} = (\text{distanceMeters} \le 3000) \land (\text{durationSeconds} \le 600)$$
  - **Acceptance Criteria:** Returns `isUnlocked: true` if and only if both conditions are strictly met.

- [x] **Task 3.7: Gatekeeper Application Service (`GatekeeperService`)**
  - **File:** `backend/src/modules/gatekeeper/application/services/gatekeeper.service.ts`
  - **Details:**
    - `resolveDestination(query, origin)`: Calls routing port to retrieve place suggestions and coordinates.
    - `evaluateDestination(searcherId, origin, destination)`: Calculates route metrics, evaluates gatekeeper condition, and returns `GatekeeperEvaluationDto`.
    - `startMatchmaking(searcherId, dto, currentCoords)`: Validates gatekeeper status; if unlocked, registers searcher in Redis spatial store; if locked, throws `GatekeeperLockedException`.
    - `stopMatchmaking(searcherId)`: Removes searcher from active spatial index.
  - **Acceptance Criteria:** Seamless transition between locked navigation and active matchmaking pool.

### Phase 5: REST Controllers & Routing
- [x] **Task 3.8: Gatekeeper REST Controller (`GatekeeperController`)**
  - **File:** `backend/src/modules/gatekeeper/infrastructure/controllers/gatekeeper.controller.ts`
  - **Details:**
    - `POST /api/v1/searcher/destination/search` (Search places query)
    - `POST /api/v1/searcher/destination/evaluate` (Evaluate ETA / distance / locked state)
    - `POST /api/v1/searcher/start` (Start active search in spatial queue)
    - `POST /api/v1/searcher/stop` (Cancel / stop active search)
  - **Acceptance Criteria:** Guarded by `JwtAuthGuard`; returns standard RFC 7807 problem details on error.

### Phase 6: Automated Unit & Integration Testing
- [x] **Task 3.9: Gatekeeper Service Unit Test Suite**
  - **File:** `backend/test/unit/gatekeeper/gatekeeper.service.spec.ts`
  - **Details:**
    - Test Case 1: Distance $4.5\text{km}$, ETA $8\text{min}$ $\rightarrow$ `isUnlocked: false` (distance exceeded).
    - Test Case 2: Distance $2.0\text{km}$, ETA $14\text{min}$ $\rightarrow$ `isUnlocked: false` (ETA exceeded).
    - Test Case 3: Distance $1.8\text{km}$, ETA $6\text{min}$ $\rightarrow$ `isUnlocked: true` (unlocked).
    - Test Case 4: Calling `startMatchmaking` when locked throws `GatekeeperLockedException (403)`.
    - Test Case 5: `startMatchmaking` when unlocked invokes Redis `GEOADD` and returns active session.
  - **Acceptance Criteria:** 100% test pass rate.
