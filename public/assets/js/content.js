async function loadSite() {
  const res = await fetch("/content/site.json");
  const data = await res.json();

  document.getElementById("year").textContent = new Date().getFullYear();
  document.querySelectorAll("#nav-studio-name").forEach(el => el.textContent = data.studioName);

  if (document.getElementById("page-home")) renderHome(data);
  if (document.getElementById("page-about")) renderAbout(data);
  if (document.getElementById("page-projects")) renderProjects(data);
  if (document.getElementById("page-preorder")) renderPreorder(data);
  if (document.getElementById("page-contact")) renderContact(data);
}

/* HOME */
function renderHome(d) {
  const h = d.homePage;
  const b = d.bamn;

  document.getElementById("home-hero").innerHTML = `
    <div class="hero-bg" style="background-image:url('${b.heroImage}')"></div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1>${h.heroHeadline}</h1>
      <p>${h.heroSubtext}</p>
      <div class="btn-row">
        <a href="#home-trailer" class="btn primary">Watch Trailer</a>
        <a href="preorder.html" class="btn red">Pre Order Now</a>
      </div>
    </div>
  `;

  document.getElementById("home-about").innerHTML = `
    <h2>About Levy Media Studios</h2>
    <p>${h.aboutText}</p>
  `;

  document.getElementById("home-featured").innerHTML = `
    <h2>${b.title}</h2>
    <div class="featured-box">
      <img src="${b.coverImage}" />
      <div>
        <p>${b.shortDescription}</p>
        <div class="btn-row">
          <a href="#home-trailer" class="btn primary">Watch Trailer</a>
          <a href="preorder.html" class="btn red">Pre Order</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById("home-trailer").innerHTML = `
    <h2>Trailer</h2>
    <div class="trailer-wrap">
      <iframe src="${b.trailerUrl}" frameborder="0" allowfullscreen></iframe>
    </div>
  `;

  document.getElementById("home-email").innerHTML = `
    <h2>${h.emailHeadline}</h2>
    <p>${h.emailSubtext}</p>
    <form class="email-form">
      <input type="text" placeholder="Name" required />
      <input type="email" placeholder="Email" required />
      <button class="btn red">Join Now</button>
    </form>
  `;

  document.getElementById("home-preorder").innerHTML = `
    <h2>${h.preorderHeadline}</h2>
    <p>${h.preorderSubtext}</p>
    <img src="${b.coverImage}" class="preorder-img" />
    <a href="${b.preorderUrl}" class="btn red" target="_blank">Pre Order Now</a>
  `;

  document.getElementById("home-coming").innerHTML = `<p>${h.comingSoonText}</p>`;
  document.getElementById("home-contact").innerHTML = `
    <p>${h.contactText}</p>
    <a href="contact.html" class="btn primary">Contact Us</a>
  `;
}

/* ABOUT */
function renderAbout(d) {
  const a = d.aboutPage;

  document.getElementById("about-company").innerHTML = `
    <h1>About</h1>
    <p>${a.company}</p>
  `;

  document.getElementById("about-mission").innerHTML = `
    <h2>Mission</h2>
    <p>${a.mission}</p>
  `;

  document.getElementById("about-vision").innerHTML = `
    <h2>Vision</h2>
    <p>${a.vision}</p>
  `;

  document.getElementById("about-founder").innerHTML = `
    <h2>Founder</h2>
    <p>${a.founder}</p>
  `;
}

/* PROJECTS */
function renderProjects(d) {
  const list = d.projectsPage.projects.map(p => `
    <div class="project-card">
      <img src="${p.image}" />
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <div class="btn-row">
        <a href="${p.trailerUrl}" class="btn primary" target="_blank">Watch Trailer</a>
        <a href="${p.preorderUrl}" class="btn red" target="_blank">Pre Order</a>
      </div>
    </div>
  `).join("");

  document.getElementById("projects-list").innerHTML = `
    <h1>Projects</h1>
    <div class="projects-grid">${list}</div>
  `;
}

/* PREORDER */
function renderPreorder(d) {
  const p = d.preorderPage;
  const b = d.bamn;

  document.getElementById("preorder-main").innerHTML = `
    <h1>${p.title}</h1>
    <img src="${b.coverImage}" class="preorder-img-lg" />
    <p>${p.description}</p>
    <a href="${b.preorderUrl}" class="btn red" target="_blank">Pre Order Now</a>
  `;

  document.getElementById("preorder-email").innerHTML = `
    <h2>${p.emailHeadline}</h2>
    <p>${p.emailSubtext}</p>
    <form class="email-form">
      <input type="text" placeholder="Name" required />
      <input type="email" placeholder="Email" required />
      <button class="btn red">Join Now</button>
    </form>
  `;
}

/* CONTACT */
function renderContact(d) {
  const c = d.contactPage;

  document.getElementById("contact-form-section").innerHTML = `
    <h1>${c.headline}</h1>
    <p>${c.subtext}</p>
    <form class="contact-form">
      <input type="text" placeholder="Name" required />
      <input type="email" placeholder="Email" required />
      <input type="text" placeholder="Subject" required />
      <textarea rows="5" placeholder="Message" required></textarea>
      <button class="btn red">Send Message</button>
    </form>
  `;
}

document.addEventListener("DOMContentLoaded", loadSite);
