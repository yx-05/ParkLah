import React from 'react';
import { render, act } from '@testing-library/react-native';
import { BrandLoadingScreen } from '../components/BrandLoadingScreen';

jest.useFakeTimers();

describe('BrandLoadingScreen Component', () => {
  it('should render brand logo, title, and tagline properly', async () => {
    const screen = await render(<BrandLoadingScreen duration={1000} />);

    expect(screen.getByText('ParkLah')).toBeTruthy();
    expect(screen.getByText('WE MAKE PARKING SIMPLE')).toBeTruthy();
  });

  it('should invoke onFinish callback after configured duration', async () => {
    const onFinishMock = jest.fn();
    await render(<BrandLoadingScreen duration={1500} onFinish={onFinishMock} />);

    expect(onFinishMock).not.toHaveBeenCalled();

    // Fast-forward past duration and fade animation
    act(() => {
      jest.advanceTimersByTime(1500);
      jest.advanceTimersByTime(400);
    });

    expect(onFinishMock).toHaveBeenCalledTimes(1);
  });
});
