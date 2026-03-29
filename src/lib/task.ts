import type { Task } from "@/types";

export function isTaskEffectivelyDone(task: Task): boolean {
  if (task.done) return true;
  if (task.subSteps.length === 0) return false;
  return task.subSteps.every((s) => s.done);
}

export function firstOpenSubStepTitle(task: Task): string {
  const next = task.subSteps.find((s) => !s.done);
  if (next) return next.title;
  if (task.subSteps.length === 0) return task.title;
  return task.title;
}
