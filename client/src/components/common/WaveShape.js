/**
 * Wave Shape Component
 * 
 * Custom SVG wave shape matching the EAIN splash screen design
 */

import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const WaveShape = () => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 375 812"
      fill="none"
      style={{ position: 'absolute' }}
    >
      <Defs>
        <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#7DD3C0" stopOpacity="0.8" />
          <Stop offset="50%" stopColor="#A8DCD1" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#F0B8A8" stopOpacity="0.7" />
        </LinearGradient>
      </Defs>
      
      {/* Main flowing S-curve shape */}
      <Path
        d="M 50 150 
           Q 80 100, 120 80
           Q 160 60, 180 100
           Q 200 140, 180 180
           Q 160 220, 120 200
           Q 80 180, 70 220
           Q 60 260, 80 300
           Q 100 340, 140 340
           Q 180 340, 200 380
           Q 220 420, 200 460
           Q 180 500, 140 500
           Q 100 500, 80 540
           Q 60 580, 80 620
           Q 100 660, 140 680
           Q 180 700, 200 650"
        fill="url(#waveGradient)"
        opacity="0.9"
      />
    </Svg>
  );
};

export default WaveShape;
