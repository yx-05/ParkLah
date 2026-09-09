import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface BrandLoadingScreenProps {
  onFinish?: () => void;
  duration?: number; // Total display duration in ms (default 2200ms)
}

export const BrandLoadingScreen: React.FC<BrandLoadingScreenProps> = ({
  onFinish,
  duration = 2200,
}) => {
  // 1. Overall screen fade-out animation
  const screenFadeAnim = useRef(new Animated.Value(1)).current;

  // 2. Logo floating/breathing animation
  const floatAnim = useRef(new Animated.Value(0)).current;

  // 3. Dot wave animation values
  const dot1Scale = useRef(new Animated.Value(0.85)).current;
  const dot1Opacity = useRef(new Animated.Value(0.35)).current;
  const dot2Scale = useRef(new Animated.Value(0.85)).current;
  const dot2Opacity = useRef(new Animated.Value(0.35)).current;
  const dot3Scale = useRef(new Animated.Value(0.85)).current;
  const dot3Opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    // A. Logo floating loop (3s cycle)
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();

    // B. Dot wave animations
    const createDotAnimation = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.25,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1.0,
              duration: 350,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 0.85,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.35,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(Math.max(0, 550 - delay)),
        ]),
      );
    };

    const dot1Anim = createDotAnimation(dot1Scale, dot1Opacity, 0);
    const dot2Anim = createDotAnimation(dot2Scale, dot2Opacity, 160);
    const dot3Anim = createDotAnimation(dot3Scale, dot3Opacity, 320);

    dot1Anim.start();
    dot2Anim.start();
    dot3Anim.start();

    // C. Transition out after duration
    const timer = setTimeout(() => {
      Animated.timing(screenFadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) {
          onFinish();
        }
      });
    }, duration);

    return () => {
      clearTimeout(timer);
      floatLoop.stop();
      dot1Anim.stop();
      dot2Anim.stop();
      dot3Anim.stop();
    };
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const logoScale = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenFadeAnim }]}>
      {/* Radial soft glow backdrop */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <RadialGradient
            id="radialGlow"
            cx="50%"
            cy="46%"
            rx="60%"
            ry="45%"
            fx="50%"
            fy="46%"
          >
            <Stop offset="0%" stopColor="#83c5be" stopOpacity="0.28" />
            <Stop offset="45%" stopColor="#83c5be" stopOpacity="0.10" />
            <Stop offset="75%" stopColor="#f7fafb" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#radialGlow)" />
      </Svg>

      {/* Center Brand Identity Section */}
      <View style={styles.brandCenter}>
        {/* Animated Floating Logo */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ translateY }, { scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/parklah-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Wordmark */}
        <Text style={styles.brandTitle}>ParkLah</Text>

        {/* Tagline */}
        <Text style={styles.brandTagline}>WE MAKE PARKING SIMPLE</Text>

        {/* Animated Modern 3-Dot Wave Loader */}
        <View style={styles.dotContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ scale: dot1Scale }],
                opacity: dot1Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ scale: dot2Scale }],
                opacity: dot2Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ scale: dot3Scale }],
                opacity: dot3Opacity,
              },
            ]}
          />
        </View>
      </View>

      {/* Subtle bottom home-bar spacer */}
      <View style={styles.footerSpacer} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#f7fafb',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  brandCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#006d77',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Lexend-Bold' : 'Lexend',
    color: '#006d77',
    letterSpacing: -0.6,
    lineHeight: 46,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Lexend-Medium' : 'Lexend',
    color: 'rgba(0, 109, 119, 0.60)',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: 6,
    textAlign: 'center',
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    height: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#006d77',
  },
  footerSpacer: {
    position: 'absolute',
    bottom: 36,
    height: 6,
    width: 60,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 109, 119, 0.08)',
  },
});
