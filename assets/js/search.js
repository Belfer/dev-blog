async function loadSearchIndex() {
  const res = await fetch('/search.json');
  return await res.json();
}

function normalize(str) {
  return str.toLowerCase();
}

function searchPosts(query, posts) {
  query = normalize(query);

  return posts.filter(post => {
    return (
      normalize(post.title).includes(query) ||
      normalize(post.excerpt || "").includes(query) ||
      (post.tags || []).join(" ").includes(query)
    );
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const input = document.querySelector("input[type='search']");
  const container = document.createElement("div");
  container.className = "list-group position-absolute w-100 shadow";

  if (!input) return;

  input.parentNode.style.position = "relative";
  input.parentNode.appendChild(container);

  const res = await fetch("/dev-blog/search.json");
  const posts = await res.json();

  function search(query) {
    query = query.toLowerCase();

    return posts.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.excerpt.toLowerCase().includes(query) ||
      (p.tags || []).join(" ").includes(query)
    );
  }

  input.addEventListener("input", (e) => {
    const q = e.target.value.trim();

    if (q.length < 2) {
      container.innerHTML = "";
      return;
    }

    const results = search(q);

    container.innerHTML = results.map(post => `
      <a href="${post.url}" class="list-group-item list-group-item-action bg-dark text-light border-secondary">
        <div class="fw-bold">${post.title}</div>
        <small class="text-muted">${post.date}</small>
      </a>
    `).join("");
  });
});