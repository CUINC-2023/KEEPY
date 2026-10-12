import { createContext, useContext } from "react";
import { type Application, type ApplicationStatus, type ReviewLogEntry } from "@/data/partner";

export interface ApplyDraft {
  stageName: string;
  displayName: string;
  intro: string;
  region: string;
  languages: string[];
  socials: Record<string, string>;
  followers: Record<string, string>;
  contentTypes: string[];
  styleTags: string[];
  shootWilling: string;
  cardThemes: string[];
  pastCoop: string;
  materialsReady: string[];
  ruleAcks: string[];
}

export interface PartnerCtx {
  /** 申請案件（含審核操作後的 Mock 覆寫）*/
  applications: Application[];
  byId: (id: string) => Application | undefined;
  /** 審核操作（Demo，只改本地狀態）*/
  review: (
    id: string,
    status: ApplicationStatus,
    log: Omit<ReviewLogEntry, "at"> & { at?: string },
    extra?: Partial<Application>,
  ) => void;
  /** 我的申請 */
  myApplicationId: string;
  myStatus: ApplicationStatus;
  setMyStatus: (s: ApplicationStatus) => void;
  contractConfirmed: boolean;
  confirmContract: () => void;
  /** 表單草稿（自動儲存 Demo）*/
  draft: ApplyDraft;
  updateDraft: (patch: Partial<ApplyDraft>) => void;
  draftSavedAt: string | null;
  resetDraft: () => void;
}

export const Ctx = createContext<PartnerCtx | null>(null);

export function usePartner() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePartner 必須在 PartnerProvider 內使用");
  return v;
}
