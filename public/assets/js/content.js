const API_TRACK = "/api/track"; // Worker/Function endpoint (D1 analytics)
const PAYPAL_CONFIG = {
  clientId: "YOUR_PAYPAL_CLIENT_ID" // editable via dashboard/env later
};

async function loadContent() {
  const res = await fetch("/content/site.json");
  const data = await res.json();

  // Home page sections
  if (document.getElementById("page-home")) {
    renderHero(data.hero);
    renderAbout(data.about);
    renderFeatured(data.featured);
    renderTrailer(data.trailer);
    renderEmail(data.email);
    renderPreorder(data.preorder);
    renderComing(data.coming);
    renderContact(data.contact);
  }

  // Projects page
  if (document.getElementById("page-projects")) {
    renderProjects(data.projects);
  }

  // Other pages can use data.about, data.contact, etc. as needed

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  trackPageView();
}

/* ANALYTICS */
function trackPageView() {
  sendEvent("pageview", {
    page: window.location.pathname,
    referrer: document.referrer || null
  });
}

function trackVideoPlay(projectId) {
  sendEvent("video_play", {
    page: window.location.pathname,
    projectId
  });
}

function trackPurchaseClick(projectId) {
  sendEvent("purchase_click", {
    page: window.location.pathname,
    projectId
  });
}

function sendEvent(event_type, extra = {}) {
  try {
    fetch(API_TRACK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type,
        page: window.location.pathname,
        referrer: document.referrer || null,
        ...extra
      })
    });
  } catch (e) {
    // fail silently
  }
}

/* HOME RENDERERS (same as before) */
function renderHero(hero) {
  const el = document.getElementById("home-hero");
  if (!el) return;
  el.innerHTML = `
    <h1>${hero.title}</h1>
    <p>${hero.subtitle}</p>
  `;
}

function renderAbout(about) {
  const el = document.getElementById("home-about");
  if (!el) return;
  el.innerHTML = `
    <h2>${about.title}</h2>
    <p>${about.text}</p>
  `;
}

function renderFeatured(featured) {
  const el = document.getElementById("home-featured");
  if (!el) return;
  el.innerHTML = `<h2>${featured.title}</h2>`;
  featured.items.forEach(item => {
    el.innerHTML += `
      <div class="item">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
      </div>
    `;
  });
}

function renderTrailer(trailer) {
  const el = document.getElementById("home-trailer");
  if (!el) return;
  el.innerHTML = `
    <h2>${trailer.title}</h2>
    <iframe src="${trailer.embed}" allowfullscreen></iframe>
  `;
}

function renderEmail(email) {
  const el = document.getElementById("home-email");
  if (!el) return;
  el.innerHTML = `
    <h2>${email.title}</h2>
    <input id="email-input" type="email" placeholder="Your email" />
    <button id="email-submit">${email.button}</button>
  `;
}

function renderPreorder(preorder) {
  const el = document.getElementById("home-preorder");
  if (!el) return;
  el.innerHTML = `
    <h2>${preorder.title}</h2>
    <p>${preorder.text}</p>
    <a href="${preorder.link}" class="btn btn-preorder">${preorder.button}</a>
  `;
}

function renderComing(coming) {
  const el = document.getElementById("home-coming");
  if (!el) return;
  el.innerHTML = `
    <h2>${coming.title}</h2>
    <p>${coming.text}</p>
  `;
}

function renderContact(contact) {
  const el = document.getElementById("home-contact");
  if (!el) return;
  el.innerHTML = `
    <h2>${contact.title}</h2>
    <p>${contact.email}</p>
    <p>${contact.phone}</p>
  `;
}

/* PROJECTS PAGE RENDERER */
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
        <div class="project-video-wrapper">
          <iframe
            src="${project.video}"
            data-project-id="${project.id}"
            allowfullscreen
          ></iframe>
        </div>
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
          <a
            href="${project.detailsUrl}"
            class="btn btn-details"
          >
            More About This Book
          </a>
        </div>
      </div>
    `;
    container.appendChild(block);
  });

  // Hook analytics for video + preorder clicks
  hookProjectAnalytics();
}

function hookProjectAnalytics() {
  // Video plays (basic: on iframe click)
  document.querySelectorAll(".project-video-wrapper iframe").forEach(iframe => {
    iframe.addEventListener("click", () => {
      const projectId = iframe.getAttribute("data-project-id");
      trackVideoPlay(projectId);
    });
  });

  // Preorder clicks
  document.querySelectorAll("a[data-preorder='true']").forEach(link => {
    link.addEventListener("click", () => {
      const projectId = link.getAttribute("data-project-id");
      trackPurchaseClick(projectId);
      // PayPal / checkout happens at the link target
    });
  });
}

loadContent();
