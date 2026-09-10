export interface NavigationStep {
  instruction: string;
  streetName: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuverType: string;
  modifier?: string;
  location: { latitude: number; longitude: number };
}

export interface NavigationRoute {
  polyline: { latitude: number; longitude: number }[];
  steps: NavigationStep[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  formattedDistance: string;
  formattedDuration: string;
  formattedEta: string;
}

export class NavigationRoutingService {
  private static instance: NavigationRoutingService;

  public static getInstance(): NavigationRoutingService {
    if (!NavigationRoutingService.instance) {
      NavigationRoutingService.instance = new NavigationRoutingService();
    }
    return NavigationRoutingService.instance;
  }

  /**
   * Calculate straight-line distance in meters between two coordinates (Haversine formula).
   */
  public calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Fetch turn-by-turn driving route from OSRM (Open Source Routing Machine).
   * 100% free, zero credit card, and zero API key needed.
   */
  public async fetchDrivingRoute(
    start: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ): Promise<NavigationRoute> {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Routing request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No driving route found');
      }

      const route = data.routes[0];
      const polyline: { latitude: number; longitude: number }[] = (
        route.geometry?.coordinates || []
      ).map(([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      }));

      const rawSteps = route.legs?.[0]?.steps || [];
      const steps: NavigationStep[] = rawSteps.map((step: any) => {
        const type = step.maneuver?.type || 'turn';
        const modifier = step.maneuver?.modifier;
        const street = step.name || 'Unnamed Road';
        const instruction = this.buildInstruction(type, modifier, street);

        return {
          instruction,
          streetName: street,
          distanceMeters: Math.round(step.distance || 0),
          durationSeconds: Math.round(step.duration || 0),
          maneuverType: type,
          modifier,
          location: {
            latitude: step.maneuver?.location?.[1] ?? start.latitude,
            longitude: step.maneuver?.location?.[0] ?? start.longitude,
          },
        };
      });

      const totalDistanceMeters = Math.round(route.distance || 0);
      // OSRM raw duration assumes unobstructed theoretical speeds (50-60 km/h with 0 traffic signals).
      // Urban city driving model adds realistic street speed (~25 km/h) plus deceleration and parking approach buffer.
      const rawDurationSeconds = Math.round(route.duration || 0);
      const realisticDurationSeconds = Math.max(
        Math.round(rawDurationSeconds * 1.3 + 60),
        Math.round(60 + totalDistanceMeters / 6.5)
      );

      return {
        polyline: polyline.length > 0 ? polyline : [start, destination],
        steps: steps.length > 0 ? steps : [this.buildDirectStep(start, destination)],
        totalDistanceMeters,
        totalDurationSeconds: realisticDurationSeconds,
        formattedDistance: this.formatDistance(totalDistanceMeters),
        formattedDuration: this.formatDuration(realisticDurationSeconds),
        formattedEta: this.formatEta(realisticDurationSeconds),
      };
    } catch (err: any) {
      console.warn('[NavigationRoutingService] OSRM query failed, falling back to direct route:', err.message);
      return this.buildFallbackDirectRoute(start, destination);
    }
  }

  /**
   * Human-readable step instruction builder.
   */
  private buildInstruction(type: string, modifier: string | undefined, street: string): string {
    if (type === 'depart') {
      return `Head ${modifier ? modifier : 'forward'} onto ${street}`;
    }
    if (type === 'arrive') {
      return `Arrive at parking spot on ${modifier ? modifier : 'your side'}`;
    }
    if (type === 'roundabout') {
      return `Enter roundabout and continue onto ${street}`;
    }

    const directionMap: Record<string, string> = {
      'left': 'Turn left',
      'right': 'Turn right',
      'sharp left': 'Sharp left',
      'sharp right': 'Sharp right',
      'slight left': 'Keep left',
      'slight right': 'Keep right',
      'straight': 'Continue straight',
      'uturn': 'Make a U-turn',
    };

    const action = modifier && directionMap[modifier] ? directionMap[modifier] : 'Continue';
    return `${action} onto ${street}`;
  }

  public formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  public formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) {
      return '< 1 min';
    }
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return `${hours} hr ${remainingMins} min`;
    }
    return `${minutes} min`;
  }

  public formatEta(secondsFromNow: number): string {
    const arrivalDate = new Date(Date.now() + secondsFromNow * 1000);
    let hours = arrivalDate.getHours();
    const minutes = arrivalDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should be 12
    const minuteStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minuteStr} ${ampm}`;
  }

  private buildDirectStep(
    start: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ): NavigationStep {
    const straightDist = this.calculateDistance(start.latitude, start.longitude, destination.latitude, destination.longitude);
    const roadDist = Math.round(straightDist * 1.35);
    const duration = Math.max(75, Math.round(60 + roadDist / 6.5));
    return {
      instruction: 'Drive towards reserved parking bay',
      streetName: 'Parking Access Road',
      distanceMeters: roadDist,
      durationSeconds: duration,
      maneuverType: 'straight',
      location: destination,
    };
  }

  private buildFallbackDirectRoute(
    start: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ): NavigationRoute {
    const straightDist = this.calculateDistance(start.latitude, start.longitude, destination.latitude, destination.longitude);
    const roadDist = Math.round(straightDist * 1.35);
    const duration = Math.max(75, Math.round(60 + roadDist / 6.5));

    return {
      polyline: [start, destination],
      steps: [this.buildDirectStep(start, destination)],
      totalDistanceMeters: roadDist,
      totalDurationSeconds: duration,
      formattedDistance: this.formatDistance(roadDist),
      formattedDuration: this.formatDuration(duration),
      formattedEta: this.formatEta(duration),
    };
  }
}
