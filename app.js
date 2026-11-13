/*
 * Store settings live here. Prices are starter suggestions in INR for 100 g tins.
 * The WhatsApp number uses India's +91 country code and digits only.
 */
const STORE = {
  whatsappNumber: "918606070442",
  currency: "INR",
};

const PRODUCTS = [
  { id: "coriander", name: "Coriander Powder", shortName: "Coriander", price: 99, weight: "100 g", position: 0, image: "assets/coriander.jpg", category: "everyday", family: ["everyday", "warm"], note: "Fresh aroma, naturally good", label: "EVERYDAY ESSENTIAL" },
  { id: "turmeric", name: "Turmeric Powder", shortName: "Turmeric", price: 119, weight: "100 g", position: 1, image: "assets/turmeric.jpg", category: "warm", family: ["everyday", "warm"], note: "Rich in natural goodness", label: "WARM & EARTHY" },
  { id: "chilli", name: "Chilli Powder", shortName: "Chilli", price: 139, weight: "100 g", position: 2, image: "assets/chilli.jpg", category: "bold", family: ["everyday", "bold"], note: "Bold flavour, natural goodness", label: "BOLD & BRIGHT" },
  { id: "pepper", name: "Pepper Powder", shortName: "Pepper", price: 189, weight: "100 g", position: 3, image: "assets/pepper.jpg", category: "bold", family: ["bold"], note: "Pure heat, naturally good", label: "BOLD & AROMATIC" },
  { id: "cumin", name: "Cumin Powder", shortName: "Cumin", price: 129, weight: "100 g", position: 4, image: "assets/cumin.jpg", category: "warm", family: ["everyday", "warm"], note: "Earthy taste, natural goodness", label: "WARM & EARTHY" },
  { id: "garam-masala", name: "Garam Masala", shortName: "Garam Masala", price: 149, weight: "100 g", position: 5, image: "assets/garam-masala.jpg", category: "warm", family: ["everyday", "warm", "bold"], note: "A traditional, fragrant blend", label: "FRAGRANT & WARM" },
];

const PRODUCT_MAP = new Map(PRODUCTS.map((product) => [product.id, product]));
const initialSearch = new URLSearchParams(window.location.search).get("q") || "";
const state = { cart: readCart(), filter: "all", search: initialSearch, sort: "featured" };
const grid = document.querySelector("#product-grid");
const emptyState = document.querySelector("#empty-state");
const cartDrawer = document.querySelector("#cart-drawer");
const overlay = document.querySelector("#overlay");
const checkoutModal = document.querySelector("#checkout-modal");
const toast = document.querySelector("#toast");
let toastTimer;

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("ovr-cart") || "{}");
    return Object.fromEntries(Object.entries(saved).filter(([id, quantity]) => PRODUCT_MAP.has(id) && Number.isInteger(quantity) && quantity > 0));
  } catch {
    return {};
  }
}

function money(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: STORE.currency, maximumFractionDigits: 0 }).format(amount);
}

function productCard(product) {
  return `<article class="product-card">
    <div class="product-image">
      <img src="${product.image}" alt="OVR ${product.name}, ${product.weight} tin" loading="lazy" />
      <span class="product-tag">${product.label}</span>
      <button class="quick-add" type="button" data-add="${product.id}" aria-label="Add ${product.name} to bag">+</button>
    </div>
    <div class="product-info">
      <p class="product-category">OVR pantry · powder</p>
      <div class="product-name-row"><h3 class="product-name">${product.name}</h3><span class="product-price">${money(product.price)}</span></div>
      <div class="product-detail"><span class="product-weight">${product.weight} tin</span><span class="product-rating">${product.note}</span></div>
    </div>
  </article>`;
}

function getVisibleProducts() {
  const search = state.search.trim().toLowerCase();
  let visible = PRODUCTS.filter((product) => {
    const matchesFilter = state.filter === "all" || product.family.includes(state.filter);
    const matchesSearch = !search || `${product.name} ${product.shortName} ${product.note} ${product.label}`.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });
  if (state.sort === "price-low") visible = [...visible].sort((a, b) => a.price - b.price);
  if (state.sort === "price-high") visible = [...visible].sort((a, b) => b.price - a.price);
  if (state.sort === "name") visible = [...visible].sort((a, b) => a.name.localeCompare(b.name));
  return visible;
}

function renderProducts() {
  if (!grid || !emptyState) return;
  const visible = getVisibleProducts();
  grid.innerHTML = visible.map(productCard).join("");
  emptyState.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    const selected = chip.dataset.filter === state.filter;
    chip.classList.toggle("selected", selected);
    chip.setAttribute("aria-pressed", String(selected));
  });
}

