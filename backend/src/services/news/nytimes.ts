import { NormalizedArticle, mapCategory } from './types.js';
import { storeArticles } from './aggregator.js';

const BASE_URL = 'https://api.nytimes.com/svc/topstories/v2/home.json';

export async function fetchNYT() {
  const API_KEY = process.env.NYT_API_KEY;
  if (!API_KEY) {
    console.warn('⚠️ NYT_API_KEY not set. Skipping.');
    return;
  }

  console.log('📰 Fetching The New York Times...');

  try {
    // 500 requests/day limit.
    // Fetching every 5 mins = 288 requests/day. Safe.
    
    const url = `${BASE_URL}?api-key=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (response.status === 429) {
      console.warn('NYT Rate Limited.');
      return;
    }
    if (!response.ok) throw new Error(`Status ${response.status}`);
    
    const data: any = await response.json();

    if (data.status === 'OK' && Array.isArray(data.results)) {
      const articles: NormalizedArticle[] = data.results
        .filter((item: any) => item.title && item.url)
        .map((item: any) => {
          // NYT Multimedia is an array. Find best image (usually 'superJumbo' or first)
          const image = item.multimedia?.find((m: any) => m.format === 'Super Jumbo') || item.multimedia?.[0];

          return {
            title: item.title,
            summary: item.abstract || '',
            content: item.abstract || '', // NYT often only gives abstract via API, requiring scraping for full text. Sticking to abstract for safety.
            url: item.url,
            imageUrl: image?.url || null,
            author: item.byline?.replace(/^By /, '') || 'The New York Times',
            publishedAt: new Date(item.published_date),
            sourceId: 'nytimes',
            // NYT provides 'section' and 'subsection'. Use them for categorization.
            category: mapCategory(item.section, item.title, item.abstract),
            originalSource: 'The New York Times'
          };
        });

      await storeArticles('The New York Times', articles);
    }
  } catch (error) {
    console.error('Error fetching NYT:', error);
  }
}
