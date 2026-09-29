import { useContent } from "@/lib/content-store";

export function PoolDescription({ poolId }: { poolId: string }) {
  return <>{useContent().poolDescription(poolId)}</>;
}
export function LeaderboardNote() {
  return <>{useContent().leaderboardNote}</>;
}
