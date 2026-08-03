import { useEffect, useState } from 'react';
import { Locale, getStoredLocale, onLocaleChange } from '@tn4consulting/shared-locale-sync';

/**
 * React equivalent of the Angular remotes' `transloco.langChanges$`
 * subscription -- reacts to the shell's cross-remote locale-broadcast
 * (localStorage + CustomEvent, see shared-locale-sync) the same way every
 * Angular remote already does, just via a hook instead of Angular DI.
 */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(() => getStoredLocale());
  useEffect(() => onLocaleChange(setLocale), []);
  return locale;
}
