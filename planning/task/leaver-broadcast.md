# Task Breakdown: Module 4 - Leaver & Departure Broadcast Subsystem (`leaver-broadcast`)

**Module Identifier:** `leaver-broadcast`  
**Parent Subsystem:** Backend Application Layer (`LeaverBroadcastModule`)  
**Input Documents:**  
- PRD: `backend/planning/01_prd.md` (FR-3.1, FR-3.2, FR-3.3, FR-3.4, Section 7)  
- High-Level Design: `backend/planning/02_high-level-design.md` (Section 3, Module 4; Section 5.2, Flow 2; Section 6.2; Section 7.1)  
- Detailed Design: `backend/planning/03_detailed-design.md` (Section 4, Section 5.4, Section 7)  

---

## 1. Module Overview & Scope
The **Leaver & Departure Broadcast Subsystem** provides departure broadcast functionality for drivers intending to vacate their parking spots within a 3–5 minute window. It captures high-accuracy GPS spot coordinates, vehicle details, and optional landmark chips, registers the active spot in Redis, and publishes domain events to trigger the spatial matchmaker or probabilistic vacancy fallback.

---

## 2. Granular Task Checklist

### Phase 1: DTOs & Validation Rules
- [x] **Task 4.1: Define Departure Broadcast DTOs**
  - **File:** `backend/src/modules/leaver/application/dto/departure-broadcast.dto.ts`, `backend/src/modules/leaver/application/dto/cancel-departure.dto.ts`, `backend/src/modules/leaver/application/dto/broadcast-session.dto.ts`
  - **Details:**
    - `DepartureBroadcastDto`:
      - `coordinates`: `{ latitude: number, longitude: number, accuracy: number }` (accuracy $\le 15$m check).
      - `countdownSeconds`: `@IsInt()`, `@Min(180)`, `@Max(300)` (strictly 3 to 5 minutes).
      - `vehicleId`: `@IsUUID()`
      - `landmarkNote`: `@IsOptional()`, `@IsString()`, `@Length(0, 100)` (e.g., *"Near Main Entrance"*, *"Basement 1, Pillar C"*).
    - `CancelDepartureDto`: `reason` (string, e.g. "CHANGE_OF_PLANS").
  - **Acceptance Criteria:** Reject countdowns $<180\text{s}$ or $>300\text{s}$ with `400 Bad Request`.

### Phase 2: Domain Events & Messaging Ports
- [x] **Task 4.2: Define Leaver Domain Events**
  - **File:** `backend/src/modules/leaver/domain/events/leaver-broadcasted.event.ts`, `backend/src/modules/leaver/domain/events/leaver-cancelled.event.ts`
  - **Details:**
    - `LeaverBroadcastedEvent`: `{ leaverId: string, coordinates: LatLng, countdownSeconds: number, vehicle: VehicleSummary, landmarkNote?: string, timestamp: Date }`.
    - `LeaverCancelledEvent`: `{ leaverId: string, reason: string, remainingSeconds: number, isMatched: boolean }`.
  - **Acceptance Criteria:** Event payloads are strongly typed and serializable to JSON.

- [x] **Task 4.3: Event Publisher Port & Redis Pub/Sub Adapter**
  - **File:** `backend/src/modules/leaver/domain/ports/event-publisher.port.ts`, `backend/src/modules/leaver/infrastructure/adapters/redis-event-publisher.adapter.ts`
  - **Details:** Implement `IEventPublisherPort` using Redis Pub/Sub channel `events:leaver:broadcast` and `events:leaver:cancelled`.
  - **Acceptance Criteria:** Events published on Redis channel with sub-10ms delivery to subscribers.

### Phase 3: In-Memory Spatial Repository (Redis)
- [x] **Task 4.4: Leaver Spatial Repository Port & Redis Adapter**
  - **File:** `backend/src/modules/leaver/domain/ports/leaver-spatial-repository.port.ts`, `backend/src/modules/leaver/infrastructure/adapters/redis-leaver-spatial.repository.ts`
  - **Details:** Implement `ILeaverSpatialRepositoryPort`:
    - `registerActiveLeaver(leaverId, coords, countdownSec, sessionData)`: Executes `GEOADD geo:leavers:active {lng} {lat} {leaverId}` and `HSET leaver:state:{leaverId}` with TTL equal to `countdownSec + 60s`.
    - `removeActiveLeaver(leaverId)`: Executes `ZREM geo:leavers:active {leaverId}` and `DEL leaver:state:{leaverId}`.
    - `updateCountdown(leaverId, remainingSec)`: Updates remaining seconds in hash.
    - `getLeaverSession(leaverId)`: Retrieves current broadcast session.
  - **Acceptance Criteria:** Active leavers accurately indexed with automatic TTL expiration.

### Phase 4: Application Service & Cancellation Grace Period Logic
- [x] **Task 4.5: Leaver Broadcast Application Service (`LeaverBroadcastService`)**
  - **File:** `backend/src/modules/leaver/application/services/leaver-broadcast.service.ts`
  - **Details:**
    - `broadcastDeparture(leaverId, dto)`: Validates active vehicle ownership, stores session in Redis, and publishes `LeaverBroadcastedEvent`.
    - `syncCountdown(leaverId, remainingSec)`: Updates live countdown timer in Redis state.
    - `cancelDeparture(leaverId, dto)`:
      - Checks current state: if not matched or cancelled $>2\text{ minutes}$ before ETA $\rightarrow$ clean cancellation with no penalty.
      - If matched to a Searcher and cancelled $<60\text{ seconds}$ before ETA $\rightarrow$ decrements leaver reliability rating by $-0.10$ and publishes `LeaverCancelledEvent` to trigger searcher rerouting.
      - Purges Redis session.
  - **Acceptance Criteria:** Grace period rules correctly applied; rating penalty applied only on last-minute matched cancellations.

### Phase 5: REST Controllers & Socket Handlers
- [x] **Task 4.6: Ingress Handlers (`LeaverController` & Gateway Listener)**
  - **File:** `backend/src/modules/leaver/infrastructure/controllers/leaver.controller.ts`, `backend/src/modules/leaver/infrastructure/gateways/leaver.gateway.ts`
  - **Details:**
    - REST: `POST /api/v1/leaver/broadcast`, `POST /api/v1/leaver/cancel`, `GET /api/v1/leaver/session`
    - Socket Listener: `leaver:broadcast`, `leaver:cancel`, `leaver:countdown_tick`
  - **Acceptance Criteria:** Validates JWT claims; handles concurrent broadcasts gracefully.

### Phase 6: Automated Unit & Integration Testing
- [x] **Task 4.7: Leaver Broadcast Service Unit Test Suite**
  - **File:** `backend/test/unit/leaver/leaver-broadcast.service.spec.ts`
  - **Details:**
    - Test Case 1: Valid broadcast (countdown 240s) saves in Redis and publishes `LeaverBroadcastedEvent`.
    - Test Case 2: Broadcast with countdown 120s is rejected with validation error.
    - Test Case 3: Cancellation $>2$ min before ETA executes without rating penalty.
    - Test Case 4: Matched cancellation $<60$s before ETA triggers rating penalty and searcher reroute event.
  - **Acceptance Criteria:** 100% test pass rate.
