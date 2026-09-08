const SITE_CONFIG = {
  brandName: "周边精选",
  brandSubline: "南京出发 · 团队旅行",
  phone: "",       // 示例："13800000000"
  wechat: "",      // 示例："your-wechat-id"
  consultantName: "旅行顾问"
};

const products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];

const state = {
  query: "",
  day: "",
  category: "",
  destination: ""
};

const tones = [
  ["#dcebe1", "#e9ddc7"],
  ["#d8e7ed", "#e7d6c0"],
  ["#e5ead5", "#cddfd5"],
  ["#eadfd5", "#d7e7df"],
  ["#dce2ee", "#e8dfcf"],
  ["#e7e0cf", "#d3e4d9"]
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const els = {
  productGrid: $("#productGrid"),
  resultCount: $("#resultCount"),
  searchInput: $("#searchInput"),
  dayFilters: $("#dayFilters"),
  categoryFilters: $("#categoryFilters"),
  destinationSelect: $("#destinationSelect"),
  resetFilters: $("#resetFilters"),
  emptyState: $("#emptyState"),
  emptyReset: $("#emptyReset"),
  showAllBtn: $("#showAllBtn"),
  detailOverlay: $("#detailOverlay"),
  detailContent: $("#detailContent"),
  toast: $("#toast")
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unique(list) {
  return [...new Set(list)].filter(Boolean);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function getCategories() {
  const preferred = ["人文", "自然", "康养", "小镇", "古镇", "非遗", "休闲"];
  const all = unique(products.flatMap(product => product.categories || []));
  return preferred.filter(item => all.includes(item)).concat(all.filter(item => !preferred.includes(item)));
}

function renderFilterControls() {
  const days = unique(products.map(product => product.days)).sort((a, b) => a - b);
  els.dayFilters.innerHTML = [
    `<button class="chip active" type="button" data-day="">全部</button>`,
    ...days.map(day => `<button class="chip" type="button" data-day="${day}">${day}日</button>`)
  ].join("");

  els.categoryFilters.innerHTML = [
    `<button class="chip active" type="button" data-category="">全部</button>`,
    ...getCategories().map(category => `<button class="chip" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`)
  ].join("");

  const destinations = unique(products.map(product => product.destination)).sort((a, b) => a.localeCompare(b, "zh-CN"));
  els.destinationSelect.innerHTML = `<option value="">全部目的地</option>` + destinations
    .map(destination => `<option value="${escapeHtml(destination)}">${escapeHtml(destination)}</option>`)
    .join("");
}

function searchableText(product) {
  return [
    product.name,
    product.destination,
    ...(product.spots || []),
    ...(product.categories || []),
    ...(product.suitable || []),
    product.transport
  ].join(" ").toLowerCase();
}

function getFilteredProducts() {
  const query = state.query.trim().toLowerCase();
  return products.filter(product => {
    if (query && !searchableText(product).includes(query)) return false;
    if (state.day && String(product.days) !== String(state.day)) return false;
    if (state.category && !(product.categories || []).includes(state.category)) return false;
    if (state.destination && product.destination !== state.destination) return false;
    return true;
  });
}

function productCard(product, index) {
  const [toneA, toneB] = tones[(product.id + index) % tones.length];
  const tags = unique([...(product.categories || []), ...(product.suitable || []).slice(0, 1)]).slice(0, 4);
  const transportLabel = product.transport.includes("高铁") ? "高铁/大巴" : "大巴直达";
  return `
    <article class="product-card" data-product-id="${product.id}" tabindex="0" role="button" aria-label="查看${escapeHtml(product.name)}详情">
      <div class="card-visual" style="--tone-a:${toneA};--tone-b:${toneB}">
        <span class="day-badge">${product.days}天行程</span>
        <span class="destination-word">${escapeHtml(product.destination.replace("·", ""))}</span>
      </div>
      <div class="card-body">
        <p class="card-kicker">南京出发 · ${escapeHtml(transportLabel)}</p>
        <h3 class="card-title">${escapeHtml(product.name)}</h3>
        <p class="card-spots">${escapeHtml((product.spots || []).join(" · "))}</p>
        <div class="tag-row">${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="card-footer">
          <span>${product.spots.length} 个主要体验点</span>
          <span class="card-link">查看详情 →</span>
        </div>
      </div>
    </article>`;
}

function renderProducts() {
  const filtered = getFilteredProducts();
  els.productGrid.innerHTML = filtered.map(productCard).join("");
  els.resultCount.textContent = `共 ${filtered.length} 条线路`;
  els.emptyState.hidden = filtered.length !== 0;
  els.productGrid.hidden = filtered.length === 0;
}

function setActiveChip(container, attr, value) {
  $$(".chip", container).forEach(button => {
    button.classList.toggle("active", button.dataset[attr] === String(value));
  });
}

function resetAllFilters(scroll = false) {
  state.query = "";
  state.day = "";
  state.category = "";
  state.destination = "";
  els.searchInput.value = "";
  els.destinationSelect.value = "";
  setActiveChip(els.dayFilters, "day", "");
  setActiveChip(els.categoryFilters, "category", "");
  renderProducts();
  if (scroll) $("#products").scrollIntoView({ behavior: "smooth", block: "start" });
}

function toneForProduct(product) {
  return tones[product.id % tones.length];
}

function renderDetail(product) {
  const [toneA, toneB] = toneForProduct(product);
  const notes = product.note ? `
    <section class="detail-section">
      <h3>发布前核对</h3>
      <p style="margin:0;color:#915432;font-size:14px;">${escapeHtml(product.note)}</p>
    </section>` : "";

  els.detailContent.innerHTML = `
    <header class="detail-hero" style="--tone-a:${toneA};--tone-b:${toneB}">
      <div class="detail-meta">
        <span class="tag">${product.days}天行程</span>
        ${(product.categories || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <h2 id="detailTitle">${escapeHtml(product.name)}</h2>
      <p>${escapeHtml(product.spots.join(" · "))}</p>
    </header>
    <div class="detail-body">
      <section class="detail-section">
        <h3>线路亮点</h3>
        <div class="spot-list">${product.spots.map(spot => `<span class="spot-pill">${escapeHtml(spot)}</span>`).join("")}</div>
      </section>
      <section class="detail-section">
        <h3>行程参考</h3>
        <div class="itinerary">
          ${product.itinerary.map((copy, index) => `
            <div class="day-item">
              <span class="day-index">DAY ${index + 1}</span>
              <div class="day-copy">${escapeHtml(copy)}</div>
            </div>`).join("")}
        </div>
      </section>
      <section class="detail-section">
        <h3>出行信息</h3>
        <div class="info-list">
          <div class="info-row"><span>出发地</span><strong>南京</strong></div>
          <div class="info-row"><span>目的地</span><strong>${escapeHtml(product.destination)}</strong></div>
          <div class="info-row"><span>交通</span><strong>${escapeHtml(product.transport)}</strong></div>
          <div class="info-row"><span>适合</span><strong>${escapeHtml((product.suitable || []).join("、"))}</strong></div>
        </div>
      </section>
      ${notes}
      <div class="detail-actions">
        <button class="primary-button" type="button" data-contact-product="${product.id}">咨询这条线路</button>
        <button class="ghost-button share-button" type="button" data-share-product="${product.id}">分享</button>
      </div>
    </div>`;
}

function openDetail(productId, updateHistory = true) {
  const product = products.find(item => item.id === Number(productId));
  if (!product) return;
  renderDetail(product);
  els.detailOverlay.hidden = false;
  document.body.classList.add("no-scroll");
  if (updateHistory) {
    const url = new URL(window.location.href);
    url.searchParams.set("product", product.id);
    history.pushState({ productId: product.id }, "", url);
  }
  setTimeout(() => $(".detail-close")?.focus(), 30);
}

function closeDetail(updateHistory = true) {
  if (els.detailOverlay.hidden) return;
  els.detailOverlay.hidden = true;
  document.body.classList.remove("no-scroll");
  if (updateHistory) {
    const url = new URL(window.location.href);
    url.searchParams.delete("product");
    history.pushState({}, "", url);
  }
}

function contactProduct(product) {
  const message = `您好，我想咨询“${product.name}”团队行程。`;
  if (SITE_CONFIG.phone) {
    window.location.href = `tel:${SITE_CONFIG.phone}`;
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(message).then(() => showToast("咨询文案已复制，可发送给旅行顾问"));
  } else {
    showToast("请联系旅行顾问咨询此线路");
  }
}

async function shareProduct(product) {
  const url = new URL(window.location.href);
  url.searchParams.set("product", product.id);
  const shareData = { title: product.name, text: `${product.days}天团队线路：${product.spots.join("、")}`, url: url.toString() };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url.toString());
      showToast("线路链接已复制");
    } else {
      showToast("请复制浏览器地址分享此线路");
    }
  } catch (error) {
    if (error?.name !== "AbortError") showToast("分享未完成，请稍后再试");
  }
}

