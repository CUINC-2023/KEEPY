// ─────────────────────────────────────────────────────────────
// KEEPY — 合作女神申請／審核／身分開通 Mock 資料（Batch 4）
// 全部為虛構本地假資料：不連接任何後端、不做真實證件驗證、
// 不上傳檔案、不電子簽署、不發送通知，也不產生真實金流。
// ─────────────────────────────────────────────────────────────
import { SPLIT_POLICY_NOTE } from "@/data/mock";

export const PARTNER_INCENTIVES = [
  {
    title: "卡牌 IP 曝光",
    desc: "形象以卡牌形式進入卡池、卡冊與排行榜，於公開女神頁累積長期曝光。",
  },
  {
    title: "付費抽卡分潤（新台幣）",
    desc: "玩家以現金或付費點數完成抽卡並抽到相關女神卡牌時，依合作合約取得新台幣分潤。",
  },
  {
    title: "官方卡池企劃協作",
    desc: "可與官方討論卡池主題、卡面風格與活動檔期（企劃細節為 Demo）。",
  },
];

export const PARTNER_SPLIT_NOTES = [
  `${SPLIT_POLICY_NOTE}，本站不顯示任何未核定的固定比例。`,
  "分潤一律以新台幣顯示與計算，合作女神不會取得平台點數。",
  "贈送點數抽卡、免費抽卡／活動贈抽、卡牌合成、卡牌成長、商城道具與其他遊戲內行為，皆不產生分潤。",
];

export const PARTNER_FLOW = [
  { step: "了解合作", desc: "閱讀合作內容、分潤來源與素材需求。" },
  { step: "填寫申請", desc: "提供藝名、公開社群與創作資料；不需提供任何敏感個資。" },
  { step: "官方審核", desc: "官方確認公開資料、內容類型與素材可行性。" },
  { step: "必要時補件", desc: "若資料不足，官方會說明補件項目與期限（Demo）。" },
  { step: "核准", desc: "審核通過後進入合約確認階段。" },
  { step: "合約確認（Demo）", desc: "原型不提供真實電子簽署，僅示範確認流程。" },
  { step: "開通女神身分", desc: "同一帳號新增女神身分，玩家卡冊、點數與帳號資料不變。" },
];

export const PARTNER_TBD = [
  "申請資格門檻（年齡、粉絲數、內容審核標準）：Demo／待定",
  "審核作業時間與補件期限：Demo／待定",
  "形象照與卡牌素材的正式規格與交付方式：Demo／待定",
  "肖像、作品與卡牌素材授權範圍：待正式合約確認",
  "分潤比例、級距與結算時程：依合作合約，介面不顯示未核定數字",
];

export const NO_SENSITIVE_DATA_NOTE =
  "本申請不收集身分證、銀行資料、地址、密碼或其他真實敏感資料；所有欄位僅為原型示意。";

// ── 申請表單選項 ─────────────────────────────────────────────
export const REGIONS = [
  "臺北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣", "苗栗縣",
  "臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣",
  "臺南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣",
  "澎湖縣", "金門縣", "連江縣",
];

export const LANGUAGES = ["繁體中文", "英文", "日文", "韓文", "粵語", "臺語"];

