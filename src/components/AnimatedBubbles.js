import React, { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, View, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function AnimatedBubbles() {
  const bubbles = [
    { x: width * 0.2, size: 80, delay: 0, duration: 8000, opacity: 0.15 },
    { x: width * 0.5, size: 100, delay: 2000, duration: 10000, opacity: 0.1 },
    { x: width * 0.8, size: 70, delay: 1000, duration: 12000, opacity: 0.12 },
    { x: width * 0.3, size: 60, delay: 3000, duration: 9000, opacity: 0.08 },
    { x: width * 0.7, size: 90, delay: 500, duration: 11000, opacity: 0.14 },
    { x: width * 0.1, size: 50, delay: 1500, duration: 7000, opacity: 0.1 },
    { x: width * 0.9, size: 65, delay: 2500, duration: 13000, opacity: 0.13 },
    { x: width * 0.4, size: 75, delay: 4000, duration: 9500, opacity: 0.11 },
    { x: width * 0.6, size: 85, delay: 3500, duration: 10500, opacity: 0.09 }
  ];

  const animatedValues = useRef(
    bubbles.map(() => new Animated.Value(height + 50))
  ).current;

  useEffect(() => {
    const animations = bubbles.map((bubble, index) => {
      const animatedValue = animatedValues[index];
      
      const startAnimation = () => {
        animatedValue.setValue(height + 50);
        const animation = Animated.timing(animatedValue, {
          toValue: -100,
          duration: bubble.duration,
          useNativeDriver: true,
        });
        
        animation.start(() => {
          // Reiniciar la animación
          setTimeout(startAnimation, bubble.delay);
        });
        
        return animation;
      };

      // Iniciar después del delay inicial
      setTimeout(startAnimation, bubble.delay);
    });

    return () => {
      // No necesitamos limpiar nada aquí ya que las animaciones se reinician automáticamente
    };
  }, []);

  return (
    <View style={styles.container}>
      {bubbles.map((bubble, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bubbleContainer,
            {
              left: bubble.x - bubble.size / 2,
              transform: [{ translateY: animatedValues[index] }],
            },
          ]}
        >
          <Svg width={bubble.size} height={bubble.size}>
            <Circle
              cx={bubble.size / 2}
              cy={bubble.size / 2}
              r={bubble.size / 2}
              fill={`rgba(255, 255, 255, ${bubble.opacity})`}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
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
  bubbleContainer: {
    position: 'absolute',
    top: 0,
  },
});