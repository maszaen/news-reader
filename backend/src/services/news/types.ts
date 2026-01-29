export interface NormalizedArticle {
  title: string;
  summary: string;
  content?: string;
  url: string;
  imageUrl?: string;
  author?: string;
  publishedAt: Date;
  sourceId: string; // "guardian", "newsapi", "gnews"
  category: string; // Unified category (news, tech, sports, etc.)
  originalSource: string; // e.g., "BBC News", "The Guardian"
}

export type NewsCategory = 'news' | 'technology' | 'business' | 'sports' | 'entertainment' | 'health' | 'science';

export const CATEGORY_MAPPING: Record<string, NewsCategory> = {
  general: 'news',
  world: 'news',
  nation: 'news',
  technology: 'technology',
  tech: 'technology',
  business: 'business',
  finance: 'business',
  sports: 'sports',
  sport: 'sports',
  entertainment: 'entertainment',
  arts: 'entertainment',
  lifestyle: 'entertainment',
  health: 'health',
  science: 'science',
  opinion: 'news',
  politics: 'news'
};

// Keywords for auto-categorization based on title/content
const KEYWORD_MAPPING: Record<string, string[]> = {
  technology: ['crypto', 'bitcoin', ' AI ', 'artificial intelligence', 'chatgpt', 'openai', 'apple', 'google', 'microsoft', 'meta', 'tech', 'software', 'hardware', 'app', 'iphone', 'android', 'samsung', 'nvidia', 'musk', 'twitter', 'x.com'],
  business: ['stock', 'market', 'economy', 'inflation', 'bank', 'fed', 'treasury', 'recession', 'currency', 'trade', 'ceo', 'startup', 'ipo', 'business', 'finance', 'revenue', 'profit'],
  sports: ['football', 'soccer', 'nba', 'nfl', 'mlb', 'nhl', 'messi', 'ronaldo', 'lakers', 'warriors', 'team', 'coach', 'score', 'championship', 'tournament', 'cup', 'olympic', 'medal', 'race', 'f1'],
  entertainment: ['movie', 'film', 'cinema', 'actor', 'actress', 'hollywood', 'netflix', 'disney', 'marvel', 'star wars', 'concert', 'song', 'music', 'album', 'celebrity', 'oscars', 'grammy', 'award'],
  health: ['cancer', 'virus', 'covid', 'vaccine', 'health', 'diet', 'nutrition', 'doctor', 'hospital', 'disease', 'mental health', 'workout', 'fitness'],
  science: ['nasa', 'space', 'moon', 'mars', 'rocket', 'planet', 'climate', 'global warming', 'fossil', 'energy', 'solar', 'research', 'scientist', 'physics', 'biology', 'chemistry'],
};

export function mapCategory(input: string, title: string = '', summary: string = ''): string {
  const combined = (input + ' ' + title + ' ' + summary).toLowerCase();

  // 1. Check explicit mapping first (priority)
  for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
    if (input.toLowerCase().includes(key)) return value;
  }

  // 2. Check keywords in title/summary
  for (const [cat, keywords] of Object.entries(KEYWORD_MAPPING)) {
    if (keywords.some(k => combined.includes(k.toLowerCase()))) {
      return cat;
    }
  }

  return 'news';
}
