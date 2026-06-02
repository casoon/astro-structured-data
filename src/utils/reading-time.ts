/**
 * Helper to calculate word count and reading time from a text string.
 */
export function calculateReadingTime(text: string, wordsPerMinute: number = 200) {
  if (!text || typeof text !== 'string') {
    return {
      wordCount: 0,
      readingTimeMinutes: 0,
      timeRequired: 'PT0M',
    };
  }

  // Basic HTML tag stripping
  const cleanText = text.replace(/<[^>]*>/g, ' ');

  // Split by whitespace and filter empty items
  const words = cleanText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  const timeRequired = `PT${readingTimeMinutes}M`;

  return {
    wordCount,
    readingTimeMinutes,
    timeRequired,
  };
}
