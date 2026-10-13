/**
 * Breaks a slogan over at most two lines for a lit sign. A short one stays on one line; a longer
 * one is split at the sentence break nearest the middle, or at the word nearest the middle when
 * there is none, so "Your career starts here. Practice interviews with AI." reads as two sentences.
 */
export function sloganLines(text: string, maxLine = 34): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxLine) return [trimmed];
  const middle = trimmed.length / 2;
  const nearest = (indexes: number[]) =>
    indexes.reduce<number | null>(
      (best, i) => (best === null || Math.abs(i - middle) < Math.abs(best - middle) ? i : best),
      null,
    );
  const spaces = [...trimmed.matchAll(/ /g)].map((m) => m.index!);
  const sentenceEnds = spaces.filter((i) => /[.!?]/.test(trimmed[i - 1] ?? ''));
  const at = nearest(sentenceEnds) ?? nearest(spaces);
  if (at === null) return [trimmed];
  return [trimmed.slice(0, at), trimmed.slice(at + 1)];
}
