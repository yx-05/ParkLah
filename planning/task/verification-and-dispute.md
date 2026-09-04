# Task Breakdown: Module 7 - Verification, Handover & Dispute Subsystem (`verification-and-dispute`)

**Module Identifier:** `verification-and-dispute`  
**Parent Subsystem:** Backend Application Layer (`VerificationAndDisputeModule`)  
**Input Documents:**  
- PRD: `backend/planning/01_prd.md` (FR-6.1, FR-6.2, FR-6.3, FR-6.4, Section 7)  
- High-Level Design: `backend/planning/02_high-level-design.md` (Section 3, Module 7; Section 5.4, Flow 4; Section 5.5, Flow 5; Section 6.1)  
- Detailed Design: `backend/planning/03_detailed-design.md` (Section 3.1–3.2, Section 5.7, Section 7)  

---

## 1. Module Overview & Scope
The **Verification, Handover & Dispute Subsystem** verifies vehicle arrival and successful physical parking handoffs. It executes a **dual-verification mechanism** (automated GPS geofence $\le 30\text{m}$ with vehicle speed $= 0\text{ km/h}$ for $\ge 15\text{s}$ + manual "Parked Successfully" confirmation button), triggers atomic financial settlement in the Wallet Module, and handles "Spot Taken by Someone Else" exceptions with guaranteed zero charges ($\text{RM }0.00$) and dynamic rerouting.

---

## 2. Granular Task Checklist

### Phase 1: Database Migration & Schema Setup
- [x] **Task 7.1: PostgreSQL Migration for `dispute_reports` Table**
  - **File:** `backend/src/database/migrations/004_create_dispute_reports_table.sql`
  - **Details:**
    - Create `dispute_reports` table: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `match_id UUID NOT NULL REFERENCES matches(id)`, `reporter_user_id UUID NOT NULL REFERENCES users(id)`, `spot_id UUID REFERENCES probabilistic_spots(id)`, `dispute_type VARCHAR(40) NOT NULL CHECK (dispute_type IN ('SPOT_TAKEN_BY_STRANGER', 'LEAVER_DID_NOT_LEAVE', 'WRONG_LOCATION', 'SEARCHER_NO_SHOW'))`, `description VARCHAR(255)`, `status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AUTO_RESOLVED', 'MANUAL_REVIEW', 'REJECTED'))`, timestamps (`created_at`, `resolved_at`).
    - Create index on `dispute_reports(match_id)`.
  - **Acceptance Criteria:** Table created with relational constraints.

### Phase 2: Domain Entities & Repository Ports
- [x] **Task 7.2: Domain Entities & Interfaces**
  - **File:** `backend/src/modules/verification/domain/entities/dispute-report.entity.ts`, `backend/src/modules/verification/domain/enums/dispute-type.enum.ts`
  - **Details:** Define `DisputeReportEntity` and `DisputeType` enum with helper methods for auto-resolution.
  - **Acceptance Criteria:** Entity encapsulates report lifecycle logic.

- [x] **Task 7.3: Dispute Repository Port & PostgreSQL Adapter**
  - **File:** `backend/src/modules/verification/domain/ports/dispute-repository.port.ts`, `backend/src/modules/verification/infrastructure/adapters/postgres-dispute.repository.ts`
  - **Details:** Implement `IDisputeRepositoryPort` (`createReport`, `findById`, `getRecentReportsByUser`, `resolveReport`).
  - **Acceptance Criteria:** Methods store dispute events with user telemetry context.

