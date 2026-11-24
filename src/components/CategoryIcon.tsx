import {
  BankIcon,
  BookOpenTextIcon,
  ChurchIcon,
  DropIcon,
  FlowerIcon,
  HandHeartIcon,
  HandsPrayingIcon,
  MegaphoneIcon,
  MusicNotesIcon,
  QuotesIcon,
  ScrollIcon,
  SunHorizonIcon,
  UsersThreeIcon,
} from 'phosphor-react-native';

import type { BannerIconName, CategoryIconName } from '@/constants/theme';

interface CategoryIconProps {
  name: CategoryIconName | BannerIconName;
  color: string;
  size?: number;
}

export function CategoryIcon({ name, color, size = 26 }: CategoryIconProps) {
  switch (name) {
    case 'sun-horizon':
      return <SunHorizonIcon size={size} color={color} weight="duotone" />;
    case 'quotes':
      return <QuotesIcon size={size} color={color} weight="duotone" />;
    case 'music-notes':
      return <MusicNotesIcon size={size} color={color} weight="duotone" />;
    case 'scroll':
      return <ScrollIcon size={size} color={color} weight="duotone" />;
    case 'book-open-text':
      return <BookOpenTextIcon size={size} color={color} weight="duotone" />;
    case 'hands-praying':
      return <HandsPrayingIcon size={size} color={color} weight="duotone" />;
    case 'drop':
      return <DropIcon size={size} color={color} weight="duotone" />;
    case 'church':
      return <ChurchIcon size={size} color={color} weight="duotone" />;
    case 'flower':
      return <FlowerIcon size={size} color={color} weight="duotone" />;
    case 'users-three':
      return <UsersThreeIcon size={size} color={color} weight="duotone" />;
    case 'bank':
      return <BankIcon size={size} color={color} weight="duotone" />;
    case 'hand-heart':
      return <HandHeartIcon size={size} color={color} weight="duotone" />;
    case 'megaphone':
      return <MegaphoneIcon size={size} color={color} weight="duotone" />;
    default:
      return <BookOpenTextIcon size={size} color={color} weight="duotone" />;
  }
}
