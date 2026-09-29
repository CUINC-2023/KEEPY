# CU 女神卡 — 任務清單

## 已完成
- 設計系統（深靛藍／紫羅蘭／柔金，10 級卡牌等級色與漸層）
- Mock 資料層（女神、卡池、卡牌、收藏、分潤、合成、商城、排行榜、公告）
- 共用版型與元件（Header、Sidebar、Bottom Nav、Mock 登入視窗、CardFrame、PoolCover、RarityBadge、StatusTag、StatCard、Progress、FilterBar、DataTable、EmptyState、Skeleton、ConfirmDialog、ResultScreen、Toast）
- 商業規則修正：等級改 C/U/R/RR/RRR/SR/SSR/HR/UR/O；移除固定分潤比例；分潤僅來自付費抽卡；女神後台以新台幣顯示、不模擬提領
- 公開前台：首頁、卡池列表、卡池詳情、女神列表、女神公開頁、排行榜、遊戲規則
- 既有頁面：抽卡所、收藏圖鑑、合成工坊、女神後台

## 待使用者確認
- 卡牌詳情頁（單張卡牌的成長與來源紀錄）
- 女神合作申請／審核流程畫面
- 商城頁與點數購買流程（仍為 Demo）
- 玩家個人頁與任務／活動系統

## Batch 2 — 玩家模式核心流程（已完成）
- [x] /app 玩家首頁（等級、點數、卡牌數、完成率、排名、進行中卡池、最近取得、可升級提醒）
- [x] /app/draw/:poolId 抽卡（單抽／十連抽、機率、保底、價格、確認視窗、鎖定送出、離線恢復查看）
- [x] 抽卡結果（預先定義 Mock、新卡／重複卡、持有數與成長值變化、略過動畫、Reduce Motion）
- [x] /app/album 卡冊（卡池／女神／等級／取得狀態／可升級／重複卡篩選；手機每列 2 張）
- [x] /app/album/:poolId 卡冊詳情（制服序章 18/40、各等級完成度）
- [x] /app/cards/:id 滿版卡片觀看器（縮放示意、前後切換、卡牌資料與成長值）
- [x] /app/growth 指定卡成長（每張重複卡 +10%、100% 升一級、確認與獨立結果畫面）
- [x] /app/synthesis 隨機合成（同卡池同等級、基礎／道具／最終成功率、連續失敗保底 10 次、合成不產生分潤）
- [x] /app/wallet 與 /app/history（點數、Demo 儲值方案、訂單、抽卡與點數異動紀錄）
- [x] /app/settings（基本資料、Reduce Motion、通知、隱私）
- [x] 各頁 Loading／Empty／Error／Permission Denied 示範狀態切換器

## Batch 4 — 合作女神申請、審核與身分開通（已完成）
- [x] /partner 公開合作說明（卡牌 IP 曝光、付費抽卡新台幣分潤、流程、待定項目）
- [x] /partner/apply 六步申請表（基本資料、公開社群、創作與合作、素材 Mock、規則確認、預覽送出）
- [x] /partner/apply/status 申請進度時間軸、補件、未通過、合約 Demo 確認與身分開通
- [x] /admin/goddesses 女神名單（合作中／待合約／暫停／結束，Demo 狀態操作）
- [x] /admin/goddesses/applications（＋ /:id）申請管理與審核操作 Demo
- [x] PartnerProvider 本地 Mock 狀態（申請狀態、草稿自動儲存、審核覆寫、身分開通）

## 待使用者確認（Batch 4 後）
- 商城與道具頁、活動與任務系統
- 審核 SLA／補件期限、重複申請判定、核准後卡池指派流程

## Batch 5 / Phase 5A（已完成）
- [x] 六卡池 Mock（制服序章／星光舞台／盛夏海風／和風綺想／夜櫻回憶／一週年紀念），每池 8+ 張完整卡牌＋卡位剪影
- [x] /pools 狀態＋常駐／限定篩選；/pools/:id 六池可進入，僅進行中可抽卡，即將開始顯示倒數與提醒我 Demo，已結束導向卡冊
- [x] /app/album 卡冊總覽（篩選、搜尋、完成率排序）；/app/album/:poolId 共用卡冊詳情範本與卡格狀態
- [x] /admin/pools 六池列表（類型、女神數、設定版本與狀態）；:poolId／draw-settings／synthesis-settings 依 poolId 取資料
- [x] /admin/pools/templates（4 種卡池範本＋7 步流程預覽）、/admin/album-templates（3 種卡冊 UI 範本）
- [ ] 下一批：完整建立卡池精靈（分步表單與草稿儲存）

