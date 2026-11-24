import type { ImageSourcePropType } from 'react-native';

export type AvatarId =
  | 'noe'
  | 'moises'
  | 'rey-david'
  | 'san-jose'
  | 'san-pedro'
  | 'san-pablo'
  | 'arcangel-gabriel'
  | 'virgen-maria';

export interface AvatarOption {
  id: AvatarId;
  name: string;
  subtitle: string;
  requiredXp: number;
  source: ImageSourcePropType;
}

export const DEFAULT_AVATAR_ID: AvatarId = 'noe';

export const AVATAR_CATALOG: AvatarOption[] = [
  {
    id: 'noe',
    name: 'Noé',
    subtitle: 'Disponible desde el inicio',
    requiredXp: 0,
    source: require('../../assets/images/avatars/noe.png'),
  },
  {
    id: 'moises',
    name: 'Moisés',
    subtitle: 'Guía de la Alianza',
    requiredXp: 150,
    source: require('../../assets/images/avatars/moises.png'),
  },
  {
    id: 'rey-david',
    name: 'Rey David',
    subtitle: 'Cantor de los Salmos',
    requiredXp: 350,
    source: require('../../assets/images/avatars/rey-david.png'),
  },
  {
    id: 'san-jose',
    name: 'San José',
    subtitle: 'Custodio de la Sagrada Familia',
    requiredXp: 600,
    source: require('../../assets/images/avatars/san-jose.png'),
  },
  {
    id: 'san-pedro',
    name: 'San Pedro',
    subtitle: 'Roca de la Iglesia',
    requiredXp: 900,
    source: require('../../assets/images/avatars/san-pedro.png'),
  },
  {
    id: 'san-pablo',
    name: 'San Pablo',
    subtitle: 'Apóstol de las naciones',
    requiredXp: 1300,
    source: require('../../assets/images/avatars/san-pablo.png'),
  },
  {
    id: 'arcangel-gabriel',
    name: 'Arcángel Gabriel',
    subtitle: 'Mensajero de Dios',
    requiredXp: 1800,
    source: require('../../assets/images/avatars/arcangel-gabriel.png'),
  },
  {
    id: 'virgen-maria',
    name: 'Virgen María',
    subtitle: 'Madre de la Iglesia',
    requiredXp: 2500,
    source: require('../../assets/images/avatars/virgen-maria.png'),
  },
];

export function getAvatarById(id?: string | null): AvatarOption {
  const found = AVATAR_CATALOG.find((a) => a.id === id);
  return found ?? AVATAR_CATALOG[0];
}

export function isAvatarUnlocked(avatar: AvatarOption, xp: number): boolean {
  return xp >= avatar.requiredXp;
}

export function getNewlyUnlockedAvatars(prevXp: number, nextXp: number): AvatarOption[] {
  return AVATAR_CATALOG.filter(
    (a) => a.requiredXp > 0 && prevXp < a.requiredXp && nextXp >= a.requiredXp
  );
}