export const SOCIAL_PLATFORMS = [
  "Instagram", "Facebook", "Threads", "X", "YouTube", "TikTok",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** 粉絲數僅做區間選擇，不要求登入社群帳號 */
export const FOLLOWER_RANGES = [
  "未公開", "1,000 以下", "1,000–5,000", "5,000–1 萬",
  "1 萬–5 萬", "5 萬–10 萬", "10 萬以上",
];

export const CONTENT_TYPES = [
  "直播", "短影音", "音樂／歌唱", "舞蹈", "Cosplay",
  "時尚穿搭", "遊戲實況", "旅遊", "美妝", "聲音／電台",
];

export const STYLE_TAGS = [
  "清新", "甜美", "酷帥", "神秘", "日系", "都會", "運動", "療癒", "古典", "未來感",
];

export const CARD_THEMES = [
  "制服", "星光舞台", "夜櫻", "都會日常", "節慶限定", "運動風", "神話幻想",
];

export const COOP_WILLINGNESS = ["願意", "可討論", "暫不考慮"];

export const MATERIAL_SLOTS = [
  { key: "portrait", label: "形象照（Mock 上傳框）", spec: "建議 3:4，僅示意不會上傳" },
  { key: "portfolio", label: "作品集（Mock 上傳框）", spec: "可放 3–10 張代表作，僅示意" },
  { key: "cardRef", label: "卡牌參考素材（Mock 上傳框）", spec: "2:3 卡面參考，僅示意" },
];

export const RULE_ACKS = [
  { key: "paidOnly", label: "我了解僅玩家以現金或付費點數完成抽卡的實際消費，才會產生女神分潤。" },
  { key: "contract", label: "我了解實際分潤比例依合作合約約定，介面不顯示未核定比例。" },
  { key: "noPoints", label: "我了解合作女神不會取得平台點數，分潤一律以新台幣計算。" },
  { key: "noFusion", label: "我了解卡牌合成、卡牌成長、商城道具與其他遊戲內行為都不產生分潤。" },
  { key: "demo", label: "我了解本原型的申請、審核、合約與開通流程皆為 Demo，不具法律效力。" },
];

// ── 申請狀態 ─────────────────────────────────────────────────
export type ApplicationStatus =
  | "草稿"
  | "已送出"
  | "審核中"
  | "待補件"
  | "已核准"
  | "未通過"
  | "待合約確認"
  | "女神身分已開通";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "草稿", "已送出", "審核中", "待補件", "已核准", "未通過", "待合約確認", "女神身分已開通",
];

export const statusTone = (
  s: ApplicationStatus
): "live" | "pending" | "info" | "gold" | "danger" | "resting" => {
  switch (s) {
    case "女神身分已開通":
      return "live";
    case "已核准":
    case "待合約確認":
      return "gold";
    case "審核中":
    case "已送出":
      return "info";
    case "待補件":
      return "pending";
    case "未通過":
      return "danger";
    default:
      return "resting";
  }
};

/** 未通過原因分類（中性描述，避免主觀或羞辱性評語）*/
export const REJECT_REASONS = [
  "公開社群資料不足，無法確認經營狀況",
  "內容類型與現階段卡池企劃方向不符",
  "素材規格或授權條件尚無法確認",
  "重複申請或資料與既有合作重疊",
  "現階段合作名額已滿，暫不開放",
];

export const RESUBMIT_ITEMS = [
  "補充至少 1 個可公開驗證的社群連結",
  "補充 3 張以上代表性作品（Mock）",
  "補充可合作卡牌主題與風格說明",
  "確認形象素材的授權範圍（於正式合約確認）",
];

export const REAPPLY_NOTE =
  "未通過不影響玩家身分與既有卡冊、點數；調整資料後可再次送出申請（Demo 無冷卻時間限制，正式規則待定）。";

// ── 申請案件 Mock（虛構）──────────────────────────────────────
export interface ReviewLogEntry {
  at: string;
  by: string;
  action: string;
  note: string;
}

export interface Application {
  id: string;
  stageName: string;
  displayName: string;
  intro: string;
  region: string;
  languages: string[];
  socials: { platform: SocialPlatform; url: string; followers: string }[];
  contentTypes: string[];
  styleTags: string[];
  shootWilling: string;
  cardThemes: string[];
  pastCoop: string;
  materials: { label: string; status: "已備齊" | "待補件" | "審核中" }[];
  ruleAckAll: boolean;
  /** 資料完整度（%） */
  completeness: number;
  status: ApplicationStatus;
  owner: string;
  submittedAt: string;
  updatedAt: string;
  /** 待補件說明與期限（Demo）*/
  resubmitNote?: string;
  resubmitDue?: string;
  rejectReason?: string;
  /** 重複申請提示 */
  duplicateOf?: string;
  logs: ReviewLogEntry[];
}

