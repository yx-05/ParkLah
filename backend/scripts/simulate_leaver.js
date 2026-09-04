const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

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

  try {
    const Redis = require('ioredis');
    const redis = new Redis(process.env.REDIS_URL);
    const searchers = await redis.zrange('geo:searchers:active', 0, -1);
    let activeSearcherId = null;
    if (searchers && searchers.length > 0) {
      activeSearcherId = searchers[0];
      const pos = await redis.geopos('geo:searchers:active', activeSearcherId);
      if (pos && pos[0]) {
        targetLng = parseFloat(pos[0][0]);
        targetLat = parseFloat(pos[0][1]);
        console.log(`🎯 Detected active searcher [${activeSearcherId}] at (${targetLat.toFixed(4)}, ${targetLng.toFixed(4)})`);
      }
    } else {
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
      console.log(`🎯 Auto-registered driver [${activeSearcherId}] into Redis GEO candidate pool`);
    }
    redis.disconnect();
  } catch (e) {}

  // Spawn leaver spot ~150 meters away from searcher
  const leaverCoords = {
    latitude: targetLat + 0.0012,
    longitude: targetLng + 0.0015,
  };

  const broadcastPayload = {
    coordinates: leaverCoords,
    countdownSeconds: 240, // 4 minutes
    landmarkNote: 'Near Pillar B2, Ground Floor Level',
  };

  console.log(`📡 Sending Departure Broadcast to: ${BACKEND_URL}/api/v1/leaver/broadcast`);
  console.log(`🚗 Leaving Vehicle: Silver Perodua Myvi (••• 8822)`);
  console.log(`📍 Departure Coordinates: ${leaverCoords.latitude.toFixed(4)}, ${leaverCoords.longitude.toFixed(4)}`);
  console.log(`⏱️ Departure Countdown: 4 minutes (240s)`);
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
      console.log('🎉 WHAT HAPPENS NEXT ON YOUR PHONE:');
      console.log('1. On your phone, tap "Start Matchmaking" on the Search tab.');
      console.log('2. The Matchmaker pairs you with this spot and pops up:');
      console.log('   👉 [Spot Match Found! (15s Timer)] modal on your phone screen.');
      console.log('3. Tap "Accept Spot" on your phone.');
      console.log('4. Select Waze, Google Maps, or In-App Map for turn-by-turn navigation!');
      console.log('5. Tap "✓ Parked Successfully" when arrived to complete verification.');
      console.log('----------------------------------------------------------------\n');
    } else {
      console.error('❌ Broadcast failed:', data);
    }
  } catch (err) {
    console.error('❌ Connection error to backend:', err.message);
  }
}

runLeaverSimulation().catch(console.error);
