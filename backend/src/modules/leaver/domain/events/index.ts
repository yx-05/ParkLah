export class LeaverBroadcastedEvent {
  constructor(
    public readonly leaverId: string,
    public readonly coordinates: { latitude: number; longitude: number },
    public readonly countdownSeconds: number,
    public readonly vehicleSummary?: { makeModel: string; color: string; plateSuffix: string },
    public readonly landmarkNote?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class LeaverCancelledEvent {
  constructor(
    public readonly leaverId: string,
    public readonly reason: string,
    public readonly remainingSeconds: number,
    public readonly isMatched: boolean,
    public readonly timestamp: Date = new Date(),
  ) {}
}
