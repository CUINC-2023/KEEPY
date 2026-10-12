import { Ctx, PartnerCtx, ApplyDraft } from "./partner-store-shared";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  APPLICATIONS,
  MY_APPLICATION_ID,
  type Application,
  type ApplicationStatus,
} from "@/data/partner";

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

const nowLabel = () => new Date().toLocaleString("zh-TW", { hour12: false }).replace(/\//g, "-");

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, Partial<Application>>>({});
  const [myStatus, setMyStatus] = useState<ApplicationStatus>("草稿");
  const [contractConfirmed, setContractConfirmed] = useState(false);
  const [draft, setDraft] = useState<ApplyDraft>(EMPTY_DRAFT);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const applications = useMemo(
    () => APPLICATIONS.map((a) => ({ ...a, ...(overrides[a.id] ?? {}) })),
    [overrides],
  );

  const byId = useCallback((id: string) => applications.find((a) => a.id === id), [applications]);

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
