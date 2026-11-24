import {
  BookBookmarkIcon,
  BookOpenTextIcon,
  CheckCircleIcon,
  FlagIcon,
  SparkleIcon,
  XCircleIcon,
  XIcon,
} from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LIENZO } from '@/constants/theme';
import {
  lookupReferenceText,
  splitReferenceTokens,
  type ReferenceTextEntry,
} from '@/data/scriptureCicBank';
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

function getReferenceBadgeStyle(sourceType: ReferenceTextEntry['sourceType']) {
  if (sourceType === 'biblia') {
    return {
      bg: LIENZO.color.primarySoft,
      color: LIENZO.color.primaryInk,
      label: 'Sagrada Escritura',
      isBible: true,
    };
  }
  if (sourceType === 'cic') {
    return {
      bg: LIENZO.color.goldSoft,
      color: LIENZO.color.goldInk,
      label: 'Catecismo (CIC)',
      isBible: false,
    };
  }
  if (sourceType === 'igmr') {
    return {
      bg: LIENZO.category.liturgia.soft,
      color: LIENZO.category.liturgia.color,
      label: 'Liturgia (IGMR)',
      isBible: false,
    };
  }
  return {
    bg: LIENZO.color.track,
    color: LIENZO.color.ink2,
    label: 'Referencia',
    isBible: false,
  };
}

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
  const insets = useSafeAreaInsets();
  const [showExplanation, setShowExplanation] = useState(false);
  const [loadedQuestionId, setLoadedQuestionId] = useState<string | null>(null);
  const [refEntries, setRefEntries] = useState<ReferenceTextEntry[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSentForId, setReportSentForId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const [entrance] = useState(() => new Animated.Value(0));

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
  const reportSent = reportSentForId === question.id;

  const handleOpenExplanation = () => {
    setShowExplanation(true);
    setShowReportForm(false);

    if (loadedQuestionId === question.id) {
      return;
    }

    if (refTokens.length === 0) {
      setRefEntries([]);
      setLoadedQuestionId(question.id);
      return;
    }

    const targetId = question.id;
    setLoadingRefs(true);
    void Promise.all(refTokens.map((token) => lookupReferenceText(token)))
      .then((results) => {
        setRefEntries(results);
        setLoadedQuestionId(targetId);
      })
      .finally(() => {
        setLoadingRefs(false);
      });
  };

  const handleCloseExplanation = () => {
    setShowExplanation(false);
    setShowReportForm(false);
  };

  const handleNextPress = () => {
    setShowExplanation(false);
    setShowReportForm(false);
    onNext();
  };

  const handleSubmitReport = async (reasonText: string) => {
    const clean = reasonText.trim();
    if (!clean || isSending) return;
    setIsSending(true);
    await onReport(clean);
    setIsSending(false);
    setReportSentForId(question.id);
    setShowReportForm(false);
    setReportReason('');
  };

  return (
    <>
      {/* Tarjeta compacta de resultado: mantiene el quiz limpio y liviano */}
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

        <View style={styles.actionsStack}>
          <Pressable
            onPress={handleNextPress}
            accessibilityRole="button"
            style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
          >
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'Ver resultado' : 'Siguiente'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleOpenExplanation}
            accessibilityRole="button"
            accessibilityLabel="Ver explicación, cita bíblica y Catecismo"
            style={({ pressed }) => [styles.explainButton, pressed && styles.pressed]}
          >
            <BookBookmarkIcon size={18} color={LIENZO.color.primaryInk} weight="duotone" />
            <Text style={styles.explainButtonText}>Ver explicación</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Bottom Sheet deslizable desde abajo con explicación, versículo y CIC completos */}
      <Modal
        visible={showExplanation}
        transparent
        animationType="slide"
        onRequestClose={handleCloseExplanation}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdropHit}
            onPress={handleCloseExplanation}
            accessibilityRole="button"
            accessibilityLabel="Cerrar explicación"
          />

          <View
            style={[
              styles.bottomSheet,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            <View style={styles.handleBar} />

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                {isCorrect ? (
                  <CheckCircleIcon size={22} color={LIENZO.color.success} weight="duotone" />
                ) : (
                  <XCircleIcon size={22} color={LIENZO.color.danger} weight="duotone" />
                )}
                <Text style={styles.modalHeading}>Explicación y fuentes</Text>
              </View>

              <Pressable
                onPress={handleCloseExplanation}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Cerrar explicación"
              >
                <XIcon size={22} color={LIENZO.color.ink} weight="regular" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Respuesta correcta */}
              <View style={styles.answerBox}>
                <Text style={styles.answerBoxLabel}>Respuesta correcta</Text>
                <Text style={styles.answerBoxValue}>{correctAnswer}</Text>
              </View>

              {/* Explicación doctrinal */}
              <View style={styles.explainBlock}>
                <Text style={styles.explanationBody}>{question.explanation}</Text>
              </View>

              {/* Citas completas de Biblia y CIC */}
              {refTokens.length > 0 ? (
                <View style={styles.refsSection}>
                  <Text style={styles.refsSectionTitle}>Lectura y Catecismo</Text>

                  {loadingRefs ? (
                    <View style={styles.loadingWrap}>
                      <ActivityIndicator color={LIENZO.color.primary} />
                    </View>
                  ) : (
                    refEntries.map((entry) => {
                      const badge = getReferenceBadgeStyle(entry.sourceType);
                      return (
                        <View key={entry.refKey} style={styles.refCard}>
                          <View style={[styles.refBadge, { backgroundColor: badge.bg }]}>
                            {badge.isBible ? (
                              <BookOpenTextIcon
                                size={16}
                                color={badge.color}
                                weight="duotone"
                              />
                            ) : (
                              <BookBookmarkIcon
                                size={16}
                                color={badge.color}
                                weight="duotone"
                              />
                            )}
                            <Text style={[styles.refBadgeText, { color: badge.color }]}>
                              {badge.label}
                            </Text>
                          </View>

                          <Text style={styles.refTitle}>{entry.title}</Text>
                          {entry.bookOrSection ? (
                            <Text style={styles.refSection}>{entry.bookOrSection}</Text>
                          ) : null}
                          <Text style={styles.refPassage}>{entry.body}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              ) : null}

              {/* Reporte doctrinal discreto dentro del sheet */}
              <View style={styles.reportArea}>
                {reportSent ? (
                  <Text style={styles.reportThanks}>
                    Gracias por avisarnos. Revisaremos esta pregunta con el Catecismo y la
                    Escritura.
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
                ) : (
                  <Pressable
                    onPress={() => setShowReportForm(true)}
                    hitSlop={8}
                    style={styles.reportTrigger}
                    accessibilityRole="button"
                    accessibilityLabel="Reportar posible error en esta pregunta"
                  >
                    <FlagIcon size={15} color={LIENZO.color.ink2} weight="regular" />
                    <Text style={styles.reportTriggerText}>Reportar un error en esta pregunta</Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>

            {/* Acciones inferiores del bottom sheet */}
            <View style={styles.modalFooter}>
              <Pressable
                onPress={handleCloseExplanation}
                accessibilityRole="button"
                style={({ pressed }) => [styles.modalCloseActionBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalCloseActionText}>Cerrar</Text>
              </Pressable>

              <Pressable
                onPress={handleNextPress}
                accessibilityRole="button"
                style={({ pressed }) => [styles.modalNextActionBtn, pressed && styles.pressed]}
              >
                <Text style={styles.nextButtonText}>
                  {isLastQuestion ? 'Ver resultado' : 'Siguiente'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginTop: 14,
    borderRadius: LIENZO.radius.card,
    borderWidth: LIENZO.borderWidth.active,
    padding: 16,
    gap: 12,
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
  actionsStack: {
    gap: 8,
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
  },
  nextButtonText: {
    ...LIENZO.type.button,
    color: LIENZO.color.onPrimary,
  },
  explainButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.bg,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: LIENZO.space.lg,
  },
  explainButtonText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.primaryInk,
  },
  pressed: {
    opacity: 0.9,
  },

  // Bottom sheet modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 22, 28, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdropHit: {
    flex: 1,
  },
  bottomSheet: {
    width: '100%',
    maxWidth: LIENZO.maxPhoneWidth + 40,
    alignSelf: 'center',
    maxHeight: '84%',
    backgroundColor: LIENZO.color.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: LIENZO.borderWidth.card,
    borderLeftWidth: LIENZO.borderWidth.card,
    borderRightWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    paddingTop: 10,
    paddingHorizontal: LIENZO.space.xl,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: LIENZO.color.line,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: LIENZO.space.sm,
    paddingBottom: 10,
    borderBottomWidth: LIENZO.borderWidth.hairline,
    borderBottomColor: LIENZO.color.line,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalHeading: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
  },
  closeBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LIENZO.radius.icon,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingTop: 14,
    paddingBottom: 16,
    gap: 14,
  },
  answerBox: {
    backgroundColor: LIENZO.color.primarySoft,
    borderRadius: LIENZO.radius.icon,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 2,
  },
  answerBoxLabel: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
  },
  answerBoxValue: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.ink,
  },
  explainBlock: {
    gap: 6,
  },
  explanationBody: {
    fontSize: 16.5,
    lineHeight: 24,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink,
  },
  refsSection: {
    gap: 10,
  },
  refsSectionTitle: {
    ...LIENZO.type.smallBold,
    color: LIENZO.color.ink2,
  },
  loadingWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  refCard: {
    backgroundColor: LIENZO.color.bg,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    padding: 14,
    gap: 6,
  },
  refBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  refBadgeText: {
    ...LIENZO.type.captionBold,
  },
  refTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: LIENZO.font.bold,
    color: LIENZO.color.ink,
    marginTop: 2,
  },
  refSection: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink2,
  },
  refPassage: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink,
    marginTop: 2,
  },
  reportArea: {
    paddingTop: 4,
  },
  reportTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  reportTriggerText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: LIENZO.font.semiBold,
    color: LIENZO.color.ink2,
  },
  reportThanks: {
    ...LIENZO.type.caption,
    color: LIENZO.color.successInk,
    textAlign: 'center',
  },
  reportBox: {
    backgroundColor: LIENZO.color.bgApp,
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
    backgroundColor: LIENZO.color.bg,
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
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: LIENZO.borderWidth.hairline,
    borderTopColor: LIENZO.color.line,
  },
  modalCloseActionBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: LIENZO.radius.icon,
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    backgroundColor: LIENZO.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LIENZO.space.md,
  },
  modalCloseActionText: {
    ...LIENZO.type.button,
    color: LIENZO.color.ink,
  },
  modalNextActionBtn: {
    flex: 1.4,
    minHeight: 50,
    borderRadius: LIENZO.radius.icon,
    backgroundColor: LIENZO.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LIENZO.space.lg,
  },
});
