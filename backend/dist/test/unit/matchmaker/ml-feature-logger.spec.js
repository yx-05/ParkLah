"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ml_feature_logger_service_1 = require("../../../src/modules/matchmaker/application/services/ml-feature-logger.service");
describe('MlFeatureLoggerService', () => {
    let service;
    let mockRepo;
    beforeEach(() => {
        mockRepo = {
            saveFeatureSnapshot: jest.fn().mockImplementation(async (r) => ({ ...r, id: 'test-feat-id' })),
            updateOutcome: jest.fn().mockResolvedValue(true),
            findRecentFeatures: jest.fn().mockResolvedValue([]),
        };
        service = new ml_feature_logger_service_1.MlFeatureLoggerService(mockRepo);
    });
    it('should save feature snapshot cleanly', async () => {
        const record = {
            matchId: 'match-123',
            searcherId: 'searcher-abc',
            spotLatitude: 3.1177,
            spotLongitude: 101.6774,
            predictedProbability: 0.852,
            dispatchRank: 1,
            modelVersion: 'lightgbm_v1_synthetic',
            featurePayload: { road_distance_meters: 420 },
        };
        await service.logInferenceSnapshot(record);
        expect(mockRepo.saveFeatureSnapshot).toHaveBeenCalledWith(record);
    });
    it('should not throw error if saveFeatureSnapshot fails (fault tolerant)', async () => {
        mockRepo.saveFeatureSnapshot.mockRejectedValueOnce(new Error('DB connection refused'));
        await expect(service.logInferenceSnapshot({
            searcherId: 's-1',
            spotLatitude: 3.1,
            spotLongitude: 101.6,
            predictedProbability: 0.7,
            dispatchRank: 1,
            modelVersion: 'v1',
            featurePayload: {},
        })).resolves.not.toThrow();
    });
    it('should update ground-truth outcome when match concludes', async () => {
        await service.recordOutcome('match-123', 1, 'PARKED_SUCCESS');
        expect(mockRepo.updateOutcome).toHaveBeenCalledWith('match-123', 1, 'PARKED_SUCCESS', expect.any(Date));
    });
});
//# sourceMappingURL=ml-feature-logger.spec.js.map