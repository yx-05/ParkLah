# ParkLah Feature Roadmap & Implementation TODO

**Last Updated:** 2026-09-12  
**Status:** In Active Development / Pitch Ready  

---

## 1. Feature TODO: Google & Facebook Social OAuth Authentication

### Phase 1: Database Migration (PostgreSQL / Supabase)
- [ ] **Task 1.1: Schema Extension for Social Identities**
  - **File:** `backend/src/database/migrations/006_add_social_auth_fields.sql`
  - **Details:**
    - Alter `users.phone_number` to allow `NULL` upon initial social login.
    - Add `email VARCHAR(255) UNIQUE`.
    - Add `auth_provider VARCHAR(20) DEFAULT 'PHONE' CHECK (auth_provider IN ('PHONE', 'GOOGLE', 'FACEBOOK', 'APPLE'))`.
    - Add `auth_provider_id VARCHAR(255)`.
    - Add `avatar_url VARCHAR(500)`.
    - Add index on `users(email)` and `users(auth_provider, auth_provider_id)`.

### Phase 2: Backend API & User Synchronization
- [ ] **Task 1.2: OAuth DTO & Domain Entity Updates**
  - **Files:** `backend/src/modules/auth/domain/entities/user.entity.ts`, `backend/src/modules/auth/application/dto/oauth-sync.dto.ts`
  - **Details:** Add social identity attributes to `UserEntity` and validate incoming OAuth profile payloads.
- [ ] **Task 1.3: OAuth Synchronization Service & Endpoint**
  - **Files:** `backend/src/modules/auth/application/services/auth.service.ts`, `backend/src/modules/auth/infrastructure/controllers/auth.controller.ts`
  - **Endpoint:** `POST /api/v1/auth/oauth/sync`
  - **Details:**
    - Finds or creates user by `auth_provider_id` or `email`.
    - Automatically initializes default in-app wallet with RM 20.00.
    - Issues standard ParkLah JWT token pair (Access Token + Refresh Token).

### Phase 3: Mobile Client Integration (`frontend/parklah`)
- [ ] **Task 1.4: Supabase OAuth Client & Deep Link Scheme**
  - **Files:** `frontend/parklah/src/services/SupabaseClient.ts`, `frontend/parklah/app.json`
  - **Details:** Configure `expo-auth-session` / `expo-web-browser` with custom app scheme `parklah://auth-callback`.
- [ ] **Task 1.5: UI Login Buttons & Social Handlers**
  - **Files:** `frontend/parklah/src/app/index.tsx`, `frontend/parklah/src/components/SocialIcons.tsx`
  - **Details:** Connect "Continue with Google" and "Continue with Facebook" action buttons to the OAuth browser session and backend sync.
- [ ] **Task 1.6: Post-Login Onboarding Modal (Phone Number & Vehicle)**
  - **Files:** `frontend/parklah/src/components/auth/LinkPhoneModal.tsx`
  - **Details:** Prompt first-time social login users to add a Malaysian phone number for departure handoff alerts.

---

## 2. Feature TODO: Live Google Maps Platform Integration

### Phase 1: Cloud Console Credentials Setup
- [ ] **Task 2.1: Google Cloud APIs Enablement & Keys**
  - **Scope:** Google Cloud Console
  - **Details:**
    - Enable Places API (New), Distance Matrix API, Directions API, and Maps SDK for Android / iOS.
    - Restrict API key to package names / SHA-1 certificates for production security.

### Phase 2: Backend Real-Time Routing Service
- [ ] **Task 2.2: Google Maps REST Client Refinement**
  - **File:** `backend/src/modules/gatekeeper/infrastructure/adapters/google-maps-routing.adapter.ts`
  - **Details:**
    - Live Malaysian Places Autocomplete (`country:my`).
    - Live Traffic-Adjusted Driving Distance & ETA calculation for Gatekeeper ($\le 3\text{km} \ / \ \le 10\text{min}$).
    - Route polyline extraction between searcher GPS and parking spot coordinates.

### Phase 3: Mobile Map Rendering & Autocomplete UI
- [ ] **Task 2.3: Mobile Google Places Autocomplete Search Bar**
  - **File:** `frontend/parklah/src/components/searcher/DestinationSearchBar.tsx`
  - **Details:** Debounced live query against Google Places API with preview of distance and driving ETA.
- [ ] **Task 2.4: Native Map Polyline & Route Rendering**
  - **Files:** `frontend/parklah/src/components/SearcherMap.native.tsx`, `frontend/parklah/src/components/SearcherMap.web.tsx`
  - **Details:** Render Google vector map tiles, live animated search radar circle, and decoded turn-by-turn route polylines.

---

## 3. Automated Test Suite Updates
- [ ] **Task 3.1: Social OAuth Unit Tests**
  - **File:** `backend/test/unit/auth/oauth.service.spec.ts`
  - **Details:** Test user creation via Google/Facebook, wallet auto-provisioning, and JWT issuance.
- [ ] **Task 3.2: Google Maps Adapter Fallback Tests**
  - **File:** `backend/test/unit/gatekeeper/google-maps.adapter.spec.ts`
  - **Details:** Test live API responses and graceful fallback to Haversine routing on network timeouts.

