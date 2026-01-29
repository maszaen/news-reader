import { NormalizedArticle, mapCategory } from './types.js';
import { storeArticles } from './aggregator.js';

const BASE_URL = 'https://content.guardianapis.com/search';

export async function fetchGuardian() {
  const API_KEY = process.env.GUARDIAN_API_KEY;
  if (!API_KEY) {
    console.warn('⚠️ GUARDIAN_API_KEY not set. Skipping.');
    return;
  }

  try {
    const params = new URLSearchParams({
      'api-key': API_KEY,
      'show-fields': 'headline,trailText,body,thumbnail,byline',
      'page-size': '50',
      'order-by': 'newest'
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    
    const data: any = await response.json();

    if (data.response && data.response.status === 'ok') {
      const articles: NormalizedArticle[] = data.response.results.map((item: any) => ({
        title: item.fields?.headline || item.webTitle,
        summary: item.fields?.trailText || '', // Often HTML
        content: item.fields?.body || '', // Full HTML content!
        url: item.webUrl,
        imageUrl: item.fields?.thumbnail, // High quality usually
        author: item.fields?.byline,
        publishedAt: new Date(item.webPublicationDate),
        sourceId: 'guardian',
        category: mapCategory(item.sectionName, item.webTitle, item.fields?.trailText),
        originalSource: 'The Guardian'
      }));

      await storeArticles('The Guardian', articles);
    }
  } catch (error) {
    console.error('Error fetching Guardian:', error);
  }
}
