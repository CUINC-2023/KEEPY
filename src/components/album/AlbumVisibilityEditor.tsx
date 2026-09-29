import { useEffect, useState } from "react";
import { GRADES, type Rarity } from "@/data/mock";
import { missingCardDisplay, resetAlbumVisibility, saveAlbumVisibility, useAlbumVisibility, type MissingCardDisplay } from "@/lib/album-visibility";
import { Button } from "@/components/ui/button";

export function AlbumVisibilityEditor({ poolId }: { poolId: string }) {
  const saved = useAlbumVisibility();
  const [draft, setDraft] = useState<Partial<Record<Rarity, MissingCardDisplay>>>({});
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const next: Partial<Record<Rarity, MissingCardDisplay>> = {};
    for (const grade of GRADES) next[grade] = missingCardDisplay(saved, poolId, grade);
    setDraft(next);
  }, [poolId, saved]);
  const change = (grade: Rarity, value: MissingCardDisplay) => { setDraft((prev) => ({ ...prev, [grade]: value })); setNotice(""); };
  return <section className="space-y-3 border-t border-border pt-4">
    <h2 className="text-lg font-black">未持有圖像・預覽設定</h2>
    <p className="text-xs text-muted-foreground">後台示範／非真實權限。依卡池與等級保存的 Local Mock 設定，影響此瀏覽器的卡池及卡冊預覽；不更改持有狀態、卡牌取得或其他使用者的畫面，並非正式發布。預設灰階。</p>
    <div className="grid gap-2 sm:grid-cols-2">
      {GRADES.map((grade) => <label key={grade} className="flex min-w-0 items-center justify-between gap-2 border-b border-border p-2 text-sm">
        <span className="font-bold">{grade}</span>
        <select aria-label={`${grade} 未持有圖像`} value={draft[grade] ?? "grayscale"} onChange={(event) => change(grade, event.target.value === "silhouette" ? "silhouette" : "grayscale")} className="min-w-0 max-w-[80%] border border-border bg-background p-2 text-xs text-foreground">
          <option value="grayscale">灰階圖像</option><option value="silhouette">隱藏圖像／剪影</option>
        </select>
      </label>)}
    </div>
    <div className="flex flex-wrap gap-2"><Button onClick={() => setNotice(saveAlbumVisibility(poolId, draft) ? "已儲存本機 Demo 設定" : "儲存失敗，請檢查瀏覽器儲存空間")}>儲存本機設定</Button><Button variant="outline" onClick={() => setNotice(resetAlbumVisibility(poolId) ? "已重設本卡池為灰階預設" : "重設失敗")}>重設本卡池</Button></div>
    {notice && <p role="status" className="text-xs text-muted-foreground">{notice}</p>}
  </section>;
}