function saveCart() {
  try { localStorage.setItem("ovr-cart", JSON.stringify(state.cart)); } catch { /* The cart still works for this visit if storage is unavailable. */ }
  renderCart();
}

function cartQuantity() {
  return Object.values(state.cart).reduce((total, quantity) => total + quantity, 0);
}

function cartSubtotal() {
  return Object.entries(state.cart).reduce((total, [id, quantity]) => total + PRODUCT_MAP.get(id).price * quantity, 0);
}

function renderCart() {
  document.querySelector("#cart-count").textContent = cartQuantity();
  document.querySelector("#cart-subtotal").textContent = money(cartSubtotal());
  const entries = Object.entries(state.cart).filter(([, quantity]) => quantity > 0);
  document.querySelector("#cart-empty").hidden = entries.length > 0;
  document.querySelector("#drawer-bottom").hidden = entries.length === 0;
  document.querySelector("#cart-items").innerHTML = entries.map(([id, quantity]) => {
    const product = PRODUCT_MAP.get(id);
    return `<div class="cart-line">
      <div class="cart-thumb"><img src="${product.image}" alt="" /></div>
      <div><h3 class="cart-product-name">${product.name}</h3><span class="cart-product-meta">${product.weight} · ${money(product.price)} each</span>
        <div class="quantity-control" aria-label="Quantity for ${product.name}"><button type="button" data-quantity="${id}" data-change="-1" aria-label="Remove one ${product.name}">−</button><span>${quantity}</span><button type="button" data-quantity="${id}" data-change="1" aria-label="Add one ${product.name}">+</button></div>
      </div><span class="cart-line-total">${money(product.price * quantity)}</span>
    </div>`;
  }).join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function addToCart(id, quantity = 1) {
  if (!PRODUCT_MAP.has(id)) return;
  state.cart[id] = (state.cart[id] || 0) + quantity;
  saveCart();
  const product = PRODUCT_MAP.get(id);
  showToast(`${product.shortName} added to your bag`);
}

function setOverlay(open) {
  if (open) {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("visible"));
    document.body.classList.add("no-scroll");
  } else {
    overlay.classList.remove("visible");
    document.body.classList.remove("no-scroll");
    setTimeout(() => { if (!overlay.classList.contains("visible")) overlay.hidden = true; }, 260);
  }
}

function openCart() {
  renderCart();
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  setOverlay(true);
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  if (!checkoutModal.classList.contains("open")) setOverlay(false);
}

function openCheckout() {
  closeCart();
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  setOverlay(true);
  setTimeout(() => checkoutModal.querySelector("input")?.focus(), 100);
}

function closeCheckout() {
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
  setOverlay(false);
}

