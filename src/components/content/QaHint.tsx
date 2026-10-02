import { Link } from "@tanstack/react-router";
import { FAQ, type FaqId } from "@/data/faq";
import { useLocale } from "@/lib/keepy-i18n";
export function QaHint({ id }: { id: FaqId }) {
  const { locale } = useLocale(); const item = FAQ.find(row => row.id === id);
  if (!item) return null;
  return <Link to="/faq" hash={id} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg py-2 text-xs text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"><span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full border border-current font-bold">?</span><span className="min-w-0 break-words">{item.hint[locale]}<span className="sr-only"> · {item.title[locale]}</span></span></Link>;
}
