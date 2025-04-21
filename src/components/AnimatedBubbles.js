import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function AnimatedBubbles() {
  const bubbles = [
    { y: useSharedValue(height + 50), x: width * 0.2, size: 80, delay: 0, duration: 8000, opacity: 0.15 },
    { y: useSharedValue(height + 100), x: width * 0.5, size: 100, delay: 2000, duration: 10000, opacity: 0.1 },
    { y: useSharedValue(height + 150), x: width * 0.8, size: 70, delay: 1000, duration: 12000, opacity: 0.12 },
    { y: useSharedValue(height + 80), x: width * 0.3, size: 60, delay: 3000, duration: 9000, opacity: 0.08 },
    { y: useSharedValue(height + 120), x: width * 0.7, size: 90, delay: 500, duration: 11000, opacity: 0.14 },
    { y: useSharedValue(height + 200), x: width * 0.1, size: 50, delay: 1500, duration: 7000, opacity: 0.1 },
    { y: useSharedValue(height + 180), x: width * 0.9, size: 65, delay: 2500, duration: 13000, opacity: 0.13 },
    { y: useSharedValue(height + 90), x: width * 0.4, size: 75, delay: 4000, duration: 9500, opacity: 0.11 },
    { y: useSharedValue(height + 140), x: width * 0.6, size: 85, delay: 3500, duration: 10500, opacity: 0.09 }
  ];

  useEffect(() => {
    bubbles.forEach(bubble => {
      bubble.y.value = withRepeat(
        withDelay(bubble.delay, withTiming(-100, { duration: bubble.duration })),
        -1,
        false
      );
    });
  }, []);

  const bubbleStyle = (translateY, x) =>
    useAnimatedStyle(() => ({
      position: 'absolute',
      top: 0,
      left: x,
      transform: [{ translateY: translateY.value }],
    }));

  return (
    <View style={styles.container}>
      {bubbles.map((bubble, index) => (
        <Animated.View key={index} style={bubbleStyle(bubble.y, bubble.x)}>
          <Svg height={bubble.size} width={bubble.size}>
            <Circle 
              cx={bubble.size/2} 
              cy={bubble.size/2} 
              r={bubble.size/2 - 10} 
              fill={`rgba(255, 255, 255, ${bubble.opacity})`} 
            />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
