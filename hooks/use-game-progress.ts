"use client";

import { useEffect, useMemo, useState } from "react";
import { journeyBlocks, levels, missions, problems } from "@/data/game-data";
import type { BlockId, PillarStatus } from "@/data/game-data";
import { getLocalUnitStorageKey } from "@/lib/unit-storage";

type ProgressState = {
  completedMissions: string[];
  appliedSolutions: string[];
  selectedBlockId: BlockId;
};

const STORAGE_VERSION = "v2";
const LEGACY_STORAGE_KEY = "jornada-comercial-progress-v2";

const initialProgress: ProgressState = {
  completedMissions: [],
  appliedSolutions: [],
  selectedBlockId: "icp"
};

function isBlockId(value: unknown): value is BlockId {
  return typeof value === "string" && journeyBlocks.some((block) => block.id === value);
}

function readProgress(storageKey: string): ProgressState {
  if (typeof window === "undefined") {
    return initialProgress;
  }

  try {
    const stored = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) {
      return initialProgress;
    }

    const parsed = JSON.parse(stored) as Partial<ProgressState> & { selectedPillarId?: string };
    return {
      completedMissions: Array.isArray(parsed.completedMissions) ? parsed.completedMissions : [],
      appliedSolutions: Array.isArray(parsed.appliedSolutions) ? parsed.appliedSolutions : [],
      selectedBlockId: isBlockId(parsed.selectedBlockId)
        ? parsed.selectedBlockId
        : isBlockId(parsed.selectedPillarId)
          ? parsed.selectedPillarId
          : "icp"
    };
  } catch {
    return initialProgress;
  }
}

export function useGameProgress(unitId?: string) {
  const [progress, setProgress] = useState<ProgressState>(initialProgress);
  const [isReady, setIsReady] = useState(false);
  const storageKey = getLocalUnitStorageKey(unitId, "gameProgress", STORAGE_VERSION);

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      const localProgress = readProgress(storageKey);

      if (!unitId) {
        if (isMounted) {
          setProgress(localProgress);
          setIsReady(true);
        }
        return;
      }

      try {
        const response = await fetch(`/api/unit-state?unitId=${encodeURIComponent(unitId)}`);
        const result = await response.json();
        const remoteProgress = result?.data?.gameProgress as Partial<ProgressState> | undefined;

        if (isMounted) {
          setProgress(remoteProgress ? {
            completedMissions: Array.isArray(remoteProgress.completedMissions) ? remoteProgress.completedMissions : [],
            appliedSolutions: Array.isArray(remoteProgress.appliedSolutions) ? remoteProgress.appliedSolutions : [],
            selectedBlockId: isBlockId(remoteProgress.selectedBlockId) ? remoteProgress.selectedBlockId : "icp"
          } : localProgress);
          setIsReady(true);
        }
      } catch {
        if (isMounted) {
          setProgress(localProgress);
          setIsReady(true);
        }
      }
    }

    setIsReady(false);
    void loadProgress();

    return () => {
      isMounted = false;
    };
  }, [storageKey, unitId]);

  useEffect(() => {
    if (isReady) {
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
      if (unitId) {
        void fetch("/api/unit-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitId,
            gameProgress: progress
          })
        }).catch(() => undefined);
      }
    }
  }, [isReady, progress, storageKey, unitId]);

  const completedSet = useMemo(() => new Set(progress.completedMissions), [progress.completedMissions]);
  const solutionsSet = useMemo(() => new Set(progress.appliedSolutions), [progress.appliedSolutions]);

  const blockProgress = journeyBlocks.map((block) => {
    const blockMissions = missions.filter((mission) => mission.blockId === block.id);
    const completed = blockMissions.filter((mission) => completedSet.has(mission.id)).length;
    const percent = blockMissions.length ? Math.round((completed / blockMissions.length) * 100) : 0;
    const icpDone = missions.filter((mission) => mission.blockId === "icp").every((mission) => completedSet.has(mission.id));
    const lockedByIcp = block.id !== "icp" && block.type === "channel" && !icpDone;
    const status: PillarStatus = lockedByIcp ? "locked" : percent === 100 ? "done" : "active";

    return {
      ...block,
      completed,
      total: blockMissions.length,
      percent,
      status
    };
  });

  const missionXp = missions
    .filter((mission) => completedSet.has(mission.id))
    .reduce((sum, mission) => sum + mission.xp, 0);

  const solutionXp = problems.reduce((sum, problem) => {
    const appliedCount = problem.actions.filter((action) => solutionsSet.has(`${problem.id}:${action}`)).length;
    return sum + appliedCount * problem.xp;
  }, 0);

  const totalXp = missionXp + solutionXp;
  const totalPossibleXp =
    missions.reduce((sum, mission) => sum + mission.xp, 0) +
    problems.reduce((sum, problem) => sum + problem.actions.length * problem.xp, 0);
  const generalProgress = totalPossibleXp ? Math.round((totalXp / totalPossibleXp) * 100) : 0;
  const executionPercent = Math.round(blockProgress.reduce((sum, block) => sum + block.percent, 0) / blockProgress.length);

  const currentLevel = [...levels].reverse().find((level) => executionPercent >= level.minPercent) ?? levels[0];
  const nextLevel = levels.find((level) => level.minPercent > currentLevel.minPercent);
  const levelProgress = nextLevel
    ? Math.min(100, Math.round(((executionPercent - currentLevel.minPercent) / (nextLevel.minPercent - currentLevel.minPercent)) * 100))
    : 100;

  const completedMedalBlockIds = blockProgress.filter((block) => block.percent === 100).map((block) => block.id);

  function toggleMission(missionId: string) {
    setProgress((current) => {
      const exists = current.completedMissions.includes(missionId);
      return {
        ...current,
        completedMissions: exists
          ? current.completedMissions.filter((id) => id !== missionId)
          : [...current.completedMissions, missionId]
      };
    });
  }

  function toggleSolution(problemId: string, action: string) {
    const key = `${problemId}:${action}`;
    setProgress((current) => {
      const exists = current.appliedSolutions.includes(key);
      return {
        ...current,
        appliedSolutions: exists
          ? current.appliedSolutions.filter((id) => id !== key)
          : [...current.appliedSolutions, key]
      };
    });
  }

  function selectBlock(blockId: BlockId) {
    setProgress((current) => ({ ...current, selectedBlockId: blockId }));
  }

  return {
    ...progress,
    completedSet,
    solutionsSet,
    currentLevel,
    nextLevel,
    totalXp,
    totalPossibleXp,
    generalProgress,
    executionPercent,
    levelProgress,
    blockProgress,
    completedMedalBlockIds,
    toggleMission,
    toggleSolution,
    selectBlock
  };
}
