import {
  BookOpenTextIcon,
  ChurchIcon,
  DropIcon,
  FlowerIcon,
  HandHeartIcon,
  HandsPrayingIcon,
  MegaphoneIcon,
  ScrollIcon,
} from 'phosphor-react-native';

import type { BannerIconName, CategoryIconName } from '@/constants/theme';

interface CategoryIconProps {
  name: CategoryIconName | BannerIconName;
  color: string;
  size?: number;
}

export function CategoryIcon({ name, color, size = 26 }: CategoryIconProps) {
  switch (name) {
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
    case 'hand-heart':
      return <HandHeartIcon size={size} color={color} weight="duotone" />;
    case 'megaphone':
      return <MegaphoneIcon size={size} color={color} weight="duotone" />;
    default:
      return <BookOpenTextIcon size={size} color={color} weight="duotone" />;
  }
}
