document.addEventListener("DOMContentLoaded", async () => {

  const searchInput = document.getElementById("blogSearch");
  if (!searchInput) return; // only run on blogs page

  const res = await fetch("/search.json");
  const posts = await res.json();

  const container = document.createElement("div");
  container.className = "search-results";

  searchInput.parentNode.style.position = "relative";
  searchInput.parentNode.appendChild(container);

  function matches(post, query) {
    const q = query.toLowerCase();

    return (
      post.title.toLowerCase().includes(q) ||
      (post.excerpt || "").toLowerCase().includes(q) ||
      (post.tags || []).join(" ").toLowerCase().includes(q)
    );
  }

  function render(results) {
    container.innerHTML = results.map(post => `
      <a href="${post.url}" class="search-item">
        <div>${post.title}</div>
        <small>${post.date}</small>
      </a>
    `).join("");
  }

  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.trim();

    if (q.length < 2) {
      container.innerHTML = "";
      return;
    }

    const results = posts.filter(p => matches(p, q));
    render(results);
  });

});