function applySiteConfig() {
  document.title = `${SITE_CONFIG.brandName}｜南京出发企业团队周边游`;
  $("#brandName").textContent = SITE_CONFIG.brandName;
  $("#footerBrand").textContent = `© ${new Date().getFullYear()} ${SITE_CONFIG.brandName}`;
  $("#statTotal").textContent = products.length;
  $("#statBus").textContent = products.filter(product => product.transport === "大巴直达").length;

  const primary = $("#contactPrimary");
  const secondary = $("#contactSecondary");
  const action = $("#contactAction");
  const headerContact = $("#headerContact");

  if (SITE_CONFIG.phone || SITE_CONFIG.wechat) {
    const methods = [];
    if (SITE_CONFIG.phone) methods.push(`电话 ${SITE_CONFIG.phone}`);
    if (SITE_CONFIG.wechat) methods.push(`微信 ${SITE_CONFIG.wechat}`);
    primary.textContent = methods.join(" · ");
    secondary.textContent = `${SITE_CONFIG.consultantName}可根据人数、日期和预算调整方案。`;
    if (SITE_CONFIG.phone) {
      action.href = `tel:${SITE_CONFIG.phone}`;
      action.textContent = "电话咨询";
      headerContact.href = `tel:${SITE_CONFIG.phone}`;
    } else {
      action.href = "#products";
      action.textContent = "选择线路后咨询";
    }
  }
}

