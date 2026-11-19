import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LIENZO } from '@/constants/theme';

interface ScreenFrameProps {
  children: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  noFrameRadius?: boolean;
}

export function ScreenFrame({
  children,
  edges = ['top'],
  noFrameRadius = false,
}: ScreenFrameProps) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 480;

  return (
    <View style={[styles.outer, isWideWeb && styles.outerWide]}>
      <SafeAreaView
        edges={edges}
        style={[
          styles.inner,
          isWideWeb && styles.innerWide,
          isWideWeb && noFrameRadius && styles.innerNoRadius,
        ]}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: LIENZO.color.bg,
  },
  outerWide: {
    backgroundColor: LIENZO.color.bgApp,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  inner: {
    flex: 1,
    width: '100%',
    backgroundColor: LIENZO.color.bg,
  },
  innerWide: {
    maxWidth: LIENZO.maxPhoneWidth,
    borderWidth: LIENZO.borderWidth.hairline,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.frame,
    overflow: 'hidden',
  },
  innerNoRadius: {
    borderRadius: 0,
    borderWidth: 0,
  },
});
