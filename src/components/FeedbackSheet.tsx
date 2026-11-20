import {
  BookBookmarkIcon,
  CheckCircleIcon,
  FlagIcon,
  SparkleIcon,
  XCircleIcon,
} from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ReferenceModal } from '@/components/ReferenceModal';
import { LIENZO } from '@/constants/theme';
import { splitReferenceTokens } from '@/data/scriptureCicBank';
import type { Question } from '@/types/trivia';

interface FeedbackSheetProps {
  question: Question;
  isCorrect: boolean;
  timedOut?: boolean;
  isLastQuestion: boolean;
  praiseLabel?: string;
  xpGain?: number;
  onNext: () => void;
  onReport: (reason: string) => Promise<void>;
}

const REPORT_PRESETS = [
  'Posible imprecisión doctrinal',
  'Cita bíblica o del CIC incorrecta',
  'Error de redacción u ortografía',
];

export function FeedbackSheet({
  question,
  isCorrect,
  timedOut = false,
  isLastQuestion,
  praiseLabel = '¡Correcto!',
  xpGain = 15,
  onNext,
  onReport,
}: FeedbackSheetProps) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeReference, setActiveReference] = useState<string | null>(null);

  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 210,
      useNativeDriver: true,
    }).start();
  }, [entrance, question.id]);

  const correctAnswer = question.options[question.correctIndex];
  const refTokens = splitReferenceTokens(question.sourceRef);

  const handleSubmitReport = async (reasonText: string) => {
    const clean = reasonText.trim();
    if (!clean || isSending) return;
    setIsSending(true);
    await onReport(clean);
    setIsSending(false);
    setReportSent(true);
    setShowReportForm(false);
    setReportReason('');
  };

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          backgroundColor: isCorrect ? LIENZO.color.successSoft : LIENZO.color.dangerSoft,
          borderColor: isCorrect ? LIENZO.color.success : LIENZO.color.danger,
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.statusRow}>
        {isCorrect ? (
          <CheckCircleIcon size={24} color={LIENZO.color.success} weight="duotone" />
        ) : (
          <XCircleIcon size={24} color={LIENZO.color.danger} weight="duotone" />
        )}
        <Text
          style={[
            styles.statusText,
            { color: isCorrect ? LIENZO.color.successInk : LIENZO.color.danger },
          ]}
        >
          {isCorrect
            ? praiseLabel
            : timedOut
              ? `Se acabó el tiempo. Era: ${correctAnswer}`
              : `La respuesta era: ${correctAnswer}`}
        </Text>

        {isCorrect ? (
          <View style={styles.xpPill}>
            <SparkleIcon size={14} color={LIENZO.color.successInk} weight="duotone" />
            <Text style={styles.xpPillText}>+{xpGain} XP</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.explanation}>{question.explanation}</Text>

      {/* Citas tocables (Biblia / CIC) que abren popup con el texto completo + Reportar */}
      <View style={styles.metaFooterRow}>
        <View style={styles.refChipsWrap}>
          {refTokens.map((token) => (
            <Pressable
              key={token}
              onPress={() => setActiveReference(token)}
              accessibilityRole="button"
              accessibilityLabel={`Leer texto completo de ${token}`}
              style={({ pressed }) => [styles.refChip, pressed && styles.pressed]}
            >
              <BookBookmarkIcon size={15} color={LIENZO.color.primaryInk} weight="duotone" />
              <Text style={styles.refChipText}>{token}</Text>
            </Pressable>
          ))}
        </View>

        {!reportSent && !showReportForm ? (
          <Pressable
            onPress={() => setShowReportForm(true)}
            hitSlop={8}
            style={styles.reportTrigger}
            accessibilityRole="button"
            accessibilityLabel="Reportar posible error en esta pregunta"
          >
            <FlagIcon size={15} color={LIENZO.color.ink2} weight="regular" />
            <Text style={styles.reportTriggerText}>Reportar</Text>
          </Pressable>
        ) : null}
      </View>

      {reportSent ? (
        <Text style={styles.reportThanks}>
          Gracias por avisarnos. Revisaremos esta pregunta con el Catecismo y la Escritura.
        </Text>
      ) : showReportForm ? (
        <View style={styles.reportBox}>
          <Text style={styles.reportHeading}>¿Qué deberíamos revisar?</Text>
          <View style={styles.presetsWrap}>
            {REPORT_PRESETS.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => void handleSubmitReport(preset)}
                style={styles.presetChip}
                accessibilityRole="button"
              >
                <Text style={styles.presetText}>{preset}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={reportReason}
            onChangeText={setReportReason}
            placeholder="O escribí un breve detalle..."
            placeholderTextColor={LIENZO.color.ink2}
            style={styles.reportInput}
          />
          <View style={styles.reportActions}>
            <Pressable
              onPress={() => setShowReportForm(false)}
              style={styles.reportCancelBtn}
              accessibilityRole="button"
            >
              <Text style={styles.reportCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleSubmitReport(reportReason)}
              disabled={!reportReason.trim() || isSending}
              style={[
                styles.reportSendBtn,
                (!reportReason.trim() || isSending) && styles.disabledBtn,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.reportSendText}>Enviar reporte</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={onNext}
        accessibilityRole="button"
        style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
      >
        <Text style={styles.nextButtonText}>
          {isLastQuestion ? 'Ver resultado' : 'Siguiente'}
        </Text>
      </Pressable>

      <ReferenceModal
        referenceToken={activeReference}
        onClose={() => setActiveReference(null)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginTop: 14,
    borderRadius: LIENZO.radius.card,
    borderWidth: LIENZO.borderWidth.active,
    padding: 16,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusText: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: LIENZO.font.bold,
    flex: 1,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.chip,
    borderWidth: LIENZO.borderWidth.hairline,
    borderColor: LIENZO.color.success,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  xpPillText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.successInk,
  },
  explanation: {
    fontSize: 15.5,
    lineHeight: 22,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink,
  },
  metaFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  refChipsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  refChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: LIENZO.color.bg,
    borderWidth: LIENZO.borderWidth.hairline,
    borderColor: LIENZO.color.primary,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  refChipText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.primaryInk,
  },
  reportTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  reportTriggerText: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: LIENZO.font.semiBold,
    color: LIENZO.color.ink2,
  },
  reportThanks: {
    ...LIENZO.type.caption,
    color: LIENZO.color.successInk,
  },
  reportBox: {
    backgroundColor: LIENZO.color.bg,
    borderRadius: LIENZO.radius.card,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    padding: LIENZO.space.md,
    gap: LIENZO.space.sm,
  },
  reportHeading: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.ink,
  },
  presetsWrap: {
    gap: 6,
  },
  presetChip: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.icon,
    paddingVertical: 10,
    paddingHorizontal: LIENZO.space.md,
    minHeight: LIENZO.touchMin,
    justifyContent: 'center',
  },
  presetText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink,
  },
  reportInput: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: LIENZO.space.md,
    paddingVertical: 10,
    minHeight: LIENZO.touchMin,
    ...LIENZO.type.body,
    color: LIENZO.color.ink,
    backgroundColor: LIENZO.color.bg,
  },
  reportActions: {
    flexDirection: 'row',
    gap: LIENZO.space.sm,
    justifyContent: 'flex-end',
  },
  reportCancelBtn: {
    minHeight: LIENZO.touchMin,
    paddingHorizontal: LIENZO.space.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportCancelText: {
    ...LIENZO.type.smallSemiBold,
    color: LIENZO.color.ink2,
  },
  reportSendBtn: {
    minHeight: LIENZO.touchMin,
    paddingHorizontal: LIENZO.space.lg,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportSendText: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.onPrimary,
  },
  disabledBtn: {
    opacity: 0.45,
  },
  nextButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: LIENZO.space.lg,
    marginTop: 2,
  },
  nextButtonText: {
    ...LIENZO.type.button,
    color: LIENZO.color.onPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
});
