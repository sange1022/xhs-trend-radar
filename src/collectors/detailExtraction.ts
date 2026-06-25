export function extractTopicsFromDetailText(text: string) {
  return [...text.matchAll(/#([\p{Script=Han}\w-]{2,30})/gu)]
    .map((match) => match[1].trim())
    .filter(Boolean)
    .filter((topic, index, topics) => topics.indexOf(topic) === index)
    .slice(0, 12);
}

export function mergeTopics(existing: string[], precise: string[]) {
  return [...new Set([...precise, ...existing])].slice(0, 12);
}
