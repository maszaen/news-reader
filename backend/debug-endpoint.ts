
async function main() {
  try {
    const res = await fetch('http://localhost:8000/api/articles?limit=5');
    const data = await res.json();
    console.log('API Response Sample:');
    if (data.articles) {
        data.articles.forEach((a, i) => {
            console.log(`[${i}] Title: ${a.title.substring(0, 30)}...`);
            console.log(`     Category Field: "${a.category}"`);
            console.log(`     Feed Category: "${a.feed?.category}"`);
        });
    } else {
        console.log('No articles found or wrong format', Object.keys(data));
    }
  } catch (e) {
      console.error(e);
  }
}
main();
