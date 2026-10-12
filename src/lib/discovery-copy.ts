import { useLocale } from "./keepy-i18n-shared";
export function useDiscoveryText() {
  const { locale } = useLocale();
  return (zh: string, en: string) => (locale === "en" ? en : zh);
}
