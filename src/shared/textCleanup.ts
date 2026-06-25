export function cleanNoteDisplayText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/(?:\d{4}-\d{2}-\d{2}|\d{1,2}-\d{1,2})\d*$/u, "")
    .replace(/[赞藏评]\s*\d+(?:\.\d+)?(?:万|k|w)?/giu, "")
    .trim();
}