### Phase 3: Geofencing & Telemetry Engine
- [x] **Task 7.4: Dual-Verification Geofencing Engine (`GeofenceEngine`)**
  - **File:** `backend/src/modules/verification/domain/services/geofence.engine.ts`
  - **Details:** Implement `IGeofenceEngine`:
    - Haversine distance calculation between driver current GPS and target spot coordinates:
      $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2(\Delta\phi/2) + \cos\phi_1\cos\phi_2\sin^2(\Delta\lambda/2)}\right)$$
    - `isWithinGeofence(driverLoc, spotLoc)`: Returns `true` if $d \le 30.0\text{ meters}$.
    - `evaluateArrivalCondition(telemetry, spotLoc)`: Returns `true` if inside $30\text{m}$ geofence AND `speed <= 0.5 km/h` AND `stationaryDuration >= 15 seconds`.
  - **Acceptance Criteria:** Accurately detects stationary vehicle arrival within 30m geofence while suppressing in-motion false positives.

### Phase 4: Application Service & Settlement Coordination
- [x] **Task 7.5: Verification Application Service (`VerificationService`)**
  - **File:** `backend/src/modules/verification/application/services/verification.service.ts`
  - **Details:**
    - `evaluateTelemetry(searcherId, telemetry)`: Evaluates driver GPS updates; when arrival condition is met, emits `prompt:arrival_confirm` event to searcher client.
    - `confirmParkedSuccess(matchId, searcherId)`:
      - Validates match state is `ARRIVED` or `EN_ROUTE`.
      - Transitions match state to `COMPLETED`.
      - Calls `WalletService.executeHandoffSettlement(searcherId, leaverId, matchId)` to execute ACID financial transaction.
      - Dispatches `wallet:balance_update` events to both parties.
    - `reportSpotTaken(searcherId, dto)`:
      - Validates match or spot ID.
      - Sets match state to `FAILED_SPOT_TAKEN` with `searcher_charge_amount = 0.00`.
      - Calls `ProbabilisticVacancyService.invalidateSpot(spotId, 'OCCUPIED')`.
      - Creates `DisputeReportEntity` with status `AUTO_RESOLVED`.
      - Fetches next highest probability fallback spot from `ProbabilisticVacancyService` and dispatches `searcher:routed_db_spot` or reroute event.
  - **Acceptance Criteria:** Successful handovers trigger immediate settlements; "Spot Taken" reports charge RM 0.00 and reroute seamlessly.

### Phase 5: REST Controllers & Socket Handlers
- [x] **Task 7.6: Ingress Handlers (`VerificationController` & Socket Gateway)**
  - **File:** `backend/src/modules/verification/infrastructure/controllers/verification.controller.ts`, `backend/src/modules/verification/infrastructure/gateways/verification.gateway.ts`
  - **Details:**
    - Socket Listeners: `searcher:telemetry`, `searcher:confirm_parked`, `searcher:spot_taken`.
    - REST: `POST /api/v1/verification/dispute/report`, `GET /api/v1/verification/dispute/history`.
  - **Acceptance Criteria:** Socket events processed within $<100\text{ms}$.

### Phase 6: Automated Unit & Integration Testing
- [x] **Task 7.7: Geofence Engine Unit Tests**
  - **File:** `backend/test/unit/verification/geofence-engine.spec.ts`
  - **Details:**
    - Test Case 1: Driver at $15\text{m}$, speed $0\text{ km/h}$, stationary $16\text{s}$ $\rightarrow$ triggers arrival condition.
    - Test Case 2: Driver at $15\text{m}$, speed $30\text{ km/h}$ (driving past) $\rightarrow$ does NOT trigger arrival.
    - Test Case 3: Driver at $45\text{m}$, speed $0\text{ km/h}$ $\rightarrow$ outside geofence, no trigger.
  - **Acceptance Criteria:** 100% test pass rate.

- [x] **Task 7.8: Verification & "Spot Taken" Service Unit Tests**
  - **File:** `backend/test/unit/verification/verification.service.spec.ts`
  - **Details:**
    - Test Case 1: Successful parking confirmation invokes wallet settlement and marks match completed.
    - Test Case 2: "Spot Taken" report creates auto-resolved dispute, zeroes charge amount, invalidates spot, and invokes reroute.
  - **Acceptance Criteria:** 100% test pass rate.
