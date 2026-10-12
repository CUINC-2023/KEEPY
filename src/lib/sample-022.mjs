export const SAMPLE_PACKAGE_ID = "local-demo-022-uniform";
export const SAMPLE_ARTICLES = ["local-demo-022-composition", "local-demo-022-progress"];
const bi = (zh, en) => ({ "zh-TW": zh, en });
const h = (zh, en) => ({ type: "heading", text: bi(zh, en) });
const p = (zh, en) => ({ type: "paragraph", text: bi(zh, en) });
export function sampleUniformPackage(partnerId, now = Date.now()) {
  const releaseAt = new Date(now - 60000).toISOString(),
    withdrawAt = new Date(now + 30 * 86400000).toISOString();
  return {
    partnerId,
    creatorId: "g-yoru",
    poolId: "p-uniform",
    articleIds: SAMPLE_ARTICLES,
    copy: {
      title: bi("制服序章 · 虛構企劃", "Uniform Prologue · Fictional concept"),
      summary: bi(
        "從同一套服裝出發，用距離、留白與光線閱讀不同的創作時刻。",
        "Read different creative moments through distance, negative space and light, all starting from one outfit.",
      ),
      story: bi(
        "制服序章是一套虛構的編輯企劃。故事從走廊的安靜開始：人物停下腳步，畫面留下足夠的空間，讓觀者想像下一個動作。到了窗邊，光線把服裝的摺線與背景分開；鏡頭靠近時，觀察重心從場景移向姿態。這些不是某位真人的生活紀錄，而是同一主題的三種閱讀方向。\n\n系列不靠換一套服裝來製造差異，而是讓構圖的距離、視線的方向與畫面的留白逐步改變。收藏時可以把已公開的款式放在一起，比較它們如何延續相同色調，又如何留下各自的節奏。所有圖像沿用本機示意素材，真實合作對象、拍攝與發布日期尚未確認。",
        "Uniform Prologue is a fictional editorial concept. It opens with a quiet corridor: a figure pauses while the frame leaves room for a viewer to imagine the next movement. By a window, light separates folds in the outfit from the background. As the camera moves closer, attention shifts from the setting to posture. These are three ways to read a theme, not records of a real person's life.\n\nThe series creates variety by changing distance, gaze and negative space rather than changing the outfit. Place the publicly available designs alongside each other to compare a shared palette and their individual rhythm. All imagery reuses local sample assets. Real collaborators, shooting dates and release dates remain unconfirmed.",
      ),
      goal: bi(
        "以公開目錄中的不同款式為收藏目標。同款重複取得不增加完成百分比；公開範圍與目錄版本以當前顯示規則為準，不推算未公開款式。",
        "Aim to collect distinct designs in the public catalogue. Additional copies of the same design do not raise completion. Use the currently displayed public catalogue and rule version; do not infer undisclosed designs.",
      ),
      endPolicy: bi(
        "系列結束後保留已取得收藏、取得來源與歷史快照。停止抽卡、復刻、限量與序號等正式政策仍待核定；本機預覽期間不是正式營運檔期。",
        "Acquired cards, acquisition sources and historical snapshots remain after the series. Draw closure, reruns, edition limits and serial numbers remain pending approval. The local preview window is not an operational release schedule.",
      ),
      teaser: bi(
        "下一篇想閱讀構圖、配色，還是製作故事？可前往既有主題票選。結果僅作企劃參考，不承諾合作或上架；正式時間待確認。",
        "Would you like to read about composition, colour or production next? Visit the existing theme vote. Results are planning input, not a promise of collaboration or release; real dates remain unconfirmed.",
      ),
    },
    application: bi(
      "0.22 本機虛構內容包，沿用既有系列與示意創作者；並非真人合作申請。",
      "0.22 fictional local package using the existing series and sample creator; not an application for a real collaboration.",
    ),
    cardNotes: bi(
      "僅使用既有主視覺與公開構圖說明，不展示或描述隱藏款式。",
      "Reuse existing artwork and explain public composition choices without displaying or describing hidden designs.",
    ),
    promotion: bi(
      "上架預告：制服序章的兩篇收藏誌已備妥，從構圖與收藏進度開始閱讀。僅本機內容測試，沒有真實合作或正式日期承諾。",
      "Preview announcement: two Uniform Prologue journal pieces are ready, beginning with composition and collection progress. This is a local content test with no real collaboration or confirmed release commitment.",
    ),
    retrospective: bi(
      "季末內容整理（虛構企劃）：本內容包整理了系列故事、構圖文章與收藏進度指南。真人訪談回答、實際拍攝紀錄與營運成效尚未提供，留待確認；沒有閱讀量、回訪率或收藏成效率可報告。下一輪可檢查雙語措辭與公開入口是否清楚，再由官方審核新版。",
      "Editorial wrap-up (fictional concept): this package brings together the series story, a composition article and a collection-progress guide. Real interview answers, production records and operational evidence have not been supplied and remain unconfirmed. There are no readership, return-rate or collection-completion results to report. A later review can check bilingual wording and public navigation before official approval of a new revision.",
    ),
    releaseAt,
    withdrawAt,
    materials: [
      {
        id: "m-demo-022-hero",
        ref: "season-hero",
        version: 1,
        source:
          "Existing local asset src/assets/peekfuture-season-hero.jpg; fictional KEEPY preview",
        evidence:
          "Repository asset reference only; not evidence of a real person's licensing. Local sample display only.",
        uses: { website: "sample-confirmed", social: "pending", print: "pending" },
        startAt: releaseAt,
        endAt: withdrawAt,
        alt: bi(
          "制服序章的本機示意主視覺，用於說明畫面留白與色調。",
          "Local Uniform Prologue sample artwork illustrating negative space and colour.",
        ),
        cardId: "",
      },
    ],
    editorial: {
      creatorIntro: bi(
        "Yoru 是現有目錄中的示意創作者。本企劃以安靜的畫面節奏、服裝細節與環境光作為討論方向。此介紹是虛構編輯設定，不代表真人履歷、言論或已成立的合作；未有確認的官方社群連結。",
        "Yoru is a sample creator in the existing catalogue. This concept discusses quiet visual pacing, outfit details and ambient light. The introduction is a fictional editorial setting, not a real biography, statement or confirmed collaboration. No verified official social links have been supplied.",
      ),
      questions: [
        bi(
          "你希望觀者從本季主題感受到什麼？",
          "What would you like a viewer to feel from this season's theme?",
        ),
        bi(
          "同一套服裝在不同場景中，哪些細節值得保留？",
          "Which outfit details should stay consistent across settings?",
        ),
        bi(
          "你會如何解釋一張公開構圖的距離與留白選擇？",
          "How would you explain distance and negative space in a public composition?",
        ),
        bi(
          "製作時最大的挑戰是什麼，下一次想嘗試什麼？",
          "What was the biggest production challenge, and what would you try next?",
        ),
      ],
      articles: [
        {
          id: SAMPLE_ARTICLES[0],
          category: "design",
          title: bi(
            "同一套服裝，如何拍出不同的故事？",
            "How can one outfit tell different stories?",
          ),
          summary: bi(
            "從鏡頭距離、留白與光線，閱讀公開的構圖與設計選擇。",
            "Read public composition and design choices through camera distance, negative space and light.",
          ),
          blocks: [
            h("先讓場景說話", "Let the setting speak first"),
            p(
              "這是一篇虛構企劃的設計說明，不是真人拍攝訪談。想像同一套服裝出現在走廊與窗邊：走廊的線條引導視線，窗邊的亮部則讓人物與背景分開。服裝不變，畫面仍能因環境的秩序而產生不同節奏。閱讀時先問：我的視線最先停在哪裡？再看背景如何把它帶往人物。",
              "This is a fictional concept's design note, not a real production interview. Imagine one outfit in a corridor and by a window. Corridor lines guide the eye, while window light separates the figure from the background. The outfit stays the same, but the setting gives each composition a different rhythm. Ask where your eye stops first, then notice how the background brings it toward the figure.",
            ),
            {
              type: "image",
              materialId: "m-demo-022-hero",
              caption: bi(
                "沿用本機示意主視覺，觀察人物與背景之間的空間；不是新拍攝成果。",
                "Reused local sample artwork: observe the space between figure and background; this is not a new production result.",
              ),
            },
            h("距離改變閱讀的重心", "Distance changes what we read"),
            p(
              "較遠的構圖會留下人物與環境的關係；較近的構圖把注意力交給姿態、摺線與色塊。兩者沒有高低之分。若畫面想表達等待，就讓空間保留一個尚未發生的動作；若想表達專注，就減少背景干擾，讓視線有清楚的停留點。這些是公開設計原則，不是對未公開卡面的暗示。",
              "A wider composition keeps the relationship between figure and environment visible. A closer frame shifts attention toward posture, folds and areas of colour. Neither is inherently better. To suggest waiting, leave room for a movement that has not happened. To suggest concentration, simplify the background and give the eye a clear resting point. These are public design principles, not hints about undisclosed card art.",
            ),
            h("留白與配色如何連成一套系列", "Connecting a series through space and colour"),
            p(
              "系列感不等於每張畫面都相同。可以維持相近的背景色調，讓每張構圖在留白的位置與光線方向上有所變化。圖上的文字也要避開重要的閱讀位置，縮小到手機時仍保留層次。圖片說明解釋設計選擇，替代文字則幫助無法觀看圖片的人理解內容；兩者各有用途。",
              "A coherent series does not require identical frames. Keep a related background palette while varying where space opens and where light enters. Text should avoid important viewing areas, and the hierarchy should remain legible on a phone. Captions explain a design choice; alternative text helps someone who cannot see the image understand it. Each serves a separate purpose.",
            ),
            h("把觀察帶回收藏", "Bring your observations back to collecting"),
            p(
              "下一步前往制服序章的公開系列頁，把已公開款式放在一起閱讀，再到創作者頁查看題綱與相關故事。本文只討論公開構圖，不列出隱藏款式、數量或圖片。真正的拍攝經驗與創作者回答尚未確認，因此保留空白，不把編輯設定寫成真人證言。",
              "Next, open the public Uniform Prologue series page to read the available designs together, then visit the creator page for the interview outline and related stories. This article discusses only public compositions and does not list hidden designs, their count or images. Real production experiences and creator answers remain unconfirmed, so editorial concepts are not presented as testimony.",
            ),
          ],
        },
        {
          id: SAMPLE_ARTICLES[1],
          category: "guide",
          title: bi(
            "如何閱讀你的系列收藏進度？",
            "How do you read your series collection progress?",
          ),
          summary: bi(
            "分清不同款式、重複卡、曾取得與當前持卡，理解公開收藏目標。",
            "Distinguish designs, duplicates, acquired history and current holdings to understand a public collection goal.",
          ),
          blocks: [
            h("先看不同款式，再看份數", "Look at designs before copy counts"),
            p(
              "系列完成度回答的是『公開目錄中的不同款式，我曾取得了哪些？』，不是『我一共取得幾份卡？』。例如公開目錄裡的甲、乙兩款：曾取得甲兩份，仍只算一種；之後首次取得乙，才增加一種。這裡用甲乙作通用說明，不對應任何隱藏卡名或暗示完整卡池數量。",
              "Series completion asks which distinct designs in the public catalogue you have acquired, rather than how many copies you have received. For two generic public designs, A and B, acquiring two copies of A still counts as one design. Acquiring B for the first time adds another. These labels are generic examples, not hidden card names or clues to a full pool's size.",
            ),
            h(
              "曾取得與當前持卡是兩個問題",
              "Acquired history and current holdings answer different questions",
            ),
            p(
              "『曾取得』保存首次取得某款式的歷史，『當前持卡』顯示目前還持有多少份。兩個數字可能不同，畫面應分別標示，不用其中一個冒充另一個。收藏進度沿用既有取得紀錄，重複卡不重複增加百分比；任何未核定的成長、合成或實體消耗政策，都不能從本文推導為已生效。",
              "Acquired history records that you obtained a design, while current holdings show how many copies you hold now. These values may differ and should be labelled separately. Collection completion uses the existing acquisition history, and duplicates do not repeatedly raise the percentage. This guide does not establish any pending growth, synthesis or physical-card consumption policy.",
            ),
            h("只閱讀當前公開的目標", "Read only the currently public goal"),
            p(
              "公開目錄與顯示規則決定你能閱讀的收藏目標。未公開款式不透過百分比、背面、搜尋或圖片替代文字補充揭露；也不要用舊目錄分母去推測新的隱藏內容。若官方調整公開目錄，請看當前規則版本及畫面說明，而不是把兩個版本的百分比直接比較。",
              "The public catalogue and visibility rules determine the collection goal you can read. Undisclosed designs are not revealed through percentages, card backs, search or image alternatives. Do not use an old catalogue denominator to infer hidden content. If the public catalogue changes, read the current rule version and explanation rather than directly comparing percentages across versions.",
            ),
            h("下一步：查看本人卡冊", "Next: open your own album"),
            p(
              "登入本機測試身分後，前往本人收藏頁與制服序章卡冊，查看已公開的不同款式進度及當前持卡。未登入時可閱讀公開系列，私人持卡與交易資料不會因此公開。你可以自行決定展示範圍；系列結束不會刪除取得歷史。正式復刻、限量與履約政策仍待核定。",
              "After selecting a local test identity, open your own collection page and the Uniform Prologue album to inspect public design progress and current holdings. Without a session, you can read the public series; private holdings and transactions are not exposed. You control your showcase visibility, and a series ending does not erase acquisition history. Formal rerun, edition and fulfillment policies remain pending approval.",
            ),
          ],
        },
      ],
    },
  };
}
