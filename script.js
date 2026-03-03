// Menu mobile
const btn = document.getElementById("menuBtn");
const mobile = document.getElementById("mobileNav");

btn?.addEventListener("click", () => {
  const isOpen = btn.getAttribute("aria-expanded") === "true";
  btn.setAttribute("aria-expanded", String(!isOpen));
  mobile.hidden = isOpen;
});

mobile?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    mobile.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  });
});

// Reveal (reaparece toda vez que entra na tela)
const elements = document.querySelectorAll(".reveal, .fade-left");

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("show");
      } else {
        e.target.classList.remove("show"); // para repetir quando reaparecer
      }
    });
  },
  { threshold: 0.12 }
);

elements.forEach((el) => io.observe(el));


/* ===== FAIXA DE VÍDEOS COM SETAS + AUTOPLAY VISÍVEL ===== */
(function () {
  const rail = document.getElementById("videoRail");
  if (!rail) return;

  const track = rail.querySelector(".railTrack");
  const viewport = rail.querySelector(".railViewport");
  const prevBtn = rail.querySelector(".railBtn.prev");
  const nextBtn = rail.querySelector(".railBtn.next");
  const videos = Array.from(rail.querySelectorAll(".railVideo"));

  let x = 0;

  // quanto desliza por clique (um card + gap)
  function stepSize() {
    const card = rail.querySelector(".railCard");
    if (!card) return 300;
    const style = getComputedStyle(track);
    const gap = parseFloat(style.gap || "14");
    return card.getBoundingClientRect().width + gap;
  }

  function maxScroll() {
    return Math.max(0, track.scrollWidth - viewport.clientWidth);
  }

  function applyTransform() {
    track.style.transform = `translateX(${-x}px)`;
  }

  function clampX() {
    x = Math.max(0, Math.min(x, maxScroll()));
  }

  function go(dir) {
    x += dir * (stepSize() * 1.6); // “passa vários” tipo Netflix
    clampX();
    applyTransform();
    playVisible();
  }

  prevBtn?.addEventListener("click", () => go(-1));
  nextBtn?.addEventListener("click", () => go(1));

  // Autoplay só do que estiver visível
  function playVisible() {
    const vp = viewport.getBoundingClientRect();

    videos.forEach((v) => {
      const r = v.getBoundingClientRect();
      const visible =
        r.right > vp.left + 30 &&
        r.left < vp.right - 30 &&
        r.bottom > vp.top &&
        r.top < vp.bottom;

      v.muted = true;
      v.playsInline = true;

      if (visible) {
        // tenta play
        v.play().catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }

  // roda ao carregar + ao redimensionar
  window.addEventListener("resize", () => {
    clampX();
    applyTransform();
    playVisible();
  });

  // swipe no mobile
  let startX = null;
  viewport.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  viewport.addEventListener("touchend", (e) => {
    if (startX == null) return;
    const endX = e.changedTouches[0].clientX;
    const dx = endX - startX;
    startX = null;
    if (Math.abs(dx) > 35) go(dx < 0 ? 1 : -1);
  });

  // inicia
  playVisible();
})();

// ===== MODAL CINEMATOGRÁFICO =====
const videoModal = document.getElementById("videoModal");
const videoModalPlayer = document.getElementById("videoModalPlayer");

function openVideoModal(src, card){
  if(!videoModal || !videoModalPlayer) return;

  // Micro vibração no card
  card.style.transform = "scale(1.03)";
  setTimeout(() => card.style.transform = "", 150);

  videoModal.classList.add("open");
  videoModal.setAttribute("aria-hidden", "false");

  videoModalPlayer.src = src;
  videoModalPlayer.currentTime = 0;

  setTimeout(() => {
    videoModalPlayer.play().catch(()=>{});
  }, 200);
}

function closeVideoModal(){
  if(!videoModal || !videoModalPlayer) return;

  videoModal.classList.remove("open");

  setTimeout(() => {
    videoModalPlayer.pause();
    videoModalPlayer.removeAttribute("src");
    videoModalPlayer.load();
  }, 300);
}

document.addEventListener("click", (e) => {
  const card = e.target.closest(".railCard[data-video]");

  if(card){
    openVideoModal(card.getAttribute("data-video"), card);
    return;
  }

  if(e.target?.dataset?.close === "true"){
    closeVideoModal();
  }
});

document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" && videoModal?.classList.contains("open")){
    closeVideoModal();
  }
});

