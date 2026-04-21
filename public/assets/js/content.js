// Load JSON content
async function loadContent() {
  const res = await fetch('/content/site.json');
  const data = await res.json();

  renderHero(data.hero);
  renderAbout(data.about);
  renderFeatured(data.featured);
  renderTrailer(data.trailer);
  renderEmail(data.email);
  renderPreorder(data.preorder);
  renderComing(data.coming);
  renderContact(data.contact);

  document.getElementById("year").textContent = new Date().getFullYear();
}

/* HERO */
function renderHero(hero) {
  const el = document.getElementById("home-hero");
  el.innerHTML = `
    <h1>${hero.title}</h1>
    <p>${hero.subtitle}</p>
  `;
}

/* ABOUT */
function renderAbout(about) {
  document.getElementById("home-about").innerHTML = `
    <h2>${about.title}</h2>
    <p>${about.text}</p>
  `;
}

/* FEATURED */
function renderFeatured(featured) {
  const el = document.getElementById("home-featured");
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

/* TRAILER */
function renderTrailer(trailer) {
  document.getElementById("home-trailer").innerHTML = `
    <h2>${trailer.title}</h2>
    <iframe src="${trailer.embed}" allowfullscreen></iframe>
  `;
}

/* EMAIL */
function renderEmail(email) {
  document.getElementById("home-email").innerHTML = `
    <h2>${email.title}</h2>
    <input type="email" placeholder="Your email" />
    <button>${email.button}</button>
  `;
}

/* PREORDER */
function renderPreorder(preorder) {
  document.getElementById("home-preorder").innerHTML = `
    <h2>${preorder.title}</h2>
    <p>${preorder.text}</p>
    <a href="${preorder.link}" class="btn">${preorder.button}</a>
  `;
}

/* COMING SOON */
function renderComing(coming) {
  document.getElementById("home-coming").innerHTML = `
    <h2>${coming.title}</h2>
    <p>${coming.text}</p>
  `;
}

/* CONTACT */
function renderContact(contact) {
  document.getElementById("home-contact").innerHTML = `
    <h2>${contact.title}</h2>
    <p>${contact.email}</p>
    <p>${contact.phone}</p>
  `;
}

loadContent();