function bindEvents() {
  let searchTimer;
  els.searchInput.addEventListener("input", event => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = event.target.value;
      renderProducts();
    }, 120);
  });

  els.dayFilters.addEventListener("click", event => {
    const button = event.target.closest("[data-day]");
    if (!button) return;
    state.day = button.dataset.day;
    setActiveChip(els.dayFilters, "day", state.day);
    renderProducts();
  });

  els.categoryFilters.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    setActiveChip(els.categoryFilters, "category", state.category);
    renderProducts();
  });

  els.destinationSelect.addEventListener("change", event => {
    state.destination = event.target.value;
    renderProducts();
  });

  [els.resetFilters, els.emptyReset].forEach(button => button.addEventListener("click", () => resetAllFilters()));
  els.showAllBtn.addEventListener("click", () => resetAllFilters(true));

  els.productGrid.addEventListener("click", event => {
    const card = event.target.closest("[data-product-id]");
    if (card) openDetail(card.dataset.productId);
  });
  els.productGrid.addEventListener("keydown", event => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest("[data-product-id]");
    if (card) {
      event.preventDefault();
      openDetail(card.dataset.productId);
    }
  });

  els.detailOverlay.addEventListener("click", event => {
    if (event.target.closest("[data-close-detail]")) closeDetail();
    const contactButton = event.target.closest("[data-contact-product]");
    if (contactButton) {
      const product = products.find(item => item.id === Number(contactButton.dataset.contactProduct));
      if (product) contactProduct(product);
    }
    const shareButton = event.target.closest("[data-share-product]");
    if (shareButton) {
      const product = products.find(item => item.id === Number(shareButton.dataset.shareProduct));
      if (product) shareProduct(product);
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !els.detailOverlay.hidden) closeDetail();
  });

  window.addEventListener("popstate", () => {
    const productId = new URL(window.location.href).searchParams.get("product");
    if (productId) openDetail(productId, false);
    else closeDetail(false);
  });
}

function initDeepLink() {
  const productId = new URL(window.location.href).searchParams.get("product");
  if (productId) openDetail(productId, false);
}

function init() {
  applySiteConfig();
  renderFilterControls();
  renderProducts();
  bindEvents();
  initDeepLink();
}

init();
