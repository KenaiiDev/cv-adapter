import type { Profile } from '../../domain/entities/Profile.js';

export interface ProfileChange {
  path: string;
  before: unknown;
  after: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function collectChanges(
  before: unknown,
  after: unknown,
  currentPath: string,
  changes: ProfileChange[],
): void {
  if (Object.is(before, after)) return;

  if (Array.isArray(before) || Array.isArray(after)) {
    const beforeItems = Array.isArray(before) ? before : [];
    const afterItems = Array.isArray(after) ? after : [];
    const length = Math.max(beforeItems.length, afterItems.length);
    for (let index = 0; index < length; index += 1) {
      collectChanges(
        beforeItems[index],
        afterItems[index],
        `${currentPath}[${index}]`,
        changes,
      );
    }
    return;
  }

  if (isRecord(before) || isRecord(after)) {
    const beforeRecord = isRecord(before) ? before : {};
    const afterRecord = isRecord(after) ? after : {};
    const keys = [
      ...new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]),
    ].sort();
    for (const key of keys) {
      const path = currentPath ? `${currentPath}.${key}` : key;
      collectChanges(beforeRecord[key], afterRecord[key], path, changes);
    }
    return;
  }

  changes.push({ path: currentPath, before, after });
}

export function createProfileDiff(before: Profile, after: Profile): ProfileChange[] {
  const changes: ProfileChange[] = [];
  collectChanges(before, after, '', changes);
  return changes;
}

function formatValue(value: unknown): string {
  return value === undefined ? '<missing>' : JSON.stringify(value);
}

export function formatProfileDiff(changes: ProfileChange[]): string {
  if (changes.length === 0) return 'No profile changes.';

  return [
    'Profile changes:',
    ...changes.map(change => (
      `- ${change.path}: ${formatValue(change.before)} -> ${formatValue(change.after)}`
    )),
  ].join('\n');
}
