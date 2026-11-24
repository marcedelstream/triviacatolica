import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { LIENZO } from '@/constants/theme';
import { getAvatarById, type AvatarId } from '@/data/avatars';
import { getCountryFlag } from '@/data/countries';

interface AvatarBadgeProps {
  avatarId?: AvatarId | string | null;
  country?: string | null;
  size?: number;
  highlight?: boolean;
}

export function AvatarBadge({
  avatarId,
  country,
  size = 44,
  highlight = false,
}: AvatarBadgeProps) {
  const avatar = getAvatarById(avatarId);
  const flag = getCountryFlag(country);
  const flagSize = Math.max(18, Math.round(size * 0.42));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: highlight ? LIENZO.color.primary : LIENZO.color.line,
          },
        ]}
      >
        <Image
          source={avatar.source}
          style={{ width: size - 3, height: size - 3, borderRadius: (size - 3) / 2 }}
          contentFit="cover"
        />
      </View>

      {flag ? (
        <View
          style={[
            styles.flagBadge,
            {
              minWidth: flagSize,
              height: flagSize,
              borderRadius: flagSize / 2,
            },
          ]}
        >
          <Text style={{ fontSize: Math.max(11, Math.round(flagSize * 0.62)) }}>{flag}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    flexShrink: 0,
  },
  circle: {
    borderWidth: LIENZO.borderWidth.card,
    backgroundColor: LIENZO.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  flagBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    backgroundColor: LIENZO.color.bg,
    borderWidth: 1,
    borderColor: LIENZO.color.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
});
