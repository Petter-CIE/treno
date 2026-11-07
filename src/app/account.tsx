import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { AccountCard } from '@/components/AccountCard';
import { CloseButton, Screen } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function AccountScreen() {
  const { t } = useStore();
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen title={t('acc.title')} right={<CloseButton label={t('common.back')} onPress={() => router.back()} />}>
        <AccountCard />
      </Screen>
    </KeyboardAvoidingView>
  );
}
