import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseAnimation } from '@/components/ExerciseAnimation';
import { Chip, Icon, Row, T } from '@/components/ui';
import { DISCIPLINES, EXERCISES } from '@/data/exercises';
import { pick } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { C, DISC_COLOR } from '@/lib/theme';
import type { Discipline } from '@/lib/types';

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function ExercisesScreen() {
  const { t, lang, settings } = useStore();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [disc, setDisc] = useState<Discipline | null>(null);

  const order = useMemo<Discipline[]>(
    () => (settings.disciplines.length ? [...settings.disciplines, ...DISCIPLINES.filter((d) => !settings.disciplines.includes(d))] : [...DISCIPLINES]),
    [settings.disciplines],
  );

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return EXERCISES.filter((e) => !disc || e.discipline === disc)
      .filter((e) => !nq || norm(`${e.name.cs} ${e.name.nb} ${e.name.en} ${pick(e.muscles, lang)}`).includes(nq))
      .sort((a, b) => order.indexOf(a.discipline) - order.indexOf(b.discipline));
  }, [q, disc, lang, order]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 8 }}>
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <T variant="h1">{t('tab.exercises')}</T>
        <View style={st.search}>
          <Icon name="magnify" color={C.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder={t('ex.search')} placeholderTextColor={C.faint} style={st.input} autoCorrect={false} />
          {q ? (
            <Pressable onPress={() => setQ('')} hitSlop={10}>
              <Icon name="close" color={C.muted} size={18} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0, marginVertical: 12 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        <Chip label={t('all')} active={!disc} onPress={() => setDisc(null)} />
        {order.map((d) => (
          <Chip key={d} label={t(`disc.${d}` as 'disc.gym')} active={disc === d} color={DISC_COLOR[d]} onPress={() => setDisc(disc === d ? null : d)} />
        ))}
      </ScrollView>
      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 8 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: e }) => (
          <Pressable style={st.row} onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: e.id } })}>
            <View style={st.thumb}>
              <ExerciseAnimation id={e.id} size={52} playing={false} />
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: '700' }} numberOfLines={1}>
                {pick(e.name, lang)}
              </T>
              <T variant="small" numberOfLines={1}>
                {t(`muscle.${e.muscle}` as 'muscle.legs')} · {t(`equip.${e.equipment}` as 'equip.none')}
              </T>
            </View>
            <Row gap={2}>
              {[1, 2, 3].map((l) => (
                <View key={l} style={[st.lvl, l <= e.level && { backgroundColor: DISC_COLOR[e.discipline] }]} />
              ))}
            </Row>
          </Pressable>
        )}
      />
    </View>
  );
}

const st = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  input: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 12 },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: C.bg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: C.surface },
  lvl: { width: 6, height: 14, borderRadius: 2, backgroundColor: C.surface2 },
});