export const APPLICATIONS: Application[] = [
  {
    id: "AP-2609-001",
    stageName: "澄野 小柚",
    displayName: "小柚",
    intro: "以柑橘色調與日常穿搭為主題的短影音創作者，擅長輕快剪輯與街拍。",
    region: "臺北市",
    languages: ["繁體中文", "日文"],
    socials: [
      { platform: "Instagram", url: "https://example.com/demo-yuzu-ig", followers: "1 萬–5 萬" },
      { platform: "TikTok", url: "https://example.com/demo-yuzu-tt", followers: "5 萬–10 萬" },
    ],
    contentTypes: ["短影音", "時尚穿搭"],
    styleTags: ["清新", "都會"],
    shootWilling: "願意",
    cardThemes: ["都會日常", "制服"],
    pastCoop: "曾與虛構服飾品牌 A 進行 2 次聯名短影音（Mock）。",
    materials: [
      { label: "形象照", status: "已備齊" },
      { label: "作品集", status: "已備齊" },
      { label: "卡牌參考素材", status: "審核中" },
    ],
    ruleAckAll: true,
    completeness: 95,
    status: "審核中",
    owner: "營運・小星",
    submittedAt: "2026-09-16 10:12",
    updatedAt: "2026-09-18 14:30",
    logs: [
      { at: "2026-09-16 10:12", by: "申請人", action: "送出申請", note: "首次送出" },
      { at: "2026-09-17 09:40", by: "營運・小星", action: "開始審核", note: "指派負責人並檢視社群連結" },
    ],
  },
  {
    id: "AP-2609-002",
    stageName: "青嵐 綾",
    displayName: "綾",
    intro: "深夜聲音電台主持，主打療癒朗讀與環境音。",
    region: "臺中市",
    languages: ["繁體中文"],
    socials: [{ platform: "YouTube", url: "https://example.com/demo-aya-yt", followers: "5,000–1 萬" }],
    contentTypes: ["聲音／電台"],
    styleTags: ["療癒", "神秘"],
    shootWilling: "可討論",
    cardThemes: ["夜櫻"],
    pastCoop: "無（Mock）。",
    materials: [
      { label: "形象照", status: "待補件" },
      { label: "作品集", status: "已備齊" },
      { label: "卡牌參考素材", status: "待補件" },
    ],
    ruleAckAll: true,
    completeness: 62,
    status: "待補件",
    owner: "營運・夜班",
    submittedAt: "2026-09-12 21:05",
    updatedAt: "2026-09-19 11:22",
    resubmitNote: "請補充可公開的第二個社群連結，以及 3 張以上代表作（Mock）。",
    resubmitDue: "2026-10-05（Demo，正式期限待定）",
    logs: [
      { at: "2026-09-12 21:05", by: "申請人", action: "送出申請", note: "首次送出" },
      { at: "2026-09-15 10:00", by: "營運・夜班", action: "開始審核", note: "" },
      { at: "2026-09-19 11:22", by: "營運・夜班", action: "要求補件", note: "社群連結與作品集不足" },
    ],
  },
  {
    id: "AP-2608-014",
    stageName: "星見 沙羅",
    displayName: "沙羅",
    intro: "舞台演出與翻唱創作者，擅長華麗燈光風格。",
    region: "高雄市",
    languages: ["繁體中文", "英文"],
    socials: [
      { platform: "Instagram", url: "https://example.com/demo-sara-ig", followers: "5 萬–10 萬" },
      { platform: "X", url: "https://example.com/demo-sara-x", followers: "1 萬–5 萬" },
    ],
    contentTypes: ["音樂／歌唱", "舞蹈"],
    styleTags: ["酷帥", "未來感"],
    shootWilling: "願意",
    cardThemes: ["星光舞台", "節慶限定"],
    pastCoop: "虛構音樂祭 B 演出（Mock）。",
    materials: [
      { label: "形象照", status: "已備齊" },
      { label: "作品集", status: "已備齊" },
      { label: "卡牌參考素材", status: "已備齊" },
    ],
    ruleAckAll: true,
    completeness: 100,
    status: "待合約確認",
    owner: "營運・Demo 管理員",
    submittedAt: "2026-08-28 15:40",
    updatedAt: "2026-09-14 16:02",
    logs: [
      { at: "2026-08-28 15:40", by: "申請人", action: "送出申請", note: "" },
      { at: "2026-08-30 09:12", by: "營運・Demo 管理員", action: "開始審核", note: "" },
      { at: "2026-09-14 16:02", by: "營運・Demo 管理員", action: "核准", note: "進入合約確認（Demo），尚未開通女神身分" },
    ],
  },
  {
    id: "AP-2608-009",
    stageName: "白瀨 凜",
    displayName: "凜",
    intro: "運動與健身內容創作者，常見於戶外拍攝。",
    region: "新竹市",
    languages: ["繁體中文"],
    socials: [{ platform: "Instagram", url: "https://example.com/demo-rin-ig", followers: "1,000–5,000" }],
    contentTypes: ["短影音"],
    styleTags: ["運動"],
    shootWilling: "願意",
    cardThemes: ["運動風"],
    pastCoop: "無（Mock）。",
    materials: [
      { label: "形象照", status: "已備齊" },
      { label: "作品集", status: "待補件" },
      { label: "卡牌參考素材", status: "待補件" },
    ],
    ruleAckAll: false,
    completeness: 48,
    status: "未通過",
    owner: "營運・小星",
    submittedAt: "2026-08-20 08:31",
    updatedAt: "2026-08-26 17:45",
    rejectReason: "公開社群資料不足，無法確認經營狀況",
    logs: [
      { at: "2026-08-20 08:31", by: "申請人", action: "送出申請", note: "" },
      { at: "2026-08-22 10:04", by: "營運・小星", action: "開始審核", note: "" },
      { at: "2026-08-26 17:45", by: "營運・小星", action: "未通過", note: "公開社群資料不足，可補齊後再次申請" },
    ],
  },
  {
    id: "AP-2609-007",
    stageName: "霧島 楓",
    displayName: "楓",
    intro: "Cosplay 與角色攝影創作者，作品以和風場景為主。",
    region: "臺南市",
    languages: ["繁體中文", "日文"],
    socials: [
      { platform: "Threads", url: "https://example.com/demo-kaede-th", followers: "5,000–1 萬" },
      { platform: "Facebook", url: "demo-kaede-fb（格式待確認）", followers: "未公開" },
    ],
    contentTypes: ["Cosplay"],
    styleTags: ["日系", "古典"],
    shootWilling: "可討論",
    cardThemes: ["夜櫻", "神話幻想"],
    pastCoop: "同人活動攤位共同企劃（Mock）。",
    materials: [
      { label: "形象照", status: "審核中" },
      { label: "作品集", status: "審核中" },
      { label: "卡牌參考素材", status: "待補件" },
    ],
    ruleAckAll: true,
    completeness: 74,
    status: "已送出",
    owner: "未指派",
    submittedAt: "2026-09-19 22:58",
    updatedAt: "2026-09-19 22:58",
    duplicateOf: "AP-2607-003",
    logs: [{ at: "2026-09-19 22:58", by: "申請人", action: "送出申請", note: "系統偵測到可能的重複申請" }],
  },
  {
    id: "AP-2607-021",
    stageName: "湊 心晴",
    displayName: "心晴",
    intro: "遊戲實況與雜談，長時直播為主。",
    region: "桃園市",
    languages: ["繁體中文"],
    socials: [{ platform: "YouTube", url: "https://example.com/demo-koharu-yt", followers: "10 萬以上" }],
    contentTypes: ["遊戲實況", "直播"],
    styleTags: ["甜美"],
    shootWilling: "暫不考慮",
    cardThemes: ["都會日常"],
    pastCoop: "虛構遊戲 C 的宣傳直播（Mock）。",
    materials: [
      { label: "形象照", status: "已備齊" },
      { label: "作品集", status: "已備齊" },
      { label: "卡牌參考素材", status: "已備齊" },
    ],
    ruleAckAll: true,
    completeness: 100,
    status: "女神身分已開通",
    owner: "營運・Demo 管理員",
    submittedAt: "2026-07-18 13:20",
    updatedAt: "2026-08-02 10:15",
    logs: [
      { at: "2026-07-18 13:20", by: "申請人", action: "送出申請", note: "" },
      { at: "2026-07-20 09:00", by: "營運・Demo 管理員", action: "開始審核", note: "" },
      { at: "2026-07-30 15:30", by: "營運・Demo 管理員", action: "核准", note: "進入合約確認（Demo）" },
      { at: "2026-08-02 10:15", by: "申請人", action: "合約確認（Demo）", note: "同帳號新增女神身分" },
    ],
  },
  {
    id: "AP-2609-011",
    stageName: "雪見 那月",
    displayName: "那月",
    intro: "美妝教學與節慶主題妝容。",
    region: "新北市",
    languages: ["繁體中文"],
    socials: [{ platform: "Instagram", url: "https://example.com/demo-natsuki-ig", followers: "1 萬–5 萬" }],
    contentTypes: ["美妝", "短影音"],
    styleTags: ["甜美", "清新"],
    shootWilling: "願意",
    cardThemes: ["節慶限定"],
    pastCoop: "虛構彩妝品牌 D 體驗合作（Mock）。",
    materials: [
      { label: "形象照", status: "已備齊" },
      { label: "作品集", status: "已備齊" },
      { label: "卡牌參考素材", status: "審核中" },
    ],
    ruleAckAll: true,
    completeness: 88,
    status: "已核准",
    owner: "營運・小星",
    submittedAt: "2026-09-08 19:44",
    updatedAt: "2026-09-18 09:30",
    logs: [
      { at: "2026-09-08 19:44", by: "申請人", action: "送出申請", note: "" },
      { at: "2026-09-10 11:11", by: "營運・小星", action: "開始審核", note: "" },
      { at: "2026-09-18 09:30", by: "營運・小星", action: "核准", note: "待建立合約 Demo 確認" },
    ],
  },
];

