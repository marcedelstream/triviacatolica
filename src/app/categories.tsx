import { useRouter } from 'expo-router';
import { ArrowLeftIcon } from 'phosphor-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CategoryCard } from '@/components/CategoryCard';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LIENZO } from '@/constants/theme';
import { useGameStore } from '@/store/useGameStore';

export default function CategoriesScreen() {
  const router = useRouter();
  const topics = useGameStore((s) => s.topics);
  const questions = useGameStore((s) => s.questions);
  const answeredCorrectByTopic = useGameStore((s) => s.answeredCorrectByTopic);

  return (
    <ScreenFrame edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ArrowLeftIcon size={24} color={LIENZO.color.ink} weight="regular" />
        </Pressable>
        <Text style={styles.topTitle}>Todas las categorías</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Elegí una categoría para recorrer sus niveles paso a paso y aprender con citas de la Biblia
          y el Catecismo.
        </Text>

        {topics.map((topic) => {
          const totalInTopic = questions.filter(
            (q) => q.topicId === topic.id || q.topicSlug === topic.slug
          ).length;
          const completedInTopic = (answeredCorrectByTopic[topic.slug] ?? []).length;

          return (
            <CategoryCard
              key={topic.id}
              topic={topic}
              completedCount={completedInTopic}
              totalCount={totalInTopic}
              showDescription
              onPress={() =>
                router.push({
                  pathname: '/category/[slug]',
                  params: { slug: topic.slug },
                })
              }
            />
          );
        })}
      </ScrollView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LIENZO.space.md,
    paddingVertical: LIENZO.space.sm,
    borderBottomWidth: LIENZO.borderWidth.hairline,
    borderBottomColor: LIENZO.color.line,
  },
  backBtn: {
    width: LIENZO.touchMin,
    height: LIENZO.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LIENZO.radius.icon,
  },
  topTitle: {
    ...LIENZO.type.section,
    color: LIENZO.color.ink,
  },
  topSpacer: {
    width: LIENZO.touchMin,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LIENZO.space.xl,
    paddingTop: LIENZO.space.lg,
    paddingBottom: LIENZO.space.xxxl,
  },
  intro: {
    ...LIENZO.type.body,
    color: LIENZO.color.ink2,
    marginBottom: LIENZO.space.md,
  },
});
