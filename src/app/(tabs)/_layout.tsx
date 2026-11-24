import { Tabs, useRouter } from 'expo-router';
import {
  HouseIcon,
  TrophyIcon,
  UserCircleIcon,
  UsersThreeIcon,
} from 'phosphor-react-native';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LIENZO } from '@/constants/theme';
import { translate } from '@/i18n/translations';
import { useGameStore } from '@/store/useGameStore';

type FloatingTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

function FloatingTabBar({ state, descriptors }: FloatingTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 480;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.dockWrap,
        { bottom: isWideWeb ? 14 : Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.dock}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label =
            typeof options.title === 'string' ? options.title : route.name;

          const onPress = () => {
            if (isFocused) return;
            if (route.name === 'communities') {
              router.navigate('/(tabs)/communities');
            } else if (route.name === 'ranking') {
              router.navigate('/(tabs)/ranking');
            } else if (route.name === 'profile') {
              router.navigate('/(tabs)/profile');
            } else {
              router.navigate('/(tabs)');
            }
          };

          const iconColor = isFocused ? LIENZO.color.primary : LIENZO.color.ink2;
          const iconWeight = isFocused ? 'duotone' : 'regular';

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.dockItem,
                isFocused && styles.dockItemActive,
                pressed && styles.dockItemPressed,
              ]}
            >
              {route.name === 'index' ? (
                <HouseIcon size={22} color={iconColor} weight={iconWeight} />
              ) : route.name === 'communities' ? (
                <UsersThreeIcon size={22} color={iconColor} weight={iconWeight} />
              ) : route.name === 'ranking' ? (
                <TrophyIcon size={22} color={iconColor} weight={iconWeight} />
              ) : (
                <UserCircleIcon size={22} color={iconColor} weight={iconWeight} />
              )}
              {isFocused ? (
                <Text style={styles.dockLabel} numberOfLines={1}>
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 480;
  const lang = useGameStore((s) => s.profile.language);
  const homeLabel = translate(lang, 'tabHome');
  const communitiesLabel = translate(lang, 'tabCommunities');
  const rankingLabel = translate(lang, 'tabRanking');
  const profileLabel = translate(lang, 'tabProfile');

  return (
    <View style={[styles.outer, isWideWeb && styles.outerWide]}>
      <View style={[styles.frame, isWideWeb && styles.frameWide]}>
        <Tabs
          tabBar={(props) => <FloatingTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen name="index" options={{ title: homeLabel }} />
          <Tabs.Screen name="communities" options={{ title: communitiesLabel }} />
          <Tabs.Screen name="ranking" options={{ title: rankingLabel }} />
          <Tabs.Screen name="profile" options={{ title: profileLabel }} />
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
  dockWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIENZO.color.bg,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: 999,
    padding: 5,
  },
  dockItem: {
    minWidth: 48,
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  dockItemActive: {
    backgroundColor: LIENZO.color.primarySoft,
    paddingHorizontal: 18,
  },
  dockItemPressed: {
    opacity: 0.85,
  },
  dockLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.primaryInk,
  },
});