document.addEventListener("click", (e) => {
  const card = e.target.closest(".railCard[data-video]");
  if(card){
    return;
  }
  if(e.target?.dataset?.close === "true") closeVideoModal();
});

document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" && videoModal?.classList.contains("open")){
    closeVideoModal();
  }
});
// ===== Filtro de categorias dos vídeos =====
const filterBtns = document.querySelectorAll(".videoFilterBtn");
const videoCards = document.querySelectorAll(".railCard[data-cat]");

function setActive(btn){
  filterBtns.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.getAttribute("data-filter");
    setActive(btn);

    videoCards.forEach(card => {
      const cat = card.getAttribute("data-cat");
      const show = (filter === "all") || (cat === filter);
      card.classList.toggle("isHidden", !show);
    });
  });
});

// ===== Feedback Slider (autoplay premium) =====
(() => {
  const rail = document.getElementById("feedbackRail");
  if (!rail) return;

  const viewport = rail.querySelector(".fbViewport");
  const track = rail.querySelector(".fbTrack");
  const prev = rail.querySelector(".fbBtn.prev");
  const next = rail.querySelector(".fbBtn.next");

  // quanto “anda” por clique / passo do autoplay
  const getStep = () => {
    const card = track.querySelector(".fbCard");
    if (!card) return 340;
    const gap = parseFloat(getComputedStyle(track).gap || "16");
    return card.getBoundingClientRect().width + gap;
  };

  const scrollByStep = (dir = 1) => {
    viewport.scrollBy({ left: getStep() * dir, behavior: "smooth" });
  };

  prev.addEventListener("click", () => scrollByStep(-1));
  next.addEventListener("click", () => scrollByStep(1));

  // Loop suave: se chegar no fim, volta pro começo
  const loopCheck = () => {
    const max = viewport.scrollWidth - viewport.clientWidth;
    if (viewport.scrollLeft >= max - 4) {
      viewport.scrollTo({ left: 0, behavior: "smooth" });
    }
    if (viewport.scrollLeft <= 0) {
      // opcional: nada aqui (deixa normal)
    }
  };

  let timer = null;
  const start = () => {
    if (timer) return;
    timer = setInterval(() => {
      scrollByStep(1);
      setTimeout(loopCheck, 420);
    }, 3200);
  };

  const stop = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  };

  // Pausa quando o mouse entra (efeito premium)
  rail.addEventListener("mouseenter", stop);
  rail.addEventListener("mouseleave", start);
  rail.addEventListener("touchstart", stop, { passive: true });
  rail.addEventListener("touchend", start, { passive: true });

  // Começa só quando estiver na tela (mais “profissional”)
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? start() : stop()));
    },
    { threshold: 0.25 }
  );

  obs.observe(rail);

  // Acessibilidade: setas do teclado
  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") scrollByStep(-1);
    if (e.key === "ArrowRight") scrollByStep(1);
  });
})();
/* ===== MODAL DE PRODUTO (POPUP) ===== */
(() => {
  const productModal = document.getElementById("productModal");
  if (!productModal) return;

  const imgEl = document.getElementById("productModalImg");
  const badgeEl = document.getElementById("productModalBadge");
  const titleEl = document.getElementById("productModalTitle");
  const descEl = document.getElementById("productModalDesc");
  const listEl = document.getElementById("productModalList");
  const specsEl = document.getElementById("productModalSpecs");
  const whatsEl = document.getElementById("productModalWhats");
  const buyEl = document.getElementById("productModalBuy");
  const marketsEl = document.getElementById("productModalMarkets");
  const videoWrapEl = document.getElementById("productVideoWrap");
const videoEl = document.getElementById("productModalVideo");

  let lastFocus = null;

  // ✅ links padrões (aparecem em TODOS os produtos automaticamente)
  const DEFAULT_MARKETS = {
    mercadolivre: "https://www.mercadolivre.com.br/",
    shopee: "https://shopee.com.br/",
    magalu: "https://www.magazineluiza.com.br/"
  };
  const MARKET_LOGOS = {
    mercadolivre: "./assets/Marketplaces/mercadolivre.png",
    shopee: "./assets/Marketplaces/shopee.png",
    magalu: "./assets/Marketplaces/magalu.png",
    tiktok: "./assets/Marketplaces/tiktok.svg"
  };
  const MARKET_LABELS = {
    mercadolivre: "Mercado Livre",
    shopee: "Shopee",
    magalu: "Magalu",
  };

  const MARKET_INITIALS = {
    mercadolivre: "ML",
    shopee: "S",
    magalu: "M",
    amazon: "A"
  };

  // >>>>>> EDITE AQUI OS PRODUTOS <<<<<<
  // (mesmo que você não coloque markets em um produto, ele usa DEFAULT_MARKETS)
  const PRODUCTS = {
    p1: {
      badge: "Iluminação",
      video: "./assets/video lanterna.mp4",
      title: "Luminária 200w Bivolt",
      desc: "Iluminação de alto desempenho com eficiência energética e durabilidade profissional para grandes ambientes.",
      img: "./assets/Luminaria.png?v=6",
      specs: ["Bivolt", "Alta eficiência", "Uso interno/externo"],
      features: [
        "Estrutura resistente e durável",
        "Iluminação potente e uniforme",
        "Economia de energia com LED",
        "Ideal para ambientes amplos"
      ],
      whatsapp: "https://wa.me/5511982139222?text=Olá!%20Quero%20detalhes%20do%20Produto%2001.",
      buy: "#",
      markets: {
        mercadolivre: "https://www.mercadolivre.com.br/luminaria-posto-de-combustivel-200w-led-22000lm-ip66/up/MLBU1436506402",
        shopee: "https://shopee.com.br/seu-link-aqui",
        magalu: "https://www.magazineluiza.com.br/seu-link-aqui"
      }
    },

    p2: {
      badge: "Iluminação",
      title: "Lanterna De Camping Solar",
      desc: "Solar forte e moderno: iluminação autônoma com economia real e instalação simples.",
      img: "./assets/LED SOLAR.png",
      specs: ["Solar", "Portátil", "Alta autonomia"],
      features: [
        "Ideal para áreas externas",
        "Carregamento solar prático",
        "Ótima autonomia",
        "Uso versátil"
      ],
      whatsapp: "https://wa.me/5511982139222?text=Olá!%20Quero%20detalhes%20do%20Produto%2002.",
      buy: "#"
      // markets: (se não colocar, ele usa DEFAULT_MARKETS automaticamente)
    },

    p3: { badge: "Linha OLLED", title: "Placa De Reposição 200w Bivolt", desc: "Luz uniforme e acabamento clean para projetos que pedem visual premium.", img: "./assets/Placas.png", specs: ["LED", "Alta durabilidade"], features: ["Característica 1", "Característica 2"], whatsapp: "https://wa.me/5511982139222?text=Produto%2003", buy: "#" },
    p4: { badge: "Linha OLLED", title: "Lanterna Solar Emergência", desc: "Compacto e potente: iluminação prática para o dia a dia com ótimo alcance.", img: "./assets/lanterna.png", specs: ["Recarregável", "Resistente"], features: ["Característica 1", "Característica 2"], whatsapp: "https://wa.me/5511982139222?text=Produto%2004", buy: "#" },
    p5: { badge: "Linha OLLED", title: "Cadeado De 20mm", desc: "Segurança e resistência: construção robusta com padrão de qualidade OLLED.", img: "./assets/Cadeados.png", specs: ["Segurança", "Aço"], features: ["Característica 1", "Característica 2"], whatsapp: "https://wa.me/5511982139222?text=Produto%2005", buy: "#" },
    p6: { badge: "Linha OLLED", title: "Cadeado De 30mm", desc: "Mais proteção no uso diário, com design compacto e durabilidade superior.", img: "./assets/cadeado.png", specs: ["Compacto", "Resistente"], features: ["Característica 1", "Característica 2"], whatsapp: "https://wa.me/5511982139222?text=Produto%2006", buy: "#" },
    p7: { badge: "Linha OLLED", title: "Refletor 200w Testeira", desc: "Design moderno + eficiência: feito para ambientes comerciais e profissionais.", img: "./assets/prod-07.jpg", specs: ["Info", "Info"], features: ["Característica 1", "Característica 2"], whatsapp: "https://wa.me/5511982139222?text=Produto%2007", buy: "#" },
    p8: { badge: "Linha OLLED", title: "Massaeador 100v/220v", desc: "Performance alta com baixo consumo, ideal para iluminação constante e forte.", img: "./assets/prod-08.jpg", specs: ["Info", "Info"], features: ["Característica 1", "Característica 2"], whatsapp: "https://wa.me/5511982139222?text=Produto%2008", buy: "#" },
    p9: { badge: "Linha OLLED", title: "Máquina de cortao cabelo dragão", desc: "Iluminação consistente e acabamento premium para elevar o padrão do ambiente.", img: "./assets/prod-09.jpg", specs: ["Info", "Info"], features: ["Característica 1", "Característica 2"], whatsapp: "https://wa.me/5511982139222?text=Produto%2009", buy: "#" },
    p10:{ badge: "Linha OLLED", title: "Interruptor Inteligente Controle", desc: "Potência, economia e confiabilidade no mesmo produto — feito para durar.", img: "./assets/prod-10.jpg", specs: ["Info", "Info"], features: ["Característica 1", "Característica 2"], whatsapp: "https://wa.me/5511982139222?text=Produto%2010", buy: "#" }
  };

  function openProductModal(id, triggerEl) {
    const p = PRODUCTS[id];
    if (!p) return;

    lastFocus = triggerEl || null;

    badgeEl.textContent = p.badge || "Produto";
    titleEl.textContent = p.title || "Produto";
    descEl.textContent = p.desc || "";

    imgEl.src = p.img || "";
    // Vídeo do produto no modal
if (videoWrapEl && videoEl) {
  if (p.video) {
    videoWrapEl.style.display = "block";
    videoEl.src = p.video;
    videoEl.load();
  } else {
    videoWrapEl.style.display = "none";
    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load();
  }
}
    imgEl.alt = p.title || "Produto";
    imgEl.onerror = () => {
      imgEl.onerror = null;
      imgEl.src = "https://via.placeholder.com/1200x900?text=Produto";
    };

    // Chips
    specsEl.innerHTML = "";
    (p.specs || []).forEach((s) => {
      const chip = document.createElement("span");
      chip.className = "productModalChip";
      chip.textContent = s;
      specsEl.appendChild(chip);
    });

    // Features
    listEl.innerHTML = "";
    (p.features || []).forEach((f) => {
      const li = document.createElement("li");
      li.textContent = f;
      listEl.appendChild(li);
    });

    // Links (não quebra se algum elemento não existir)
if (whatsEl) whatsEl.href = p.whatsapp || "#";
if (buyEl) {
  buyEl.href = p.buy || "#";
  buyEl.style.display = "none"; // garante que não aparece, mesmo se existir
}

    // Marketplaces (pega do produto, e se não tiver, usa o DEFAULT_MARKETS)
    const markets = { ...DEFAULT_MARKETS, ...(p.markets || {}) };

    marketsEl.innerHTML = "";
    marketsEl.classList.remove("is-animated"); // reinicia animação sempre

    Object.entries(markets).forEach(([key, url]) => {
      if (!url) return;

      const a = document.createElement("a");
      a.className = `marketBtn mk-${key}`;
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";

      a.innerHTML = `
  <img class="marketLogo" 
       src="${MARKET_LOGOS[key] || ""}" 
       alt="${MARKET_LABELS[key] || key}">
`;

      marketsEl.appendChild(a);
    });

    requestAnimationFrame(() => {
      marketsEl.classList.add("is-animated");
    });
    productModal.classList.add("open");
    productModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const closeBtn = productModal.querySelector("[data-close='product'], .videoModalClose");
    closeBtn?.focus();
  }

  function closeProductModal() {
    productModal.classList.remove("open");
    productModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    // Para o vídeo ao fechar
if (videoEl) {
  videoEl.pause();
  videoEl.currentTime = 0;
  videoEl.removeAttribute("src");
  videoEl.load();
}
if (videoWrapEl) videoWrapEl.style.display = "none";
    lastFocus = null;
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".js-product-open[data-product]");
    if (btn) {
      e.preventDefault();
      openProductModal(btn.getAttribute("data-product"), btn);
      return;
    }

    if (e.target?.dataset?.close === "product" && productModal.classList.contains("open")) {
      closeProductModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && productModal.classList.contains("open")) {
      closeProductModal();
    }
  });
})();
// ===============================
// CAMPANHAS SAZONAIS (Plano A)
// ===============================
(function seasonalCampaigns() {
  // Ajuste para horário do Brasil (evita virar dia errado em alguns PCs)
  function nowBR() {
    const now = new Date();
    // Força referência em pt-BR (uso de data local do dispositivo)
    return now;
  }

  // Crie suas campanhas aqui
  const CAMPAIGNS = [
    {
      key: "maes",
      title: "Especial Dia das Mães",
      url: "./Campanhas/dia-das-maes.html",
      // Janela em que fica visível (inclusive)
      start: "2026-03-01",
      end:   "2026-05-12",
    },
    {
      key: "pais",
      title: "Especial Dia dos Pais",
      url: "./campanhas/dia-dos-pais.html",
      start: "2026-08-01",
      end:   "2026-08-11",
    },
  ];

  function parseYMD(ymd) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  function isActive(c) {
    const today = nowBR();
    const start = parseYMD(c.start);
    const end = parseYMD(c.end);
    // inclui o dia final
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  }

  function ensureContainer() {
    // Container opcional na HOME: <div id="seasonalCampaignSlot"></div>
    return document.getElementById("seasonalCampaignSlot");
  }

  function injectHomeBanner(campaign) {
    const slot = ensureContainer();
    if (!slot) return;

    slot.innerHTML = `
      <a class="seasonalBanner reveal" href="${campaign.url}" aria-label="${campaign.title}">
        <div class="seasonalBanner__title">${campaign.title}</div>
        <div class="seasonalBanner__cta">Ver ofertas →</div>
      </a>
    `;
  }

  function injectMenuLink(campaign) {
    // No menu, adicione um <li id="seasonalMenuSlot"></li> onde você quer o link
    const slot = document.getElementById("seasonalMenuSlot");
    if (!slot) return;

    slot.innerHTML = `<a href="${campaign.url}">${campaign.title}</a>`;
  }

  // Encontra a primeira campanha ativa (prioridade pela ordem do array)
  const active = CAMPAIGNS.find(isActive);
  if (!active) return;

  // Ativa onde você quiser (home/menu)
  injectHomeBanner(active);
  injectMenuLink(active);
})();
