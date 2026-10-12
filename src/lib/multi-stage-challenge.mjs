import { previewThemeJourney } from "./theme-journey.mjs";
export function previewMultiStage(owner, catalogue) {
  const journey = previewThemeJourney(owner, catalogue);
  if (!journey) return null;
  const selected = journey.chapters.length > 0;
  const acquired = selected && journey.chapters.some((c) => c.owned > 0);
  const complete = acquired && journey.chapters.every((c) => c.complete);
  return {
    status: "local-preview",
    ruleVersion: "multi-stage-challenge-preview-v1",
    paused: owner.profile.data.journeyPaused === true,
    catalogueVersion: journey.catalogueVersion,
    rewards: false,
    stages: [
      { id: "select", met: selected, prerequisite: null },
      { id: "acquire", met: acquired, prerequisite: "select" },
      { id: "complete", met: complete, prerequisite: "acquire" },
    ],
    reason: selected
      ? complete
        ? "current-complete"
        : acquired
          ? "distinct-designs-remain"
          : "no-current-acquisition"
      : "no-current-selected-album",
  };
}
