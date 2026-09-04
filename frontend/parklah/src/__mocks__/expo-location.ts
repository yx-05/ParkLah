export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export const getForegroundPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const requestForegroundPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });

export const getCurrentPositionAsync = jest.fn().mockResolvedValue({
  coords: {
    latitude: 3.139,
    longitude: 101.686,
    accuracy: 5,
    altitude: 10,
    heading: 0,
    speed: 0,
  },
  timestamp: Date.now(),
});

export const watchPositionAsync = jest.fn().mockResolvedValue({
  remove: jest.fn(),
});
