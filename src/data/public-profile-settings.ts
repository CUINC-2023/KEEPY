/**
 * 公開收藏頁設定共用資料層（Local Mock）。
 * /app/settings/privacy 寫入，/collectors/demo-player 唯讀。
 * 只保存在此瀏覽器 localStorage，不代表帳號同步或伺服器儲存。
 */

export const PUBLIC_PROFILE_KEY = "pf-public-profile-settings-v1";

export const DISPLAY_NAME_MAX = 24;
export const BIO_MAX = 120;

export interface PublicProfileSettings {
  isPublic: boolean;
  displayName: string;
  bio: string;
  showRanking: boolean;
  showCollectionStats: boolean;
  showRecentAchievements: boolean;
  showPhysicalCollection: boolean;
}

export const DEFAULT_PUBLIC_PROFILE: PublicProfileSettings = {
  isPublic: true,
  displayName: "橘子收藏家",
  bio: "喜歡收藏創作者每個閃耀瞬間，也享受慢慢完成每一本主題卡冊。",
  showRanking: true,
  showCollectionStats: true,
  showRecentAchievements: true,
  showPhysicalCollection: true,
};

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

/** 名稱／介紹驗證錯誤訊息；null 代表合法。 */
export function displayNameError(value: string): string | null {
  const v = value.trim();
  if (v.length < 1) return "公開顯示名稱不可空白。";
  if (v.length > DISPLAY_NAME_MAX) return `公開顯示名稱最多 ${DISPLAY_NAME_MAX} 字，目前 ${v.length} 字。`;
  return null;
}

export function bioError(value: string): string | null {
  const v = value.trim();
  if (v.length > BIO_MAX) return `收藏家介紹最多 ${BIO_MAX} 字，目前 ${v.length} 字。`;
  return null;
}

/** 欄位級修復：缺欄、非法值、舊資料、JSON 損壞都回落到預設值。 */
export function readPublicProfile(): PublicProfileSettings {
  try {
    const raw = localStorage.getItem(PUBLIC_PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PUBLIC_PROFILE };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_PUBLIC_PROFILE };
    }
    const o = parsed as Record<string, unknown>;
    const rawName = typeof o["displayName"] === "string" ? (o["displayName"] as string).trim() : "";
    const rawBio = typeof o["bio"] === "string" ? (o["bio"] as string).trim() : null;
    return {
      isPublic: bool(o["isPublic"], DEFAULT_PUBLIC_PROFILE.isPublic),
      displayName:
        rawName.length >= 1 && rawName.length <= DISPLAY_NAME_MAX
          ? rawName
          : DEFAULT_PUBLIC_PROFILE.displayName,
      bio: rawBio !== null && rawBio.length <= BIO_MAX ? rawBio : DEFAULT_PUBLIC_PROFILE.bio,
      showRanking: bool(o["showRanking"], DEFAULT_PUBLIC_PROFILE.showRanking),
      showCollectionStats: bool(o["showCollectionStats"], DEFAULT_PUBLIC_PROFILE.showCollectionStats),
      showRecentAchievements: bool(o["showRecentAchievements"], DEFAULT_PUBLIC_PROFILE.showRecentAchievements),
      showPhysicalCollection: bool(o["showPhysicalCollection"], DEFAULT_PUBLIC_PROFILE.showPhysicalCollection),
    };
  } catch {
    return { ...DEFAULT_PUBLIC_PROFILE };
  }
}

export function writePublicProfile(next: PublicProfileSettings) {
  try {
    localStorage.setItem(
      PUBLIC_PROFILE_KEY,
      JSON.stringify({
        ...next,
        displayName: next.displayName.trim(),
        bio: next.bio.trim(),
      })
    );
  } catch {
    /* 僅此瀏覽器偏好，寫入失敗時忽略 */
  }
}
