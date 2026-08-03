import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions } from 'react-native';
import Svg, { Rect, Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function GlobalLoader({ onAnimationComplete }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const stemProgress = useRef(new Animated.Value(0)).current;
  const dotProgress = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence logo formation animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(stemProgress, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(dotProgress, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Fade out loader after logo fully forms
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          if (onAnimationComplete) onAnimationComplete();
        });
      }, 800);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        {/* Glow effect behind the logo */}
        <View style={styles.glowCircle} />

        {/* The Animated Logo Container */}
        <Animated.View style={[
          styles.logoBox, 
          { transform: [{ scale: logoScale }], opacity: logoOpacity }
        ]}>
          <Svg width="72" height="72" viewBox="0 0 32 32" fill="none">
            <Defs>
              <LinearGradient id="loaderIGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#60a5fa" />
                <Stop offset="100%" stopColor="#3b82f6" />
              </LinearGradient>
              <RadialGradient id="loaderDotGrad" cx="40%" cy="35%" r="60%">
                <Stop offset="0%" stopColor="#93c5fd" />
                <Stop offset="100%" stopColor="#3b82f6" />
              </RadialGradient>
            </Defs>

            {/* Stem of the 'i' */}
            <Rect
              x="13" y="13" width="6" height="14" rx="3"
              fill="url(#loaderIGrad)"
            />

            {/* Dot of the 'i' */}
            <Circle
              cx="16" cy="7" r="3.5"
              fill="url(#loaderDotGrad)"
            />
          </Svg>
        </Animated.View>

        {/* Loading text */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={styles.brandTitle}>INVESTRADERS</Text>
          <Text style={styles.brandSubtitle}>Trading Circles & Community</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: '#0b1329',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  textContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#93c5fd',
    marginTop: 6,
    letterSpacing: 1,
  },
});
