const path = require('path');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const BACKEND_URL = process.env.API_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'parklah-super-secret-jwt-key-min-32-chars-change-in-prod';

// Simulated Leaver Driver (Registered in public.users)
const SIMULATED_LEAVER = {
  id: '11111111-2222-3333-4444-555555555555',
  phoneNumber: '+60188889999',
  role: 'USER',
};

async function runLeaverSimulation() {
  console.log('\n================================================================');
  console.log('       PARKLAH REAL-TIME MATCHMAKING & NAVIGATION SIMULATOR     ');
  console.log('================================================================\n');

  // Generate a valid JWT for the simulated leaver
  const token = jwt.sign(
    {
      sub: SIMULATED_LEAVER.id,
      userId: SIMULATED_LEAVER.id,
      phoneNumber: SIMULATED_LEAVER.phoneNumber,
      role: SIMULATED_LEAVER.role,
    },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

  // Check if coordinates passed via CLI or discover from Redis active searchers
  let targetLat = process.argv[2] ? parseFloat(process.argv[2]) : 3.1390;
  let targetLng = process.argv[3] ? parseFloat(process.argv[3]) : 101.6860;

  let activeSearcherId = null;

  try {
    const Redis = require('ioredis');
    const isTls = (process.env.REDIS_URL || '').startsWith('rediss://') || (process.env.REDIS_URL || '').includes('upstash.io');
    const redis = new Redis(process.env.REDIS_URL, {
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });

    console.log('🔍 Checking for active searchers scanning in Redis...');

    // Wait and poll up to 15 seconds for a real searcher to tap "Start Matchmaking" on phone
    for (let attempt = 0; attempt < 15; attempt++) {
      const searcherKeys = await redis.keys('searcher:state:*');
      if (searcherKeys && searcherKeys.length > 0) {
        for (const key of searcherKeys) {
          const raw = await redis.get(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.currentCoords) {
              activeSearcherId = parsed.searcherId;
              targetLng = parsed.currentCoords.longitude;
              targetLat = parsed.currentCoords.latitude;
              console.log(`\n🎯 Detected active scanning driver [${activeSearcherId}] at (${targetLat.toFixed(4)}, ${targetLng.toFixed(4)})!`);
              break;
            }
          }
        }
        if (activeSearcherId) break;
      }

      if (attempt === 0) {
        console.log('📱 No active searcher scanning yet.');
        console.log('👉 ACTION: Open the app on your phone, select a spot, and tap "Start Matchmaking" now!');
        process.stdout.write('⏳ Waiting for phone connection (up to 15s)');
      } else {
        process.stdout.write('.');
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log(''); // newline

    if (!activeSearcherId) {
      if (process.argv.includes('--dummy')) {
        activeSearcherId = '08221e6d-e5e4-4482-b084-6edc23db5107';
        await redis.geoadd('geo:searchers:active', targetLng, targetLat, activeSearcherId);
        await redis.set(
          `searcher:state:${activeSearcherId}`,
          JSON.stringify({
            searcherId: activeSearcherId,
            currentCoords: { latitude: targetLat, longitude: targetLng },
            destCoords: { latitude: targetLat, longitude: targetLng },
            destName: 'Simulated Target Bay',
            registeredAt: new Date(),
            lastHeartbeat: new Date(),
          }),
          'EX',
          300,
        );
        console.log(`🎯 Headless CI Mode: Auto-registered dummy driver [${activeSearcherId}]`);
      } else {
        console.log('⚠️ No active phone detected within 15s.');
        console.log('📌 Broadcasting departure as an unassisted solo leaver to demonstrate Tier 2:');
        console.log('   Probabilistic Vacancy Database (Parking History) fallback flow as planned in design doc.\n');
      }
    }

    redis.disconnect();
  } catch (e) {
    console.warn('Redis check warning:', e.message);
  }

  // Spawn leaver spot ~150 meters away from searcher
  const leaverCoords = {
    latitude: targetLat + 0.0012,
    longitude: targetLng + 0.0015,
  };

  const isInstant = process.argv.includes('--instant') || process.argv[4] === '0';
  const countdownSeconds = isInstant ? 0 : 240;

  const broadcastPayload = {
    coordinates: leaverCoords,
    countdownSeconds: countdownSeconds,
    landmarkNote: isInstant ? 'Departing immediately, Pillar B2' : 'Near Pillar B2, Ground Floor Level',
  };

  console.log(`📡 Sending Departure Broadcast to: ${BACKEND_URL}/api/v1/leaver/broadcast`);
  console.log(`🚗 Leaving Vehicle: Silver Perodua Myvi (••• 8822)`);
  console.log(`📍 Departure Coordinates: ${leaverCoords.latitude.toFixed(4)}, ${leaverCoords.longitude.toFixed(4)}`);
  console.log(`⏱️ Departure Countdown: ${countdownSeconds === 0 ? '⚡ Instant (Leaving Now - 0s)' : `${Math.round(countdownSeconds / 60)} minutes (${countdownSeconds}s)`}`);
  console.log(`🏛️ Landmark Note: "${broadcastPayload.landmarkNote}"\n`);

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/leaver/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(broadcastPayload),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      console.log('✅ BROADCAST BROADCASTED SUCCESSFULLY!');
      console.log('----------------------------------------------------------------');
      if (activeSearcherId) {
        console.log('🎉 TIER 1: REAL-TIME P2P MATCH OFFER DISPATCHED:');
        console.log(`👉 Paired with active driver [${activeSearcherId}]`);
        console.log('1. Check your phone screen now!');
        console.log('2. The [Spot Match Found! (15s Timer)] modal is currently displayed.');
        console.log('3. Tap "Accept Spot" on your phone to lock and route.');
        console.log('4. Select Waze, Google Maps, or In-App Map for turn-by-turn navigation!');
        console.log('5. Tap "✓ Parked Successfully" when arrived to complete verification.');
      } else {
        console.log('🏛️ TIER 2: PROBABILISTIC VACANCY DB (PARKING HISTORY) ACTIVATED:');
        console.log('1. Because no active searcher was scanning at broadcast time,');
        console.log('   the spot was saved to PostgreSQL `probabilistic_spots` table.');
        console.log('2. Initial turnover confidence: 95% (decays exponentially over 10-15 minutes).');
        console.log('3. When you open the ParkLah app and search in this area, this spot from');
        console.log('   parking history will appear on your map with its live decay probability badge!');
      }
      console.log('----------------------------------------------------------------\n');
    } else {
      console.error('❌ Broadcast failed:', data);
    }
  } catch (err) {
    console.error('❌ Connection error to backend:', err.message);
  }
}

runLeaverSimulation().catch(console.error);
