# Task Breakdown: Module 1 - Mobile Client Application Subsystem (`client-app`)

**Module Identifier:** `client-app`  
**Parent Subsystem:** Client Layer (React Native Expo Mobile Application)  
**Input Documents:**  
- PRD: `backend/planning/01_prd.md` (FR-1.3, FR-2.1, FR-2.3, FR-2.4, FR-3.1–3.4, FR-6.1, FR-6.3, FR-7.1)  
- High-Level Design: `backend/planning/02_high-level-design.md` (Section 3, Module 1; Section 5, Flows 1–5; Section 7.1)  
- Detailed Design: `backend/planning/03_detailed-design.md` (Section 5.1, Section 5.9, Section 6)  

---

## 1. Module Overview & Scope
The **Mobile Client Application Subsystem** is the cross-platform frontend interface built with React Native (Expo SDK 54, React 19, TypeScript). It manages real-time GPS telemetry capture, interactive mapping, UI state machines (Searcher & Leaver journeys), WebSocket events, external navigation deep-linking (Waze/Google Maps/Apple Maps), and simulated wallet views.

---

## 2. Granular Task Checklist

### Phase 1: Environment, Constants & Theme Setup
- [x] **Task 1.1: Design Tokens & Typography Configuration**
  - **File:** `frontend/parklah/src/constants/theme.ts`, `frontend/parklah/src/global.css`
  - **Details:** Configure "Aegean Drift" color palette (Primary: `#008080` Teal, Dark: `#1E293B` Slate, Accent: `#F59E0B` Amber, Surface: `#F8FAFC`, Error: `#EF4444`) and `Lexend` typography font families across Tailwind / NativeWind.
  - **Acceptance Criteria:** Tailwind classes and theme constants correctly render across Android and iOS screens.

### Phase 2: Services & Infrastructure
- [x] **Task 1.2: Adaptive Location Telemetry Service (`LocationService`)**
  - **File:** `frontend/parklah/src/services/LocationService.ts`
  - **Details:** Wrap `expo-location` with adaptive tracking modes:
    - `IDLE`: Passive location updates every 60s or on significant motion.
    - `GATEKEEPER_LOCKED`: Medium accuracy GPS updates every 10s.
    - `ACTIVE_SEARCH` / `NAVIGATING`: High-accuracy GPS updates every 3s (`accuracy <= 15m`, speed, heading, timestamp).
  - **Acceptance Criteria:** Emits location events with valid `LocationCoordinates` (`latitude`, `longitude`, `accuracy`, `heading`, `speed`, `timestamp`).

- [x] **Task 1.3: External Navigation Deep-Link Utility (`NavigationLauncher`)**
  - **File:** `frontend/parklah/src/utils/navigationLauncher.ts`
  - **Details:** Implement deep linking shortcuts for:
    - Waze: `waze://?ll=${lat},${lng}&navigate=yes`
    - Google Maps: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`
    - Apple Maps: `maps://?daddr=${lat},${lng}`
    - Fallback: Web browser URL navigation.
  - **Acceptance Criteria:** Tapping external nav opens device mapping app with target spot coordinates.

- [x] **Task 1.4: Real-Time Socket Client Service (`SocketService`)**
  - **File:** `frontend/parklah/src/services/SocketService.ts`
  - **Details:** Implement singleton `SocketService` using `socket.io-client`:
    - Auto-reconnect with exponential backoff.
    - Authenticated handshake attaching JWT token.
    - Typed emitters (`searcher:telemetry`, `leaver:broadcast`, `match:accept`, `match:decline`, `searcher:confirm_parked`, `searcher:spot_taken`).
    - Typed listeners (`gatekeeper:status_update`, `match:offer`, `match:confirmed`, `prompt:arrival_confirm`, `searcher:fallback_spot`, `wallet:balance_update`).
  - **Acceptance Criteria:** Socket connects to backend gateway, handles room joining, and passes incoming events to Zustand stores.

### Phase 3: State Management (Zustand Stores)
- [x] **Task 1.5: Searcher Journey State Machine (`useSearcherStore`)**
  - **File:** `frontend/parklah/src/stores/useSearcherStore.ts`
  - **Details:** Manage Searcher states: `IDLE` -> `DESTINATION_SET` -> `GATEKEEPER_LOCKED` -> `ACTIVE_RADAR_SEARCH` -> `MATCH_OFFERED` -> `NAVIGATING_TO_SPOT` -> `ARRIVED_PROMPT` -> `PARKED_SUCCESS`.
  - **Actions:** `setDestination()`, `setGatekeeperStatus()`, `setActiveOffer()`, `acceptOffer()`, `declineOffer()`, `confirmParked()`, `reportSpotTaken()`, `reset()`.
  - **Acceptance Criteria:** State transitions match DDD Section 5.1.4 state machine specifications.

