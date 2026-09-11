export type HubArchetype = 'RETAIL_MALL' | 'NIGHTLIFE_ENTERTAINMENT' | 'CAMPUS_COMMUTER' | 'RESIDENTIAL_LOCAL';
export interface DemandForecastResult {
    hubName: string;
    archetype: HubArchetype;
    occupancyRate: number;
    demandLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    turnoverMinutes: number;
    isPeakHour: boolean;
    recommendedMode: 'CRUISING_PERMITTED' | 'P2P_HANDOFF';
    estimatedCruisingMinutesSaved: number;
    peakWindowLabel?: string;
}
export interface CommercialHubConfig {
    hub_index: number;
    name: string;
    archetype: HubArchetype;
    latitude: number;
    longitude: number;
    capacity: number;
    base_occupancy: number;
    traffic_multiplier: number;
}
export declare class DemandForecastService {
    private readonly logger;
    private metadata;
    private hubs;
    constructor();
    private loadMetadata;
    getForecast(query: {
        latitude?: number;
        longitude?: number;
        destinationName?: string;
        simulatedDate?: Date;
        simulatedHour?: number;
        simulatedDayOfWeek?: number;
    }): DemandForecastResult;
    private resolveNearestHub;
    private calculateHeuristicForecast;
    private getPeakWindowLabel;
    private haversineMeters;
}