function orderMessage(formData) {
  const lines = Object.entries(state.cart).map(([id, quantity]) => {
    const product = PRODUCT_MAP.get(id);
    return `• ${product.name} (${product.weight}) × ${quantity} — ${money(product.price * quantity)}`;
  });
  return [
    "Hello OVR Spice Powders! I’d like to place this order:",
    "",
    ...lines,
    "",
    `Subtotal: ${money(cartSubtotal())}`,
    "",
    `Name: ${formData.get("name")}`,
    `Phone: ${formData.get("phone")}`,
    `Delivery address: ${formData.get("address")}`,
    "",
    "Please confirm availability, delivery and payment details.",
  ].join("\n");
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) addToCart(addButton.dataset.add);

  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    const { quantity: id, change } = quantityButton.dataset;
    state.cart[id] = (state.cart[id] || 0) + Number(change);
    if (state.cart[id] <= 0) delete state.cart[id];
    saveCart();
  }

  if (event.target.closest("[data-open-cart]")) openCart();
  if (event.target.closest("[data-close-cart]")) closeCart();
  if (event.target === overlay) {
    if (checkoutModal.classList.contains("open")) closeCheckout();
    else closeCart();
  }
  if (event.target.closest("[data-close-checkout]")) closeCheckout();
  const slideDot = event.target.closest("[data-slide]");
  if (slideDot) renderHeroSlide(Number(slideDot.dataset.slide));
  if (event.target.closest("[data-contact]")) {
    const message = encodeURIComponent("Hello OVR Spice Powders, I have a question.");
    const number = STORE.whatsappNumber.replace(/\D/g, "");
    window.open(number ? `https://wa.me/${number}?text=${message}` : `https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
  }
});

document.querySelectorAll(".filter-chip").forEach((chip) => chip.addEventListener("click", () => {
  state.filter = chip.dataset.filter;
  renderProducts();
}));
document.querySelector("#sort-products")?.addEventListener("change", (event) => { state.sort = event.target.value; renderProducts(); });
const searchPanel = document.querySelector("#search-panel");
const searchToggle = document.querySelector(".search-toggle");
searchToggle.addEventListener("click", () => {
  const open = searchPanel.hidden;
  searchPanel.hidden = !open;
  searchToggle.setAttribute("aria-expanded", String(open));
  if (open) document.querySelector("#product-search").focus();
});
const searchInput = document.querySelector("#product-search");
searchInput.value = state.search;
searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  if (grid) renderProducts();
});
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") document.querySelector("#submit-search").click();
});
document.querySelector("#submit-search").addEventListener("click", () => {
  if (!grid) {
    window.location.href = `products.html?q=${encodeURIComponent(searchInput.value.trim())}`;
    return;
  }
  state.search = searchInput.value;
  renderProducts();
  document.querySelector("#spices").scrollIntoView({ behavior: "smooth", block: "start" });
  searchPanel.hidden = true;
  searchToggle.setAttribute("aria-expanded", "false");
});
document.querySelector("#clear-search").addEventListener("click", () => {
  searchInput.value = "";
  state.search = "";
  renderProducts();
  searchInput.focus();
});
document.querySelector("#checkout-button").addEventListener("click", openCheckout);
document.querySelector("#checkout-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (cartQuantity() === 0) { closeCheckout(); return; }
  const formData = new FormData(event.currentTarget);
  const message = encodeURIComponent(orderMessage(formData));
  const number = STORE.whatsappNumber.replace(/\D/g, "");
  window.open(number ? `https://wa.me/${number}?text=${message}` : `https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
  closeCheckout();
  showToast("Order message prepared in WhatsApp");
});

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  mainNav.classList.toggle("open", open);
});
mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
}));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    closeCheckout();
    searchPanel.hidden = true;
    searchToggle.setAttribute("aria-expanded", "false");
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
});
document.querySelector("#year").textContent = new Date().getFullYear();
renderProducts();
renderCart();

let activeHeroSlide = 0;
let heroTimer;
const heroImage = document.querySelector("#hero-product-image");
const heroDots = document.querySelector("#hero-dots");

function renderHeroSlide(index) {
  if (!heroImage || !heroDots) return;
  activeHeroSlide = (index + PRODUCTS.length) % PRODUCTS.length;
  const product = PRODUCTS[activeHeroSlide];
  heroImage.classList.add("changing");
  window.setTimeout(() => {
    heroImage.src = product.image;
    heroImage.alt = `OVR ${product.name}, ${product.weight} tin`;
    document.querySelector("#hero-slide-name").textContent = product.name;
    document.querySelector("#hero-slide-note").textContent = product.note;
    heroImage.classList.remove("changing");
  }, 140);
  heroDots.querySelectorAll("button").forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === activeHeroSlide);
    dot.setAttribute("aria-current", dotIndex === activeHeroSlide ? "true" : "false");
  });
}

if (heroDots) {
  heroDots.innerHTML = PRODUCTS.map((product, index) => `<button type="button" data-slide="${index}" aria-label="Show ${product.shortName}" aria-current="${index === 0}"></button>`).join("");
  document.querySelector("#hero-prev").addEventListener("click", () => renderHeroSlide(activeHeroSlide - 1));
  document.querySelector("#hero-next").addEventListener("click", () => renderHeroSlide(activeHeroSlide + 1));
  renderHeroSlide(0);
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroTimer = window.setInterval(() => renderHeroSlide(activeHeroSlide + 1), 2000);
    const hero = document.querySelector(".hero-visual");
    let touchStartX = 0;
    hero.addEventListener("pointerdown", (event) => { touchStartX = event.clientX; });
    hero.addEventListener("pointerup", (event) => {
      const swipe = event.clientX - touchStartX;
      if (Math.abs(swipe) > 45) renderHeroSlide(activeHeroSlide + (swipe < 0 ? 1 : -1));
    });
    hero.addEventListener("pointerenter", () => window.clearInterval(heroTimer));
    hero.addEventListener("pointerleave", () => {
      window.clearInterval(heroTimer);
      heroTimer = window.setInterval(() => renderHeroSlide(activeHeroSlide + 1), 2000);
    });
  }
}
