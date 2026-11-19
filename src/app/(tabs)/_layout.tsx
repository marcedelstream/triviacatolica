import { Tabs } from 'expo-router';
import { HouseIcon, TrophyIcon, UserCircleIcon } from 'phosphor-react-native';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LIENZO } from '@/constants/theme';

function TabLabel({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  return (
    <Text style={[focused ? LIENZO.type.navActive : LIENZO.type.nav, { color }]}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 480;

  return (
    <View style={[styles.outer, isWideWeb && styles.outerWide]}>
      <View style={[styles.frame, isWideWeb && styles.frameWide]}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: LIENZO.color.primary,
            tabBarInactiveTintColor: LIENZO.color.ink2,
            tabBarStyle: {
              backgroundColor: LIENZO.color.bg,
              borderTopWidth: LIENZO.borderWidth.hairline,
              borderTopColor: LIENZO.color.line,
              elevation: 0,
              shadowOpacity: 0,
              height: 66 + (isWideWeb ? 0 : Math.max(insets.bottom, 6)),
              paddingTop: 8,
              paddingBottom: isWideWeb ? 10 : Math.max(insets.bottom, 10),
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Inicio',
              tabBarIcon: ({ focused }) => (
                <HouseIcon
                  size={26}
                  color={focused ? LIENZO.color.primary : LIENZO.color.ink2}
                  weight={focused ? 'duotone' : 'regular'}
                />
              ),
              tabBarLabel: ({ focused }) => (
                <TabLabel
                  label="Inicio"
                  focused={focused}
                  color={focused ? LIENZO.color.primary : LIENZO.color.ink2}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="ranking"
            options={{
              title: 'Ranking',
              tabBarIcon: ({ focused }) => (
                <TrophyIcon
                  size={26}
                  color={focused ? LIENZO.color.primary : LIENZO.color.ink2}
                  weight={focused ? 'duotone' : 'regular'}
                />
              ),
              tabBarLabel: ({ focused }) => (
                <TabLabel
                  label="Ranking"
                  focused={focused}
                  color={focused ? LIENZO.color.primary : LIENZO.color.ink2}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ focused }) => (
                <UserCircleIcon
                  size={26}
                  color={focused ? LIENZO.color.primary : LIENZO.color.ink2}
                  weight={focused ? 'duotone' : 'regular'}
                />
              ),
              tabBarLabel: ({ focused }) => (
                <TabLabel
                  label="Perfil"
                  focused={focused}
                  color={focused ? LIENZO.color.primary : LIENZO.color.ink2}
                />
              ),
            }}
          />
        </Tabs>
      </View>
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
  frame: {
    flex: 1,
    width: '100%',
    backgroundColor: LIENZO.color.bg,
  },
  frameWide: {
    maxWidth: LIENZO.maxPhoneWidth,
    borderWidth: LIENZO.borderWidth.hairline,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.frame,
    overflow: 'hidden',
  },
});
