import { VehicleService } from '../../../src/modules/auth/application/services/vehicle.service';
import { InMemoryVehicleRepository } from '../../../src/modules/auth/infrastructure/adapters/in-memory-vehicle.repository';
import { ValidationException } from '../../../src/common/exceptions';

describe('VehicleService (Module 2 Unit Tests)', () => {
  let vehicleService: VehicleService;
  let vehicleRepo: InMemoryVehicleRepository;

  beforeEach(() => {
    vehicleRepo = new InMemoryVehicleRepository();
    vehicleService = new VehicleService(vehicleRepo);
  });

  it('should successfully add a vehicle with valid 4-digit plate suffix', async () => {
    const userId = 'user-123';
    const vehicle = await vehicleService.addVehicle(userId, {
      makeModel: 'Perodua Myvi',
      color: 'White',
      plateSuffix: '8892',
    });

    expect(vehicle.id).toBeDefined();
    expect(vehicle.makeModel).toBe('Perodua Myvi');
    expect(vehicle.color).toBe('White');
    expect(vehicle.plateSuffix).toBe('8892');
    expect(vehicle.isDefault).toBe(true); // First vehicle is auto-default
  });

  it('should reject vehicle creation with invalid plate suffix (non-4 digits)', async () => {
    const userId = 'user-123';

    await expect(
      vehicleService.addVehicle(userId, {
        makeModel: 'Honda City',
        color: 'Black',
        plateSuffix: 'ABC1234', // Full plate instead of 4 digits
      }),
    ).rejects.toThrow(ValidationException);

    await expect(
      vehicleService.addVehicle(userId, {
        makeModel: 'Honda City',
        color: 'Black',
        plateSuffix: '12', // Less than 4 digits
      }),
    ).rejects.toThrow(ValidationException);
  });

  it('should toggle default vehicle correctly when multiple vehicles exist', async () => {
    const userId = 'user-123';

    const v1 = await vehicleService.addVehicle(userId, {
      makeModel: 'Perodua Myvi',
      color: 'White',
      plateSuffix: '1111',
    });

    const v2 = await vehicleService.addVehicle(userId, {
      makeModel: 'Toyota Yaris',
      color: 'Red',
      plateSuffix: '2222',
      isDefault: false,
    });

    expect(v1.isDefault).toBe(true);
    expect(v2.isDefault).toBe(false);

    // Set v2 as default
    const updatedV2 = await vehicleService.setDefaultVehicle(userId, v2.id);
    expect(updatedV2.isDefault).toBe(true);

    const vehicles = await vehicleService.getUserVehicles(userId);
    const updatedV1 = vehicles.find((v) => v.id === v1.id);
    expect(updatedV1?.isDefault).toBe(false);
  });

  it('should delete a vehicle', async () => {
    const userId = 'user-123';
    const v = await vehicleService.addVehicle(userId, {
      makeModel: 'Perodua Myvi',
      color: 'White',
      plateSuffix: '1234',
    });

    const res = await vehicleService.deleteVehicle(userId, v.id);
    expect(res.success).toBe(true);

    const vehicles = await vehicleService.getUserVehicles(userId);
    expect(vehicles.length).toBe(0);
  });
});
