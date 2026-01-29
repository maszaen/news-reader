
async function main() {
  try {
    const res = await fetch('http://localhost:8000/api/categories');
    const data = await res.json();
    console.log('Categories Response:', JSON.stringify(data, null, 2));
  } catch (e) {
      console.error(e);
  }
}
main();
