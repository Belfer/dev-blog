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
  if (!input) return;

  const posts = await loadSearchIndex();
  const container = document.createElement("div");
  container.className = "list-group mt-3";

  input.parentNode.appendChild(container);

  input.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    if (query.length < 2) {
      container.innerHTML = "";
      return;
    }

    const results = searchPosts(query, posts);

    container.innerHTML = results.map(post => `
      <a href="${post.url}" class="list-group-item list-group-item-action">
        <strong>${post.title}</strong><br>
        <small class="text-muted">${post.date}</small>
      </a>
    `).join("");
  });
});