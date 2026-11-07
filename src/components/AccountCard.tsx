import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, TextInput } from 'react-native';
import { Button, Card, Divider, Icon, Row, T } from '@/components/ui';
import { SUPPORT_URL } from '@/lib/config';
import { googleAvailable } from '@/lib/google';
import { LANG_TAG } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { C, FONT } from '@/lib/theme';

/** Settings → optional account: email + one-time code, backup status, sign out, delete account. */
export function AccountCard() {
  const { t, lang, account, sendCode, verifyCode, signInGoogle, syncNow, signOut, deleteAccount } = useStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());
  const privacy = () => Linking.openURL(`${SUPPORT_URL}?lang=${lang === 'cs' || lang === 'nb' ? lang : 'en'}#privacy`).catch(() => {});

  const onSend = async () => {
    setBusy(true);
    setErr(null);
    const ok = await sendCode(email);
    setBusy(false);
    if (ok) setStep('code');
    else setErr(t('acc.errSend'));
  };

  const onGoogle = async () => {
    setBusy(true);
    setErr(null);
    const r = await signInGoogle();
    setBusy(false);
    if (r === 'error') setErr(t('acc.errGoogle'));
  };

  const onVerify = async () => {
    setBusy(true);
    setErr(null);
    const ok = await verifyCode(email, code);
    setBusy(false);
    if (ok) {
      setStep('email');
      setCode('');
    } else setErr(t('acc.errCode'));
  };

  const onDelete = () =>
    Alert.alert(t('acc.delete'), t('acc.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('acc.delete'),
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteAccount();
          Alert.alert(t('acc.delete'), ok ? t('acc.deleted') : t('acc.errSync'));
        },
      },
    ]);

  if (account.email) {
    const when = account.lastSync ? new Date(account.lastSync).toLocaleString(LANG_TAG[lang], { dateStyle: 'medium', timeStyle: 'short' }) : null;
    return (
      <Card style={{ gap: 10 }}>
        <Row>
          <Icon name="cloud-check-outline" color={C.accent} />
          <T style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>
            {t('acc.signedIn', { email: account.email })}
          </T>
        </Row>
        <Row>
          {account.syncing ? <ActivityIndicator size="small" color={C.accent} /> : null}
          <T variant="small" style={account.error ? { color: C.danger } : undefined}>
            {account.syncing ? t('acc.syncing') : account.error ? t('acc.errSync') : when ? t('acc.lastSync', { time: when }) : t('acc.never')}
          </T>
        </Row>
        <Row gap={10} style={{ flexWrap: 'wrap' }}>
          <Button label={t('acc.syncNow')} variant="secondary" icon="cloud-upload-outline" onPress={syncNow} disabled={account.syncing} />
          <Button label={t('acc.signOut')} variant="ghost" icon="logout" onPress={signOut} />
        </Row>
        <T variant="small">{t('acc.signOutHint')}</T>
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable onPress={privacy} accessibilityRole="link" hitSlop={8}>
            <T variant="small" style={{ color: C.accent }}>{t('acc.privacy')}</T>
          </Pressable>
          <Pressable onPress={onDelete} accessibilityRole="button" hitSlop={8}>
            <T variant="small" style={{ color: C.danger, fontWeight: '700' }}>{t('acc.delete')}</T>
          </Pressable>
        </Row>
      </Card>
    );
  }

  return (
    <Card style={{ gap: 10 }}>
      <T variant="muted">{t('acc.intro')}</T>
      {googleAvailable && step === 'email' ? (
        <>
          <Pressable onPress={onGoogle} disabled={busy} accessibilityRole="button" style={({ pressed }) => [st.google, pressed && { opacity: 0.85 }, busy && { opacity: 0.5 }]}>
            <Icon name="google" size={20} color="#1F1F1F" />
            <T style={{ color: '#1F1F1F', fontWeight: '700' }}>{t('acc.google')}</T>
          </Pressable>
          <T variant="small" style={{ textAlign: 'center' }}>
            — {t('acc.orEmail')} —
          </T>
        </>
      ) : null}
      {step === 'email' ? (
        <>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('acc.email')}
            placeholderTextColor={C.faint}
            style={st.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={() => validEmail && !busy && onSend()}
          />
          <Button label={t('acc.sendCode')} icon="email-fast-outline" onPress={onSend} disabled={!validEmail || busy} style={{ alignSelf: 'flex-start' }} />
        </>
      ) : (
        <>
          <T variant="small">{t('acc.codeSent', { email: email.trim() })}</T>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 10))}
            placeholder={t('acc.code')}
            placeholderTextColor={C.faint}
            style={[st.input, st.code]}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            returnKeyType="done"
            onSubmitEditing={() => code.length >= 6 && !busy && onVerify()}
          />
          <Row gap={10} style={{ flexWrap: 'wrap' }}>
            <Button label={t('acc.verify')} icon="login" onPress={onVerify} disabled={code.length < 6 || busy} />
            <Button
              label={t('acc.back')}
              variant="ghost"
              onPress={() => {
                setStep('email');
                setCode('');
                setErr(null);
              }}
            />
          </Row>
        </>
      )}
      {busy ? <ActivityIndicator color={C.accent} style={{ alignSelf: 'flex-start' }} /> : null}
      {err ? <T variant="small" style={{ color: C.danger }}>{err}</T> : null}
      <Pressable onPress={privacy} accessibilityRole="link" hitSlop={8}>
        <T variant="small" style={{ color: C.accent }}>{t('acc.privacy')}</T>
      </Pressable>
    </Card>
  );
}

const st = StyleSheet.create({
  input: { fontFamily: FONT[500], backgroundColor: C.surface2, color: C.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  code: { fontSize: 24, letterSpacing: 6, fontWeight: '700' },
  google: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 999, paddingVertical: 13 },
});
