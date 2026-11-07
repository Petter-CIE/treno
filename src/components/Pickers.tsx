import { DISCIPLINES, EQUIPMENT, EQUIP_PRESETS } from '@/data/exercises';
import { useStore } from '@/lib/store';
import { DISC_COLOR, DISC_ICON } from '@/lib/theme';
import { STANDARD_BELLS, fmtWeight } from '@/lib/units';
import type { Discipline, Equipment } from '@/lib/types';
import { Chip, T, Wrap, type IconName } from './ui';

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function DisciplinePicker() {
  const { t, settings, updateSettings } = useStore();
  return (
    <Wrap>
      {DISCIPLINES.map((d: Discipline) => (
        <Chip
          key={d}
          label={t(`disc.${d}` as 'disc.gym')}
          icon={DISC_ICON[d] as IconName}
          color={DISC_COLOR[d]}
          active={settings.disciplines.includes(d)}
          onPress={() => updateSettings({ disciplines: toggle(settings.disciplines, d) })}
        />
      ))}
    </Wrap>
  );
}

export const EQUIP_ICON: Record<Equipment, IconName> = {
  kettlebell: 'kettlebell',
  dumbbell: 'dumbbell',
  barbell: 'weight-lifter',
  machine: 'office-building-outline',
  cardio: 'rowing',
  pullupbar: 'human-handsup',
  dipbars: 'gymnastics',
  rings: 'ring',
  band: 'vector-curve',
  jumprope: 'jump-rope',
  box: 'cube-outline',
  sandbag: 'sack',
  sled: 'sledding',
  strongman: 'weight',
  none: 'close',
};

const sameSet = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((x) => b.includes(x));

/** One-tap sets for typical places: home, home gym, full gym, strongman gym, outdoor park. */
export function EquipmentPresets() {
  const { t, settings, updateSettings } = useStore();
  return (
    <Wrap>
      {EQUIP_PRESETS.map((p) => (
        <Chip
          key={p.id}
          label={t(`preset.${p.id}` as 'preset.home')}
          icon={p.icon as IconName}
          active={sameSet(settings.equipment, p.equipment)}
          onPress={() => updateSettings({ equipment: p.equipment })}
        />
      ))}
    </Wrap>
  );
}

export function EquipmentPicker() {
  const { t, settings, updateSettings } = useStore();
  return (
    <>
      <T variant="label">{t('set.presets')}</T>
      <EquipmentPresets />
      <T variant="label" style={{ marginTop: 8 }}>{t('set.ownPick')}</T>
      <Wrap>
      {EQUIPMENT.map((e: Equipment) => (
        <Chip key={e} label={t(`equip.${e}` as 'equip.none')} icon={EQUIP_ICON[e]} active={settings.equipment.includes(e)} onPress={() => updateSettings({ equipment: toggle(settings.equipment, e) })} />
      ))}
      </Wrap>
    </>
  );
}

export function BellPicker() {
  const { settings, updateSettings } = useStore();
  return (
    <Wrap>
      {STANDARD_BELLS.map((kg) => (
        <Chip key={kg} label={fmtWeight(kg, settings.unit)} active={settings.bells.includes(kg)} onPress={() => updateSettings({ bells: toggle(settings.bells, kg).sort((a, b) => a - b) })} />
      ))}
    </Wrap>
  );
}

export function DayPicker() {
  const { t, settings, updateSettings } = useStore();
  return (
    <Wrap gap={6}>
      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
        <Chip
          key={d}
          label={t(`wd.${d}` as 'wd.0')}
          active={settings.trainingDays.includes(d)}
          onPress={() => updateSettings({ trainingDays: toggle(settings.trainingDays, d).sort((a, b) => a - b) })}
        />
      ))}
    </Wrap>
  );
}