## Batch 5 Phase 5B-1（完成）
- 新增 /admin/pools/new 七步精靈骨架，本批啟用 Step 1-4；Step 5-7 標示「下一批完成」且不可點。
- /admin/pools 新增「建立新卡池」按鈕；/admin/pools/templates 四種範本導向 /admin/pools/new?template=permanent|limited|collaboration|rerun。
- 驗證：必填、slug 格式、既有六個 poolId 重複、開始日早於結束日、至少 1 位女神與 1 張卡、機率總和 100
## Batch 5 Phase 5B-1（完成）
- 新增 /admin/pools/new 七步精靈骨架，本批啟用 Step 1-4；Step 5-7 標示「下一批完成」且不可點。
- /admin/pools 新增「建立新卡池」按鈕；/admin/pools/templates 四種範本導向 /admin/pools/new?template=permanent/limited/collaboration/rerun。
- 驗證：必填、slug 格式、既有六個 poolId 重複、開始日早於結束日、至少 1 位女神與 1 張卡、機率總和 100%、啟用且機率>0 等級需至少 1 張可抽卡牌。
- 下一批：Phase 5B-2（Step 5 合成條件、Step 6 卡冊顯示、Step 7 預覽驗證與完成建立 Demo 草稿）。
## Phase 6A — 公開前台資訊架構與活潑版首頁
- [ ] 更新平台品牌階層與全站公開導覽，保留模式切換及管理入口
- [ ] 重構首頁為 P0／P1／P2 模組化內容中心，沿用既有六卡池資料
- [ ] 新增活動、公告、下一季、許願卡池、募集、排行榜、實體典藏獨立路由
- [ ] 為首頁與新頁面提供五種 Demo 狀態及純本機互動
- [ ] 驗證 TypeScript、Build、桌機與手機無水平溢出

## Phase 6B-1A-1 — 玩家私人儀表板
- [x] 精細化 `/app` 私人儀表板，沿用現有玩家、六卡池、排行榜與實體典藏 Mock
- [x] 驗證 TypeScript、Build、桌機與 378px 手機無水平溢出及瀏覽器錯誤

## Phase 6B-1A-2 — 玩家公開收藏頁
- [ ] 建立 `/collectors/demo-player` 公開／未公開 Local Mock 收藏頁
- [ ] 恢復 `/app` 的公開收藏頁入口
- [ ] 驗證 TypeScript、Build、桌機與 378px 手機無水平溢出及瀏覽器錯誤

## Phase 6C-1 — 全站選單分流與可收合側欄
- [x] 依公開、玩家、管理、女神網址分流專屬選單
- [x] 桌機側欄收合並以 `pf-sidebar-collapsed` 保存本機偏好
- [x] 手機抽屜支援遮罩、連結與 Esc 關閉，避免重複導覽
- [x] 驗證 TypeScript、Build、桌機與 378px 手機

## Phase 6C-2 — 全域深色／淺色佈景
- [x] 建立 light／dark 全域語意色票與首次載入主題初始化
- [x] 共用側欄與手機抽屜加入可讀的佈景切換控制
- [x] 以 `pf-theme` 保存瀏覽器本機偏好並跨路由沿用
- [x] 驗證四類路由、TypeScript、Build、桌機與 378px 手機

## 0.8.0／Phase 6E-2 — 官方首頁內容與導覽一致性
- [x] 區分進行中卡池與下一季預告，倒數採台北時間且到期安全顯示
- [x] 公告／活動摘要與列表同源，入口文案不暗示單篇詳情
- [x] 驗證首頁入口、雙主題與雙尺寸、型別與建置；不發布

## 0.9.0／Phase 6E-3 — 官方內容完整鏈路
- [x] 公告與活動單篇詳情（穩定 id、相關連結、未知 id 404）
- [x] 下一季未開放提示與相關入口；許願示意選擇不計票；募集授權說明與未開放送件
- [x] 驗證 1280/378、深淺色、tsgo、build；不發布

## 0.10.0／Phase 6F — 後台內容設定 → 儲存 → 前台預覽（Local Mock 縱向切片）
- [x] /admin/content 六分類編輯（公告、活動、首頁區塊、卡池文案、許願、榜單說明）
- [x] 單一合併來源 content-store（pf-content-overrides-v1），驗證／取消／重設／損壞退回
- [x] 詳情頁分頁標題／描述跟隨本機編輯；1280／378 雙主題驗收
- [ ] 後續擴充：新增／刪除項目、相關連結編輯

## 0.11.0 QA 追加
- [x] 複製網址失敗不得顯示成功
- [x] 訪客頁公開排行名次與排行榜同源
- [x] 展示卡 id／等級與卡牌詳情一致

## 0.13.0 互動預覽（進行中）
- [ ] 十抽加贈一張、結果卡放大與高階揭曉（Demo）
- [ ] 已持有卡翻面、未持有卡依池與等級遮蔽
- [ ] 後台遮蔽設定本機保存與重設；雙尺寸、雙主題、鍵盤、低動態驗收

## 0.13.0 遮蔽一致性補修
- [x] 共用卡池＋等級 Local Mock 設定覆蓋卡池封面、卡池卡面與卡冊；剪影不輸出圖片節點
- [x] 直達未持有卡詳情時安全佔位，灰階才開放示例放大；雙尺寸、型別、建置驗收
- [x] 封面逐張依卡牌實際等級與持有狀態遮蔽；混合等級單張隱藏回歸，不更動正式卡池數據
