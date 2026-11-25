import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';

import { LIENZO } from '@/constants/theme';

/**
 * Fondo de cielo con nubes para la pantalla de preguntas.
 * Usa solo colores de la paleta Lienzo (azul suave → blanco) para que
 * tarjetas, opciones y botones mantengan su contraste habitual.
 * Es decorativo: no recibe toques ni se anuncia al lector de pantalla.
 */

// Nube base dibujada en una caja de 120 x 50.
function Cloud({ x, y, scale, opacity }: { x: number; y: number; scale: number; opacity: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <Circle cx={30} cy={32} r={16} fill={LIENZO.color.bg} />
      <Circle cx={55} cy={22} r={20} fill={LIENZO.color.bg} />
      <Circle cx={82} cy={28} r={17} fill={LIENZO.color.bg} />
      <Circle cx={100} cy={36} r={12} fill={LIENZO.color.bg} />
      <Rect x={18} y={32} width={90} height={16} rx={8} fill={LIENZO.color.bg} />
    </G>
  );
}

export const CloudBackdrop = memo(function CloudBackdrop() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Svg width="100%" height="100%" viewBox="0 0 200 400" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="lienzoSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={LIENZO.color.onPrimary2} />
            <Stop offset="0.45" stopColor={LIENZO.color.primarySoft} />
            <Stop offset="1" stopColor={LIENZO.color.bg} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={200} height={400} fill="url(#lienzoSky)" />

        {/* Arriba: detrás de la barra de progreso */}
        <Cloud x={-22} y={34} scale={0.95} opacity={0.95} />
        <Cloud x={118} y={70} scale={0.85} opacity={0.8} />

        {/* Abajo: cerca del botón de confirmar */}
        <Cloud x={120} y={300} scale={0.7} opacity={0.7} />
        <Cloud x={-30} y={340} scale={1.1} opacity={0.85} />
      </Svg>
    </View>
  );
});
