# Task Breakdown: Module 9 - Real-Time Gateway & WebSocket Subsystem (`real-time-gateway`)

**Module Identifier:** `real-time-gateway`  
**Parent Subsystem:** Backend Edge & Gateway Layer (`RealTimeGatewayModule`)  
**Input Documents:**  
- PRD: `backend/planning/01_prd.md` (FR-4.2, Section 5.2, NFR-6.1)  
- High-Level Design: `backend/planning/02_high-level-design.md` (Section 2; Section 3, Module 9; Section 7.1)  
- Detailed Design: `backend/planning/03_detailed-design.md` (Section 4, Section 5.9, Section 6)  

---

## 1. Module Overview & Scope
The **Real-Time Gateway & WebSocket Subsystem** establishes and maintains persistent, bi-directional WebSocket connections (Socket.io) with mobile clients. It leverages the Redis adapter for multi-instance horizontal scaling, handles authenticated connection handshakes via JWT, manages private user and room channels (`user:{id}`, `searcher:{id}`, `leaver:{id}`, `match:{matchId}`), processes 3-second high-frequency GPS telemetry, and broadcasts real-time matchmaking offers and state updates with $<200\text{ms}$ socket latency.

---

## 2. Granular Task Checklist

### Phase 1: Gateway Setup & Redis Adapter Configuration
- [x] **Task 9.1: Socket.io Gateway Server Configuration**
  - **File:** `backend/src/modules/gateway/infrastructure/gateways/app.gateway.ts`
  - **Details:** Configure NestJS `WebSocketGateway` on port 3001 with CORS configuration, namespace `/events`, ping timeout (20s), ping interval (25s), and `@socket.io/redis-adapter` using Redis Pub/Sub client instances.
  - **Acceptance Criteria:** Supports concurrent socket connections across multiple backend node instances.

### Phase 2: Authentication & Connection Lifecycle
- [x] **Task 9.2: WebSocket JWT Authentication Middleware**
  - **File:** `backend/src/modules/gateway/infrastructure/guards/ws-jwt.guard.ts`, `backend/src/modules/gateway/infrastructure/middleware/ws-auth.middleware.ts`
  - **Details:**
    - Extract JWT from `client.handshake.auth.token` or headers.
    - Validate signature and expiration; check active session in Redis (`session:token:{userId}`).
    - Attach authenticated `user` object to `client.data`.
    - If token is invalid or missing, disconnect client with `UnauthorizedError`.
  - **Acceptance Criteria:** Unauthenticated socket connections are rejected at handshake.

- [x] **Task 9.3: Connection & Disconnect Lifecycle Management**
  - **File:** `backend/src/modules/gateway/infrastructure/services/connection-manager.service.ts`
  - **Details:**
    - On connection: Store socket ID in Redis `socket:user:{userId}`, auto-join default user room `user:{userId}`.
    - On disconnection: Remove socket ID from Redis, trigger passive cleanup if user was in active search or leaver broadcast mode.
  - **Acceptance Criteria:** Ephemeral socket presences cleanly maintained in Redis without dangling mappings.

### Phase 3: Room Management & Event Broadcasting Service
- [x] **Task 9.4: Room Subscription & Channel Isolation Service**
  - **File:** `backend/src/modules/gateway/infrastructure/services/room-manager.service.ts`
  - **Details:** Implement helper methods:
    - `joinRoom(socketId, roomName)`: Subscribes socket to room (e.g. `match:${matchId}`).
    - `leaveRoom(socketId, roomName)`: Leaves room.
    - `broadcastToUser(userId, event, payload)`: Emits to room `user:${userId}`.
    - `broadcastToMatch(matchId, event, payload)`: Emits to room `match:${matchId}`.
  - **Acceptance Criteria:** Targeted message isolation ensuring only authorized counterparties receive match events.

- [x] **Task 9.5: Outbound Event Broadcaster Service (`SocketBroadcasterService`)**
  - **File:** `backend/src/modules/gateway/application/services/socket-broadcaster.service.ts`
  - **Details:** Implement strongly typed event broadcasters:
    - `emitGatekeeperStatus(userId, status)`
    - `emitMatchOffer(searcherId, offerPayload)`
    - `emitMatchConfirmed(searcherId, leaverId, matchPayload)`
    - `emitArrivalPrompt(searcherId, matchId)`
    - `emitFallbackSpot(searcherId, spotPayload)`
    - `emitWalletUpdate(userId, walletPayload)`
  - **Acceptance Criteria:** All emitted payloads conform strictly to DDD Section 5.9.2 event catalog schemas.

### Phase 4: Inbound Socket Event Handlers
- [x] **Task 9.6: Telemetry & Broadcast Inbound Handlers**
  - **File:** `backend/src/modules/gateway/infrastructure/handlers/telemetry.handler.ts`, `backend/src/modules/gateway/infrastructure/handlers/leaver.handler.ts`
  - **Details:**
    - Listen for `searcher:telemetry`: Parse GPS coordinates, forward to `VerificationService.evaluateTelemetry()` and `GatekeeperService.updateSearcherLocation()`.
    - Listen for `leaver:broadcast`: Forward departure payload to `LeaverBroadcastService.broadcastDeparture()`.
  - **Acceptance Criteria:** Processes high-frequency 3s telemetry with minimal CPU overhead.

- [x] **Task 9.7: Handshake & Verification Inbound Handlers**
  - **File:** `backend/src/modules/gateway/infrastructure/handlers/match-handshake.handler.ts`, `backend/src/modules/gateway/infrastructure/handlers/verification.handler.ts`
  - **Details:**
    - Listen for `match:accept`: Forward to `SpatialMatchmakerService.acceptMatch()`.
    - Listen for `match:decline`: Forward to `SpatialMatchmakerService.declineMatch()`.
    - Listen for `searcher:confirm_parked`: Forward to `VerificationService.confirmParkedSuccess()`.
    - Listen for `searcher:spot_taken`: Forward to `VerificationService.reportSpotTaken()`.
  - **Acceptance Criteria:** Handshake actions dispatched to application services in $<20\text{ms}$.

### Phase 5: Automated Unit & E2E Testing
- [x] **Task 9.8: WebSocket Gateway Unit & E2E Integration Tests**
  - **File:** `backend/test/integration/gateway/gateway.e2e.spec.ts`
  - **Details:** Test socket client handshake with valid/invalid JWT, room subscription, event emission to rooms, and disconnect handling using `socket.io-client`.
  - **Acceptance Criteria:** 100% test pass rate with simulated socket client connections.
