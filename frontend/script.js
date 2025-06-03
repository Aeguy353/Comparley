async function search() {
  const query = document.getElementById("search-input").value;
  const results = document.getElementById("results");
  results.innerHTML = "<p>Loading...</p>";

  const [cj, ebay] = await Promise.all([
    fetch("https://comparley-backend.onrender.com/api/cj-search?q=" + encodeURIComponent(query)).then(res => res.json()),
    fetch("https://comparley-backend.onrender.com/api/ebay-search?q=" + encodeURIComponent(query)).then(res => res.json())
  ]);

  const allResults = [...cj, ...ebay];
  results.innerHTML = allResults.map(item => `
    <div class="card">
      <h3>${item.title}</h3>
      <img src="${item.image}" width="100" />
      <p><strong>${item.price ? "$" + item.price : "Price: -"}</strong></p>
      <p>Shipping: ${item.shipping}</p>
      <a href="${item.link}" target="_blank">View</a>
    </div>
  `).join("");
}