- [x] **Task 1.6: Leaver Journey State Machine (`useLeaverStore`)**
  - **File:** `frontend/parklah/src/stores/useLeaverStore.ts`
  - **Details:** Manage Leaver states: `IDLE` -> `BROADCASTING_COUNTDOWN` -> `SEARCHER_MATCHED` -> `HANDOFF_COMPLETED` -> `CANCELLED`.
  - **Actions:** `startBroadcast(coords, vehicle, note)`, `decrementCountdown()`, `setMatchedSearcher(searcherInfo)`, `cancelBroadcast()`, `reset()`.
  - **Acceptance Criteria:** Countdown timer decrements smoothly from 180–300s; cancellation triggers appropriate status update.

- [x] **Task 1.7: Wallet & User Profile State (`useWalletStore`, `useUserStore`)**
  - **File:** `frontend/parklah/src/stores/useWalletStore.ts`, `frontend/parklah/src/stores/useUserStore.ts`
  - **Details:** Store current user profile, active vehicle, wallet balance (default RM 20.00), and transaction history records.
  - **Acceptance Criteria:** Updates balance optimistically on socket events and API responses.

### Phase 4: UI Screens & Interaction Components
- [x] **Task 1.8: Destination Search & Autocomplete Bar**
  - **File:** `frontend/parklah/src/components/searcher/DestinationSearchBar.tsx`
  - **Details:** Implement search bar querying Google Places API with debounce, displaying prediction results, distance, and ETA preview.
  - **Acceptance Criteria:** Selecting a place updates `useSearcherStore` and triggers gatekeeper evaluation.

- [x] **Task 1.9: Interactive Map View & Animated Radar Overlay**
  - **File:** `frontend/parklah/src/components/map/ParkLahMapView.tsx`, `frontend/parklah/src/components/map/RadarOverlay.tsx`
  - **Details:** Render `react-native-maps` map with:
    - User GPS marker & heading arrow.
    - Destination pin & search radius circle (500m - 1.5km).
    - Pulsing animated radar circles during `ACTIVE_RADAR_SEARCH`.
    - Route polyline overlay to destination / spot.
  - **Acceptance Criteria:** Map smoothly centers and follows user position while navigating.

- [x] **Task 1.10: Match Offer Bottom Sheet / Modal (15s Countdown)**
  - **File:** `frontend/parklah/src/components/searcher/MatchOfferModal.tsx`
  - **Details:** Display counterpart car details (Make, Model, Color, Plate Suffix), ETA, and an animated 15s countdown timer bar with "Accept" and "Decline" buttons.
  - **Acceptance Criteria:** Automatically declines when 15s expires if no user interaction occurs.

- [x] **Task 1.11: Leaver Broadcast Sheet & Landmark Chips**
  - **File:** `frontend/parklah/src/components/leaver/LeaverBroadcastModal.tsx`
  - **Details:** Modal with 3–5 min countdown selector slider, vehicle selector, quick landmark note chips (*"Near Main Entrance"*, *"Basement 1"*, *"Facing Main Road"*, *"Lot #..."*), and "Broadcast Departure" button.
  - **Acceptance Criteria:** Submitting starts broadcast in `useLeaverStore` and emits `leaver:broadcast` socket event.

- [x] **Task 1.12: Dual-Verification Handover & "Spot Taken" Prompt**
  - **File:** `frontend/parklah/src/components/searcher/ArrivalVerificationModal.tsx`
  - **Details:** Displays when geofence triggers arrival prompt:
    - Primary button: "Parked Successfully" (confirms handover).
    - Exception button: "Spot Taken by Someone Else" (zero-charge report).
  - **Acceptance Criteria:** Tapping "Parked Successfully" emits `searcher:confirm_parked`; tapping "Spot Taken" emits `searcher:spot_taken`.

- [x] **Task 1.13: In-App Wallet & Transaction History Screen**
  - **File:** `frontend/parklah/src/app/(tabs)/wallet.tsx`, `frontend/parklah/src/components/wallet/TransactionCard.tsx`
  - **Details:** Screen showing current balance, Top-Up modal (+RM 10, +RM 20, +RM 50 mock buttons), Cash-Out modal, and scrollable transaction ledger history.
  - **Acceptance Criteria:** Reflects $-\text{RM }0.50$ deductions, $+\text{RM }0.25$ rewards, and top-ups in real-time.

### Phase 5: Automated Testing
- [x] **Task 1.14: Zustand Store Unit Tests**
  - **File:** `frontend/parklah/src/__tests__/stores.spec.ts`
  - **Details:** Unit tests for `useSearcherStore`, `useLeaverStore`, and `useWalletStore` testing state transitions and edge cases.
  - **Acceptance Criteria:** 100% test pass rate for all store actions.
