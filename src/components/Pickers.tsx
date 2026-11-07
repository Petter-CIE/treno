import { DISCIPLINES, EQUIPMENT } from '@/data/exercises';
import { useStore } from '@/lib/store';
import { DISC_COLOR, DISC_ICON } from '@/lib/theme';
import { STANDARD_BELLS, fmtWeight } from '@/lib/units';
import type { Discipline, Equipment } from '@/lib/types';
import { Chip, Wrap, type IconName } from './ui';

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
  pullupbar: 'human-handsup',
  band: 'vector-curve',
  none: 'close',
};

export function EquipmentPicker() {
  const { t, settings, updateSettings } = useStore();
  return (
    <Wrap>
      {EQUIPMENT.map((e: Equipment) => (
        <Chip key={e} label={t(`equip.${e}` as 'equip.none')} icon={EQUIP_ICON[e]} active={settings.equipment.includes(e)} onPress={() => updateSettings({ equipment: toggle(settings.equipment, e) })} />
      ))}
    </Wrap>
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
