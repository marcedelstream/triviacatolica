import { CheckCircleIcon, XCircleIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { LIENZO, getCategoryTheme } from '@/constants/theme';
import type { Question } from '@/types/trivia';

interface QuestionCardProps {
  question: Question;
  categoryTitle: string;
  selectedIndex: number | null;
  isRevealed: boolean;
  onSelectOption: (index: number) => void;
}

export function QuestionCard({
  question,
  categoryTitle,
  selectedIndex,
  isRevealed,
  onSelectOption,
}: QuestionCardProps) {
  const catTheme = getCategoryTheme(question.topicSlug);

  return (
    <View style={styles.container}>
      <View style={[styles.categoryChip, { backgroundColor: catTheme.soft }]}>
        <CategoryIcon name={catTheme.icon} color={catTheme.color} size={18} />
        <Text style={[styles.categoryLabel, { color: catTheme.color }]}>{categoryTitle}</Text>
      </View>

      <Text style={styles.prompt}>{question.prompt}</Text>

      <View style={styles.optionsList}>
        {question.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrectOption = idx === question.correctIndex;

          // Estados exactos de LINEA_GRAFICA.md sección 2.5 (siempre color + ícono + texto)
          let bg: string = LIENZO.color.bg;
          let borderColor: string = LIENZO.color.line;
          let borderWidth: number = LIENZO.borderWidth.card;
          let textColor: string = LIENZO.color.ink;
          let iconType: 'none' | 'correct' | 'wrong' = 'none';
          let stateLabel = '';

          if (!isRevealed) {
            if (isSelected) {
              bg = LIENZO.color.primarySoft;
              borderColor = LIENZO.color.primary;
              borderWidth = LIENZO.borderWidth.active;
              textColor = LIENZO.color.primaryInk;
              stateLabel = 'Seleccionada';
            }
          } else if (isSelected && isCorrectOption) {
            bg = LIENZO.color.successSoft;
            borderColor = LIENZO.color.success;
            borderWidth = LIENZO.borderWidth.active;
            textColor = LIENZO.color.successInk;
            iconType = 'correct';
            stateLabel = 'Correcta';
          } else if (isSelected && !isCorrectOption) {
            bg = LIENZO.color.dangerSoft;
            borderColor = LIENZO.color.danger;
            borderWidth = LIENZO.borderWidth.active;
            textColor = LIENZO.color.danger;
            iconType = 'wrong';
            stateLabel = 'Incorrecta';
          } else if (!isSelected && isCorrectOption) {
            bg = LIENZO.color.bg;
            borderColor = LIENZO.color.success;
            borderWidth = LIENZO.borderWidth.active;
            textColor = LIENZO.color.ink;
            iconType = 'correct';
            stateLabel = 'Respuesta correcta';
          } else {
            bg = LIENZO.color.bg;
            borderColor = LIENZO.color.line;
            borderWidth = LIENZO.borderWidth.card;
            textColor = LIENZO.color.ink2;
          }

          return (
            <Pressable
              key={`${question.id}-opt-${idx}`}
              disabled={isRevealed}
              onPress={() => onSelectOption(idx)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isRevealed }}
              accessibilityLabel={`${option}${stateLabel ? `. ${stateLabel}` : ''}`}
              style={({ pressed }) => [
                styles.optionButton,
                { backgroundColor: bg, borderColor, borderWidth },
                !isRevealed && pressed && styles.optionPressed,
              ]}
            >
              <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>

              {iconType === 'correct' ? (
                <View style={styles.stateIndicator}>
                  <CheckCircleIcon
                    size={24}
                    color={LIENZO.color.success}
                    weight="duotone"
                  />
                </View>
              ) : iconType === 'wrong' ? (
                <View style={styles.stateIndicator}>
                  <XCircleIcon size={24} color={LIENZO.color.danger} weight="duotone" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  categoryChip: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryLabel: {
    ...LIENZO.type.captionBold,
  },
  prompt: {
    fontSize: 21,
    lineHeight: 27,
    fontFamily: LIENZO.font.semiBold,
    color: LIENZO.color.ink,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  optionsList: {
    gap: 10,
    marginTop: 4,
  },
  optionButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: LIENZO.radius.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionPressed: {
    backgroundColor: LIENZO.color.primarySoft,
  },
  optionText: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: LIENZO.font.semiBold,
    flex: 1,
  },
  stateIndicator: {
    flexShrink: 0,
  },
});
