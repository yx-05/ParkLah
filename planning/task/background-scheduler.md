# Task Breakdown: Module 10 - Asynchronous Task & Decay Scheduler Subsystem (`background-scheduler`)

**Module Identifier:** `background-scheduler`  
**Parent Subsystem:** Backend Worker & Scheduler Layer (`BackgroundSchedulerModule`)  
**Input Documents:**  
- PRD: `backend/planning/01_prd.md` (FR-4.2, FR-5.2, Section 5.2)  
- High-Level Design: `backend/planning/02_high-level-design.md` (Section 3, Module 10; Section 5.3, Flow 3)  
- Detailed Design: `backend/planning/03_detailed-design.md` (Section 4, Section 5.10, Section 7)  

---

## 1. Module Overview & Scope
The **Asynchronous Task & Decay Scheduler Subsystem** orchestrates background worker queues and scheduled recurring cron jobs. It runs recurring 60-second mathematical decay ticks on all available probabilistic spots, executes automated sweeps to mark expired spots ($t > 15\text{ min}$ or $P(t) < 15\%$), and manages 15-second delayed jobs in BullMQ to handle unaccepted match handshake timeouts.

---

## 2. Granular Task Checklist

### Phase 1: BullMQ & Redis Queue Infrastructure Setup
- [x] **Task 10.1: BullMQ Queue Module Configuration**
  - **File:** `backend/src/modules/scheduler/infrastructure/bullmq.module.ts`
  - **Details:** Configure BullMQ connection with Redis (`decay-queue`, `match-timeout-queue`, `cleanup-queue`) with automatic retry strategies, dead-letter queues, and error logging listeners.
  - **Acceptance Criteria:** Successfully establishes queue connections to Redis.

### Phase 2: Cron Jobs (Decay Tick & Spot Cleanup)
- [x] **Task 10.2: Recurring Mathematical Decay Cron Job**
  - **File:** `backend/src/modules/scheduler/infrastructure/jobs/probabilistic-decay.cron.ts`
  - **Details:**
    - Schedule: `@Cron('* * * * *')` (every 60 seconds).
    - Invokes `ProbabilisticVacancyService.batchDecayTick()` to recompute $P(t) = 0.950 \cdot e^{-0.150 \cdot t} \cdot M_{\text{traffic}}$ for all active spots.
    - Logs execution time and number of updated records.
  - **Acceptance Criteria:** Job runs every minute and completes execution in $<500\text{ms}$.

- [x] **Task 10.3: Expired Spots Cleanup Cron Job**
  - **File:** `backend/src/modules/scheduler/infrastructure/jobs/expired-spots.cron.ts`
  - **Details:**
    - Schedule: `@Cron('* * * * *')` (every 60 seconds).
    - Invokes `ProbabilisticVacancyService.expireSpotsBatch(now)` to mark spots exceeding the 15-minute lifespan or with $P(t) < 0.150$ as `EXPIRED`.
  - **Acceptance Criteria:** Stale and low-confidence spots are purged from candidate spatial queries.

### Phase 3: Delayed Jobs (15-Second Match Handshake Timeout)
- [x] **Task 10.4: Handshake Timeout Delayed Queue Producer & Consumer**
  - **File:** `backend/src/modules/scheduler/infrastructure/jobs/match-timeout.processor.ts`, `backend/src/modules/scheduler/application/services/match-timeout-scheduler.service.ts`
  - **Details:**
    - Producer: `scheduleHandshakeTimeout(matchId: string, delayMs = 15000)`: Adds delayed job to BullMQ queue with `jobId = match:${matchId}:timeout`.
    - Consumer: Processes job after 15s delay; invokes `SpatialMatchmakerService.handleHandshakeTimeout(matchId)` to release mutex lock and cascade offer to next candidate.
    - Cancellation: `cancelHandshakeTimeout(matchId: string)`: Removes delayed job if searcher accepts/declines before 15s.
  - **Acceptance Criteria:** Delayed job fires exactly at 15s if not cancelled; properly cleans up upon early acceptance.

### Phase 4: Job Monitoring, Metrics & Error Handling
- [x] **Task 10.5: Scheduler Health & Telemetry Metrics**
  - **File:** `backend/src/modules/scheduler/infrastructure/services/scheduler-health.service.ts`
  - **Details:** Expose queue statistics (active jobs, delayed count, failed count) and health check endpoint for monitoring background processing health.
  - **Acceptance Criteria:** Provides observability into worker execution latencies and queue backlogs.

### Phase 5: Automated Unit & Scheduler Testing
- [x] **Task 10.6: Background Scheduler Unit Tests**
  - **File:** `backend/test/unit/scheduler/decay-cron.spec.ts`, `backend/test/unit/scheduler/match-timeout.spec.ts`
  - **Details:** Test cron trigger invoking `batchDecayTick()`, test 15s delayed timeout execution using Jest fake timers, and test timeout cancellation on early acceptance.
  - **Acceptance Criteria:** 100% test pass rate.
