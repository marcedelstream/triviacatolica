import { BookBookmarkIcon, BookOpenTextIcon, SparkleIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { LIENZO } from '@/constants/theme';
import { lookupReferenceText, type ReferenceTextEntry } from '@/data/scriptureCicBank';
import type { DailyChallenge } from '@/types/trivia';

interface DailyReadingsViewProps {
  dailyChallenge: DailyChallenge;
}

interface ResolvedReading {
  kind: 'first' | 'gospel';
  label: string;
  ref: string;
  title: string;
  section: string;
  body: string;
}

export function DailyReadingsView({ dailyChallenge }: DailyReadingsViewProps) {
  const [readings, setReadings] = useState<ResolvedReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const result: ResolvedReading[] = [];

      const loadOne = async (
        kind: 'first' | 'gospel',
        label: string,
        ref: string,
        inlineText?: string
      ) => {
        if (!ref.trim()) return;
        let entry: ReferenceTextEntry | null = null;
        if (!inlineText) {
          entry = await lookupReferenceText(ref);
        }
        result.push({
          kind,
          label,
          ref,
          title: entry?.title || ref,
          section:
            entry?.bookOrSection ||
            (kind === 'gospel' ? 'Evangelio del día' : 'Primera lectura del día'),
          body:
            inlineText?.trim() ||
            entry?.body ||
            `Podés leer este pasaje completo (${ref}) en tu Biblia antes de responder las preguntas del desafío de hoy.`,
        });
      };

      await Promise.all([
        loadOne('first', 'Primera Lectura', dailyChallenge.firstReadingRef, dailyChallenge.firstReadingText),
        loadOne('gospel', 'Evangelio del día', dailyChallenge.gospelRef, dailyChallenge.gospelText),
      ]);

      // Mantener siempre el orden litúrgico: Primera Lectura -> Evangelio
      result.sort((a, b) => (a.kind === 'first' ? -1 : b.kind === 'first' ? 1 : 0));

      if (active) {
        setReadings(result);
        setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [
    dailyChallenge.firstReadingRef,
    dailyChallenge.firstReadingText,
    dailyChallenge.gospelRef,
    dailyChallenge.gospelText,
  ]);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerBlock}>
        <View style={styles.liturgicalPill}>
          <SparkleIcon size={15} color={LIENZO.color.primaryInk} weight="duotone" />
          <Text style={styles.liturgicalText} numberOfLines={2}>
            {dailyChallenge.liturgicalDay || 'Lecturas de hoy'}
          </Text>
        </View>
        <Text style={styles.title}>{dailyChallenge.title}</Text>
        {dailyChallenge.subtitle ? (
          <Text style={styles.subtitle}>{dailyChallenge.subtitle}</Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={LIENZO.color.primary} />
          <Text style={styles.loadingText}>Cargando las lecturas de hoy…</Text>
        </View>
      ) : (
        <View style={styles.cards}>
          {readings.map((item) => {
            const isGospel = item.kind === 'gospel';
            return (
              <View key={`${item.kind}-${item.ref}`} style={styles.card}>
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: isGospel
                          ? LIENZO.color.goldSoft
                          : LIENZO.color.primarySoft,
                      },
                    ]}
                  >
                    {isGospel ? (
                      <BookOpenTextIcon size={15} color={LIENZO.color.goldInk} weight="duotone" />
                    ) : (
                      <BookBookmarkIcon size={15} color={LIENZO.color.primaryInk} weight="duotone" />
                    )}
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isGospel ? LIENZO.color.goldInk : LIENZO.color.primaryInk },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <Text style={styles.refCode}>{item.ref}</Text>
                </View>

                <Text style={styles.readingTitle}>{item.title}</Text>
                <Text style={styles.readingSection}>{item.section}</Text>
                <Text style={styles.readingBody}>{item.body}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: LIENZO.space.lg,
  },
  headerBlock: {
    gap: 6,
  },
  liturgicalPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: LIENZO.color.primarySoft,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  liturgicalText: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.primaryInk,
  },
  title: {
    ...LIENZO.type.display,
    color: LIENZO.color.ink,
    marginTop: 2,
  },
  subtitle: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    ...LIENZO.type.small,
    color: LIENZO.color.ink2,
  },
  cards: {
    gap: LIENZO.space.md,
  },
  card: {
    borderWidth: LIENZO.borderWidth.card,
    borderColor: LIENZO.color.line,
    borderRadius: LIENZO.radius.card,
    backgroundColor: LIENZO.color.bg,
    padding: LIENZO.space.lg,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: LIENZO.radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    ...LIENZO.type.captionBold,
  },
  refCode: {
    ...LIENZO.type.captionBold,
    color: LIENZO.color.ink2,
  },
  readingTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
    marginTop: 4,
  },
  readingSection: {
    ...LIENZO.type.caption,
    color: LIENZO.color.ink2,
  },
  readingBody: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: LIENZO.font.regular,
    color: LIENZO.color.ink,
    marginTop: 4,
  },
});