---

## 4. Feature TODO: Machine Learning Matchmaking & Ranking Engine
- **Specifications:** `planning/04_machine_learning.md`
- **Parallel Subagent Execution Plan:** `planning/ml_task.md`
- [x] **Track 1: ML Pipeline (Offline Synthetic Data & Model)**
  - `scripts/ml/generate_synthetic_matches.py` (50,000 samples, calibrated log-odds ground truth)
  - `scripts/ml/train_lightgbm.py` (LightGBM training, evaluation, validation, ONNX export with `zipmap=False`)
  - Output artifact: `backend/src/modules/matchmaker/infrastructure/models/parklah_matchmaker_v1.onnx`
  - Metadata: `backend/src/modules/matchmaker/infrastructure/models/feature_metadata.json`
  - Performance: $\text{ROC-AUC} = 0.8807$, $\text{PR-AUC} = 0.9123$, $\text{ECE} = 0.0103$
- [x] **Track 2: Geospatial & Routing Engine**
  - `backend/src/modules/matchmaker/domain/services/pharos-candidate-filter.service.ts` (Geodesic bearing, angular divergence, 4-tier filtering)
  - `backend/src/modules/matchmaker/domain/ports/road-routing.port.ts`
  - `backend/src/modules/matchmaker/infrastructure/adapters/osrm-road-routing.adapter.ts` (OSRM `/table/v1/driving` with urban Haversine fallback)
- [x] **Track 3: Telemetry Logging & Database Persistence**
  - `backend/src/database/migrations/008_create_ml_match_features.sql` (Inference snapshot schema)
  - `backend/src/modules/matchmaker/domain/ports/ml-feature-repository.port.ts`
  - `backend/src/modules/matchmaker/infrastructure/repositories/postgres-ml-feature.repository.ts`
  - `backend/src/modules/matchmaker/application/services/ml-feature-logger.service.ts` (Non-blocking async telemetry & outcome logger)
- [x] **Track 4: NestJS Runtime Assembly & Cascading Dispatch**
  - `backend/src/modules/matchmaker/infrastructure/adapters/onnx-ml-match-scoring.adapter.ts` (`onnxruntime-node` integration, $< 1\text{ms}$ latency)
  - `backend/src/modules/matchmaker/infrastructure/services/candidate-discovery.service.ts` (Pharos filter + OSRM routing + LightGBM inference)
  - `backend/src/modules/matchmaker/application/services/spatial-matchmaker.service.ts` (15s cascading lock waterfall, declined/timeout candidate exclusion)
  - End-to-end unit and integration verification (20/20 test suites, 82/82 tests passing).

---

## 5. Completed: AI Urban Demand Forecasting & Telemetry Anti-Abuse Guard
- **Specifications:** `planning/pitch_ml_enhancement_task.md`
- **Status:** Completed & Integrated (134 total passing tests)
- [x] **Track 1: Python Offline Machine Learning Pipelines**
  - `scripts/ml/train_fraud_isolation_forest.py` (12,000 synthetic interaction episodes, 7 features, $F_1 \ge 0.90$)
  - `scripts/ml/train_demand_forecaster.py` (25,000 hourly observations, LightGBM / RF, $R^2 = 0.9938$, $\text{MAE} = 0.0123$)
  - Output artifacts: `scripts/ml/fraud_model_metadata.json`, `scripts/ml/demand_model_metadata.json`
- [x] **Track 2: Backend Demand Forecasting & Urban Zoning Engine**
  - `backend/src/modules/gatekeeper/application/services/demand-forecast.service.ts` (DBKL land-use zoning calibration for Nightlife, Retail Malls, Campus, and Residential archetypes)
  - `backend/src/modules/gatekeeper/infrastructure/controllers/gatekeeper.controller.ts` (Exposed `GET /api/v1/gatekeeper/demand-forecast`)
  - Unit tests: `backend/test/unit/gatekeeper/demand-forecast.service.spec.ts` (7 tests passing)
- [x] **Track 3: Real-Time Telemetry Integrity & Anti-Abuse Guard**
  - `backend/src/modules/verification/domain/services/telemetry-integrity.service.ts` (Doppler velocity $\le 140\text{ km/h}$, teleportation delta $\le 40\text{ m/s}$, accuracy $\le 50\text{m}$, staleness $\le 25\text{s}$)
  - `backend/scripts/inspect_system_status.js` & `inspect-db.ts` (Live CLI anti-abuse audit report in `npm run inspect`)
  - Unit tests: `backend/test/unit/verification/telemetry-integrity.service.spec.ts` (6 tests passing)
- [x] **Track 4: Mobile Client UX & Bugfixes**
  - `frontend/parklah/src/app/(tabs)/searcher.tsx` (Interactive AI Demand Forecast destination card)
  - `frontend/parklah/src/services/ApiService.ts` (Demand API + unique `osm_id` key deduplication)
  - FlatList key collision bugfix in `searcher.tsx` and `DestinationSearchBar.tsx`


