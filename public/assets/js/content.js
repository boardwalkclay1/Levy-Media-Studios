async function loadContent() {
  const res = await fetch("/content/site.json");
  const data = await res.json();

  // PROJECTS PAGE
  if (document.getElementById("page-projects")) {
    renderProjects(data.projects);
  }

  // YEAR FOOTER
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* PROJECTS RENDERER */
function renderProjects(projects) {
  const container = document.getElementById("projects-list");
  if (!container || !projects || !projects.items) return;

  container.innerHTML = "";

  projects.items.forEach(project => {
    const block = document.createElement("div");
    block.className = "project-block";

    block.innerHTML = `
      <div class="project-main">
        <h2>${project.title}</h2>
        <iframe
          src="${project.video}"
          allowfullscreen
          data-project-id="${project.id}"
        ></iframe>
      </div>

      <div class="project-side">
        <img src="${project.cover}" alt="${project.title} Cover" />
        <h3>${project.title}</h3>
        <div class="project-price">${project.price}</div>

        <div class="project-actions">
          <a
            href="${project.preorderUrl}"
            class="btn btn-preorder"
            data-project-id="${project.id}"
            data-preorder="true"
          >
            Pre Order
          </a>

          <a href="${project.detailsUrl}" class="btn btn-details">
            More About This Book
          </a>
        </div>
      </div>
    `;

    container.appendChild(block);
  });

  hookProjectAnalytics();
}

/* ANALYTICS HOOKS */
function hookProjectAnalytics() {
  // Video plays
  document.querySelectorAll("iframe[data-project-id]").forEach(iframe => {
    iframe.addEventListener("click", () => {
      const id = iframe.getAttribute("data-project-id");
      sendEvent("video_play", { projectId: id });
    });
  });

  // Preorder clicks
  document.querySelectorAll("a[data-preorder='true']").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-project-id");
      sendEvent("purchase_click", { projectId: id });
    });
  });
}

/* SEND ANALYTICS */
function sendEvent(event_type, extra = {}) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "event",
      event_type,
      page: window.location.pathname,
      extra
    })
  });
}

loadContent();
