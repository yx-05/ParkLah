export const Linking = {
  canOpenURL: jest.fn().mockResolvedValue(true),
  openURL: jest.fn().mockResolvedValue(true),
};

export const Platform = {
  OS: 'ios',
  select: (obj: any) => obj.ios || obj.default,
};

export const StyleSheet = {
  create: (styles: any) => styles,
  flatten: (styles: any) => (Array.isArray(styles) ? Object.assign({}, ...styles) : styles || {}),
  hairlineWidth: 1,
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};

export const View = 'View';
export const Text = 'Text';
export const TextInput = 'TextInput';
export const TouchableOpacity = 'TouchableOpacity';
export const FlatList = 'FlatList';
export const Modal = 'Modal';
export const Image = 'Image';

export const Dimensions = {
  get: () => ({ width: 375, height: 812 }),
};

export class AnimatedValue {
  value: number;
  constructor(v: number) {
    this.value = v;
  }
  interpolate() {
    return this;
  }
}

export const Animated = {
  Value: AnimatedValue,
  View: 'Animated.View',
  timing: (_val: any, _config: any) => ({
    start: (cb?: any) => {
      if (cb) cb({ finished: true });
    },
  }),
  sequence: (_anims: any[]) => ({
    start: (cb?: any) => {
      if (cb) cb({ finished: true });
    },
  }),
  parallel: (_anims: any[]) => ({
    start: (cb?: any) => {
      if (cb) cb({ finished: true });
    },
  }),
  loop: (_anim: any) => ({
    start: () => {},
    stop: () => {},
  }),
  delay: (_ms: number) => ({
    start: (cb?: any) => {
      if (cb) cb({ finished: true });
    },
  }),
};
