document.getElementById("app").innerHTML = `
  <h1>Product Search</h1>
  <input type="text" id="search" placeholder="Search for a product" />
  <button onclick="search()">Search</button>
  <pre id="output"></pre>
`;

window.search = async function () {
  const query = document.getElementById("search").value;
  const res = await fetch(`https://comparley-backend.onrender.com/api/ebay-search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  document.getElementById("output").textContent = JSON.stringify(data, null, 2);
}
