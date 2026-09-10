module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react' } }],
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__mocks__/react-native.ts',
    '^react-native-svg$': '<rootDir>/src/__mocks__/react-native-svg.ts',
    '^react-native-webview$': '<rootDir>/src/__mocks__/react-native-webview.ts',
    '^expo-location$': '<rootDir>/src/__mocks__/expo-location.ts',
    '^@react-native-async-storage/async-storage$': '@react-native-async-storage/async-storage/jest/async-storage-mock',
    '\\.(png|jpg|jpeg|gif|webp)$': '<rootDir>/src/__mocks__/fileMock.ts',
  },
  testMatch: ['**/__tests__/**/*.spec.(ts|tsx)'],
};
