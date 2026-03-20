/**
 * Fisher-Yates shuffle – returns a new shuffled array (does not mutate input).
 */
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Truncate a string to maxLength and append ellipsis if needed.
 */
export function truncate(str, maxLength = 55) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "…";
}
