import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  APPLICATIONS,
  MY_APPLICATION_ID,
  type Application,
  type ApplicationStatus,
  type ReviewLogEntry,
} from "@/data/partner";

/**
 * 合作申請的本地 Mock 狀態：申請進度、審核操作與女神身分開通。
 * 僅存在於瀏覽器記憶體，重新整理即回到初始 Mock，不連接任何後端。
 */

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

const EMPTY_DRAFT: ApplyDraft = {
  stageName: "",
  displayName: "",
  intro: "",
  region: "",
  languages: [],
  socials: {},
  followers: {},
  contentTypes: [],
  styleTags: [],
  shootWilling: "",
  cardThemes: [],
  pastCoop: "",
  materialsReady: [],
  ruleAcks: [],
};

interface PartnerCtx {
  /** 申請案件（含審核操作後的 Mock 覆寫）*/
  applications: Application[];
  byId: (id: string) => Application | undefined;
  /** 審核操作（Demo，只改本地狀態）*/
  review: (
    id: string,
    status: ApplicationStatus,
    log: Omit<ReviewLogEntry, "at"> & { at?: string },
    extra?: Partial<Application>
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

const Ctx = createContext<PartnerCtx | null>(null);

export function usePartner() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePartner 必須在 PartnerProvider 內使用");
  return v;
}

const nowLabel = () =>
  new Date().toLocaleString("zh-TW", { hour12: false }).replace(/\//g, "-");

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, Partial<Application>>>({});
  const [myStatus, setMyStatus] = useState<ApplicationStatus>("草稿");
  const [contractConfirmed, setContractConfirmed] = useState(false);
  const [draft, setDraft] = useState<ApplyDraft>(EMPTY_DRAFT);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const applications = useMemo(
    () => APPLICATIONS.map((a) => ({ ...a, ...(overrides[a.id] ?? {}) })),
    [overrides]
  );

  const byId = useCallback(
    (id: string) => applications.find((a) => a.id === id),
    [applications]
  );

  const review = useCallback<PartnerCtx["review"]>((id, status, log, extra) => {
    setOverrides((prev) => {
      const base = APPLICATIONS.find((a) => a.id === id);
      const current = { ...base, ...(prev[id] ?? {}) } as Application;
      const at = log.at ?? nowLabel();
      return {
        ...prev,
        [id]: {
          ...(prev[id] ?? {}),
          ...extra,
          status,
          updatedAt: at,
          logs: [...(current.logs ?? []), { ...log, at }],
        },
      };
    });
    if (id === MY_APPLICATION_ID) setMyStatus(status);
  }, []);

  const updateDraft = useCallback((patch: Partial<ApplyDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDraftSavedAt(nowLabel());
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setDraftSavedAt(null);
  }, []);

  const confirmContract = useCallback(() => {
    setContractConfirmed(true);
    setMyStatus("女神身分已開通");
  }, []);

  return (
    <Ctx.Provider
      value={{
        applications,
        byId,
        review,
        myApplicationId: MY_APPLICATION_ID,
        myStatus,
        setMyStatus,
        contractConfirmed,
        confirmContract,
        draft,
        updateDraft,
        draftSavedAt,
        resetDraft,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