export const applicationById = (id: string) => APPLICATIONS.find((a) => a.id === id);

/** 此 Demo 帳號自己的申請案件 */
export const MY_APPLICATION_ID = "AP-2609-001";

// ── 合作女神名單 Mock ─────────────────────────────────────────
export type PartnerGoddessStatus = "合作中" | "待合約" | "暫停合作" | "合作結束";

export interface PartnerGoddess {
  id: string;
  name: string;
  title: string;
  status: PartnerGoddessStatus;
  publicPage: boolean;
  backstage: "已開通" | "待開通" | "已停用";
  pools: string[];
  cardCount: number;
  contractVersion: string;
  since: string;
  owner: string;
}

export const PARTNER_GODDESSES: PartnerGoddess[] = [
  {
    id: "pg-yoru",
    name: "夜澄",
    title: "星夜的低語者",
    status: "合作中",
    publicPage: true,
    backstage: "已開通",
    pools: ["制服序章", "星光舞台"],
    cardCount: 14,
    contractVersion: "v1.2",
    since: "2026-08-20",
    owner: "營運・Demo 管理員",
  },
  {
    id: "pg-koharu",
    name: "心晴",
    title: "午後的雜談主播",
    status: "合作中",
    publicPage: true,
    backstage: "已開通",
    pools: ["制服序章"],
    cardCount: 6,
    contractVersion: "v1.2",
    since: "2026-08-02",
    owner: "營運・Demo 管理員",
  },
  {
    id: "pg-sara",
    name: "沙羅",
    title: "舞台上的銀色流星",
    status: "待合約",
    publicPage: false,
    backstage: "待開通",
    pools: [],
    cardCount: 0,
    contractVersion: "v1.3（草案）",
    since: "—",
    owner: "營運・Demo 管理員",
  },
  {
    id: "pg-mio",
    name: "澪",
    title: "雨聲裡的旋律",
    status: "暫停合作",
    publicPage: true,
    backstage: "已停用",
    pools: ["夜櫻回憶"],
    cardCount: 5,
    contractVersion: "v1.1",
    since: "2026-05-24",
    owner: "營運・夜班",
  },
  {
    id: "pg-shion",
    name: "紫苑",
    title: "季節限定的訪客",
    status: "合作結束",
    publicPage: false,
    backstage: "已停用",
    pools: ["夜櫻回憶"],
    cardCount: 4,
    contractVersion: "v1.0",
    since: "2026-02-10",
    owner: "營運・小星",
  },
];

export const partnerGoddessById = (id: string) =>
  PARTNER_GODDESSES.find((g) => g.id === id);

export const SUSPEND_DEMO_NOTE =
  "暫停與結束合作僅為 Demo 狀態變更，不會刪除女神資料、卡牌或玩家既有卡冊。";

export const ADMIN_APPLY_TBD = [
  "審核 SLA、補件期限與自動逾期處理：待定",
  "重複申請的判定規則與合併方式：待定",
  "核准後卡池指派與卡牌排程流程：待定",
  "暫停／結束合作後既有卡牌與分潤處理：待定",
  "分潤比例設定：不在此介面提供，依合作合約",
];

/** 極簡社群連結格式檢查（Demo） */
export const isLikelyUrl = (v: string) => /^https?:\/\/[^\s]+\.[^\s]+$/.test(v.trim());
