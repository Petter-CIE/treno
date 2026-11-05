import { router } from 'expo-router';
import { View } from 'react-native';
import { pick } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { C } from '@/lib/theme';
import type { Workout } from '@/lib/types';
import { Button, Card, DiscIcon, Icon, Row, T } from './ui';

export function WorkoutCard({ w, done, compact }: { w: Workout; done?: boolean; compact?: boolean }) {
  const { lang, t } = useStore();
  return (
    <Card onPress={() => router.push({ pathname: '/workout/[id]', params: { id: w.id } })} style={done ? { borderColor: C.good } : undefined}>
      <Row gap={12}>
        <DiscIcon d={w.discipline} size={compact ? 36 : 44} />
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="h3" numberOfLines={1}>
            {pick(w.name, lang)}
          </T>
          <T variant="muted" numberOfLines={1}>
            {pick(w.focus, lang)} · {w.minutes} {t('common.min')}
          </T>
        </View>
        {done ? <Icon name="check" color={C.good} size={24} /> : null}
      </Row>
      {!compact && !done ? (
        <Button label={t('common.start')} icon="play" onPress={() => router.push({ pathname: '/timer', params: { w: w.id } })} style={{ marginTop: 6 }} />
      ) : null}
    </Card>
  );
}
