import { Link } from "@tanstack/react-router";
import { cardsByPool } from "@/data/mock";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { playQuestions } from "@/lib/play-questions.mjs";
import type { CollectionMe, CollectionCatalogue } from "@/lib/collection-store";
export function PracticeWorkbench({
  me,
  catalogue,
}: {
  me: CollectionMe;
  catalogue: CollectionCatalogue;
}) {
  const t = useDiscoveryText(),
    faces = me.cards.filter((c) => !!cardsByPool(c.poolId).find((v) => v.id === c.cardId)?.art);
  const modes = [
    {
      id: "memory",
      name: t("記憶配對", "Memory matching"),
      count: me.cards.length,
      min: 2,
      unit: t("不同款式", "distinct designs"),
    },
    {
      id: "puzzle",
      name: t("卡牌拼圖", "Card puzzle"),
      count: faces.length,
      min: 1,
      unit: t("合法卡面", "eligible faces"),
    },
    {
      id: "sequence",
      name: t("順序記憶", "Sequence memory"),
      count: faces.length,
      min: 2,
      unit: t("合法卡面", "eligible faces"),
    },
    {
      id: "knowledge",
      name: t("卡冊知識", "Album knowledge"),
      count: playQuestions(me, catalogue, "knowledge").length,
      min: 2,
      unit: t("有效題目", "eligible questions"),
    },
    {
      id: "observation",
      name: t("收藏觀察", "Collection observation"),
      count: playQuestions({ ...me, cards: faces }, catalogue, "observation").length,
      min: 2,
      unit: t("有效題目", "eligible questions"),
    },
  ];
  return (
    <section data-practice-workbench className="panel space-y-4 p-4">
      <h2 className="text-xl font-bold">{t("本人練習工作台", "Your practice workbench")}</h2>
      <p>
        {t(
          "統一查看五玩法的當前合法素材；在原玩法面板選內容、難度與提示，不建立第二套設定。以下為最低難度資格，較高難度仍以原面板檢查。",
          "Review current eligible material across five modes. Choose content, difficulty and hints in the existing mode panels, without a second settings source. These are minimum-difficulty requirements; higher difficulties are checked in their panels.",
        )}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((m) => (
          <li
            key={m.id}
            className="min-w-0 space-y-2 rounded border p-3"
            data-workbench-mode={m.id}
          >
            <h3 className="font-bold">{m.name}</h3>
            <p>
              {m.count} {m.unit} · {t("至少", "minimum")} {m.min}
            </p>
            {m.count >= m.min ? (
              <a
                href={"#play-" + m.id}
                className="inline-flex min-h-11 items-center text-primary underline"
                onClick={() =>
                  requestAnimationFrame(() =>
                    document
                      .getElementById("play-" + m.id)
                      ?.querySelector<HTMLSelectElement>("select")
                      ?.focus({ preventScroll: true }),
                  )
                }
              >
                {t("選擇內容與設定", "Choose content and settings")}
              </a>
            ) : (
              <p>
                {t(
                  "合法來源不足，先探索本人收藏；不補造素材。",
                  "Insufficient eligible sources. Explore your collection first; no material is invented.",
                )}
              </p>
            )}
          </li>
        ))}
      </ul>
      <nav className="flex flex-wrap gap-4" aria-label={t("練習接續", "Continue practice")}>
        <a className="text-primary underline" href="#practice-plan">
          {t("接續原私人練習清單", "Continue your existing private practice list")}
        </a>
        <a className="text-primary underline" href="#play-records">
          {t("核對保存結果與版本", "Review saved results and versions")}
        </a>
        <Link className="text-primary underline" to="/app/planning">
          {t("安排私人優先順序", "Arrange private priorities")}
        </Link>
      </nav>
    </section>
  );
}
