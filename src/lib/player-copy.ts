import { useLocale } from "./keepy-i18n-shared";
export function usePlayerCopy() {
  const { locale } = useLocale();
  return (zh: string, en: string) => (locale === "en" ? en : zh);
}
