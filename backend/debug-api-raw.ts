
// require('dotenv').config();

async function debugAPIs() {
  console.log('🔍 Debugging News APIs Raw Output...\n');

  // 1. Guardian
  const GUARDIAN_KEY = process.env.GUARDIAN_API_KEY;
  if (GUARDIAN_KEY) {
      console.log('-------- THE GUARDIAN --------');
      try {
          const url = `https://content.guardianapis.com/search?api-key=${GUARDIAN_KEY}&show-fields=all&page-size=1`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.response && data.response.results && data.response.results.length > 0) {
              const item = data.response.results[0];
              console.log('Title:', item.webTitle);
              console.log('Section:', item.sectionName);
              console.log('Content Length:', item.fields?.body?.length || 0);
              console.log('Content Preview:', (item.fields?.body || '').substring(0, 100));
          } else {
              console.log('No results.');
          }
      } catch (e) { console.error('Error:', e.message); }
  }

  console.log('\n');

  // 2. NYT
  const NYT_KEY = process.env.NYT_API_KEY;
  if (NYT_KEY) {
      console.log('-------- NYT --------');
      try {
          const url = `https://api.nytimes.com/svc/topstories/v2/home.json?api-key=${NYT_KEY}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.results && data.results.length > 0) {
              const item = data.results[0];
              console.log('Title:', item.title);
              console.log('Section:', item.section);
              console.log('Subsection:', item.subsection);
              console.log('Abstract:', item.abstract);
              console.log('Keys available:', Object.keys(item));
              // Check for content/body
              console.log('Has explicit content?', !!item.content);
              console.log('Has explicit body?', !!item.body);
          } else {
              console.log('No results.');
          }
      } catch (e) { console.error('Error:', e.message); }
  }
}

debugAPIs();
