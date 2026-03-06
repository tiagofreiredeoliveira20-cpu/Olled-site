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
function getVisibleCards() {
  return Array.from(rail.querySelectorAll(".railCard")).filter(
    (card) => !card.classList.contains("isHidden")
  );
}

function stepSize() {
  const visibleCards = getVisibleCards();
  const card = visibleCards[0];
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
// ===== CATEGORIA SAZONAL DE VÍDEOS (ON/OFF) =====
const SEASONAL_VIDEOS = false; // true = aparece / false = some

(function toggleSeasonalVideoCategory(){
  const btn = document.getElementById("seasonalVideoCategoryBtn");
  const cards = document.querySelectorAll('.railCard[data-cat="comemorativas"]');

  // some/mostra o botão da categoria
  if (btn) btn.style.display = SEASONAL_VIDEOS ? "" : "none";

  // some/mostra os vídeos da categoria
  cards.forEach(card => {
    card.classList.toggle("isHidden", !SEASONAL_VIDEOS);
  });
})();
// ===============================
// FILTRO DE CATEGORIAS (VÍDEOS)
// ===============================
(function videoCategories() {
  const filterBtns = document.querySelectorAll(".videoFilterBtn");
  const videoCards = document.querySelectorAll(".railCard[data-video]");
  if (!filterBtns.length || !videoCards.length) return;

  function setActive(btn) {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = (btn.getAttribute("data-filter") || "all").toLowerCase().trim();
      setActive(btn);

      videoCards.forEach((card) => {
        const cat = (card.getAttribute("data-cat") || "institucional").toLowerCase().trim();
        const show = filter === "all" || cat === filter;
        card.classList.toggle("isHidden", !show);
      });
    });
  });
})();

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

  prev?.addEventListener("click", () => scrollByStep(-1));
next?.addEventListener("click", () => scrollByStep(1));

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
 // >>>>>> EDITE AQUI OS PRODUTOS <<<<<<
// (Todos agora têm "markets" editável por produto)
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
      magalu: "https://www.magazineluiza.com.br/seu-link-aqui",
      tiktok: "https://www.tiktok.com/@seu-perfil"
    }
  },

  p2: {
    badge: "Iluminação",
    title: "Lanterna De Camping Solar",
    video: "./assets/video lanterna.mp4",
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
    buy: "#",
    markets: {
      mercadolivre: "https://www.mercadolivre.com.br/seu-link-aqui",
      shopee: "https://shopee.com.br/seu-link-aqui",
      magalu: "https://www.magazineluiza.com.br/seu-link-aqui",
      tiktok: "https://www.tiktok.com/@seu-perfil"
    }
  },

  p3: {
    badge: "Linha OLLED",
    video: "./assets/video lanterna.mp4",
    title: "Placa De Reposição 200w Bivolt",
    desc: "Luz uniforme e acabamento clean para projetos que pedem visual premium.",
    img: "./assets/Placas.png",
    specs: ["LED", "Alta durabilidade"],
    features: [
      "LED de alta eficiência para reposição rápida e iluminação uniforme.",
      "Compatível com luminárias de posto 200W bivolt, garantindo desempenho confiável e economia."
    ],
    whatsapp: "https://wa.me/5511982139222?text=Olá!%20Quero%20detalhes%20do%20Produto%2003.",
    buy: "#",
    markets: {
      mercadolivre: "https://www.mercadolivre.com.br/luminaria-led-posto-gasolina-placa-reposicao-180-wts/up/MLBU1408745901",
      shopee: "https://shopee.com.br/seu-link-aqui",
      magalu: "https://www.magazineluiza.com.br/seu-link-aqui",
      tiktok: "https://www.tiktok.com/@seu-perfil"
    }
  },

  p4: {
    badge: "Linha OLLED",
    video: "./assets/video lanterna.mp4",
    title: "Lanterna Solar Emergência",
    desc: "Compacto e potente: iluminação prática para o dia a dia com ótimo alcance.",
    img: "./assets/lanterna.png",
    specs: ["Recarregável", "Resistente"],
    features: [
      "Iluminação LED potente com alcance ideal para trilhas e camping.",
      "Design resistente e portátil para uso em qualquer situação."
    ],
    whatsapp: "https://wa.me/5511982139222?text=Olá!%20Quero%20detalhes%20do%20Produto%2004.",
    buy: "#",
    markets: {
      mercadolivre: "https://www.mercadolivre.com.br/luminaria-led-posto-gasolina-placa-reposicao-180-wts/up/MLBU1408745901",
      shopee: "https://shopee.com.br/seu-link-aqui",
      magalu: "https://www.magazineluiza.com.br/seu-link-aqui",
      tiktok: "https://www.tiktok.com/@seu-perfil"
    }
  },

  p5: {
    badge: "Linha OLLED",
    video: "./assets/V[ideo cadeado 20mm.mp4",
    title: "Cadeado De 20mm",
    desc: "Segurança e resistência: construção robusta com padrão de qualidade OLLED.",
    img: "./assets/Cadeados.png",
    specs: ["Segurança", "Aço"],
    features: [
      "Estrutura compacta com corpo resistente para segurança diária.",
      "Ideal para mochilas, armários, malas e pequenos portões."
    ],
    whatsapp: "https://wa.me/5511982139222?text=Olá!%20Quero%20detalhes%20do%20Produto%2005.",
    buy: "#",
    markets: {
      mercadolivre: "https://www.mercadolivre.com.br/cartela-de-cadeado-20mm-12un-para-malas-bolsas-oferta/up/MLBU1412732924",
      shopee: "https://shopee.com.br/product/228298477/18898781877/",
      magalu: "https://www.magazineluiza.com.br/seu-link-aqui",
      tiktok: "https://www.tiktok.com/@seu-perfil"
    }
  },

  p6: {
    badge: "Linha OLLED",
    video: "./assets/Cadeado 0mm.mp4",
    title: "Cadeado De 30mm",
    desc: "Mais proteção no uso diário, com design compacto e durabilidade superior.",
    img: "./assets/cadeado.png",
    specs: ["Compacto", "Resistente"],
    features: [
      "Corpo reforçado com maior resistência contra arrombamentos.",
      "Perfeito para portões, correntes, armários e aplicações externas."
    ],
    whatsapp: "https://wa.me/5511982139222?text=Olá!%20Quero%20detalhes%20do%20Produto%2006.",
    buy: "#",
    markets: {
      mercadolivre: "https://www.mercadolivre.com.br/kit-12-cadeados-lt-30mm-resistente-com-chave-reforcado/up/MLBU1976400923",
      shopee: "https://shopee.com.br/seu-link-aqui",
      magalu: "https://www.magazineluiza.com.br/seu-link-aqui",
      tiktok: "https://www.tiktok.com/@seu-perfil"
    }
  },

  p7: {
    badge: "Linha OLLED",
    video: "./assets/video lanterna.mp4",
    title: "Refletor 200w Testeira",
    desc: "Design moderno + eficiência: feito para ambientes comerciais e profissionais.",
    // ⚠️ Se você renomeou a imagem para sem espaços (recomendado), atualize aqui também:
    // img: "./assets/refletor-200w.png",
    img: "./assets/Refletor de 200w.png",
    specs: ["200W", "Bivolt"],
    features: [
      "Alta potência de iluminação para áreas externas e industriais.",
      "Sistema bivolt com baixo consumo e longa durabilidade."
    ],
    whatsapp: "https://wa.me/5511982139222?text=Olá!%20Quero%20detalhes%20do%20Produto%2007.",
    buy: "#",
    markets: {
      mercadolivre: "https://www.mercadolivre.com.br/seu-link-aqui",
      shopee: "https://shopee.com.br/seu-link-aqui",
      magalu: "https://www.magazineluiza.com.br/seu-link-aqui",
      tiktok: "https://www.tiktok.com/@seu-perfil"
    }
  },

  p8: {
    badge: "Linha OLLED",
    video: "./assets/video lanterna.mp4",
    title: "Massageador Tubarão Relaxante",
    desc: "Relaxamento poderoso com design moderno — alívio muscular rápido para seu dia a dia.",
    img: "./assets/Massageador.png",
    specs: ["Bivolt", "Ergonômico"],
    features: [
      "Vibração potente que ajuda a aliviar tensões musculares.",
      "Design ergonômico para uso confortável em diversas regiões do corpo."
    ],
    whatsapp: "https://wa.me/5511982139222?text=Olá!%20Quero%20detalhes%20do%20Produto%2008.",
    buy: "#",
    markets: {
      mercadolivre: "https://www.mercadolivre.com.br/massageador-ydh-pessoal-0732-infravermelho-tubarao/up/MLBU2375298930",
      shopee: "https://shopee.com.br/product/228298477/22193494975/",
      magalu: "https://www.magazineluiza.com.br/seu-link-aqui",
      tiktok: "https://www.tiktok.com/@seu-perfil"
    }
  },

  p9: {
    badge: "Linha OLLED",
    video: "./assets/video lanterna.mp4",
    title: "Máquina de Cortar Cabelo Dragão",
    desc: "Potência, precisão e estilo em um só equipamento — ideal para cortes profissionais ou uso em casa.",
    img: "./assets/Dragão.png",
    specs: ["Potente", "Precisão"],
    features: [
      "Motor potente para cortes rápidos e precisos.",
      "Lâminas afiadas de alta durabilidade para acabamento profissional."
    ],
    whatsapp: "https://wa.me/5511982139222?text=Olá!%20Quero%20detalhes%20do%20Produto%2009.",
    buy: "#",
    markets: {
      mercadolivre: "https://www.mercadolivre.com.br/maquina-corta-cabelo-barba-recarregavel-varios-pentes-dragao/up/MLBU3318196956",
      shopee: "https://shopee.com.br/product/228298477/22098773464/",
      magalu: "https://www.magazineluiza.com.br/seu-link-aqui",
      tiktok: "https://www.tiktok.com/@seu-perfil"
    }
  },

  p10: {
    badge: "Linha OLLED",
    video: "./assets/video lanterna.mp4",
    title: "Interruptor com Controle",
    desc: "Controle sua iluminação à distância com praticidade e segurança — tecnologia moderna para deixar sua casa mais inteligente.",
    img: "./assets/Interruptor.png",
    specs: ["Controle remoto", "Instalação simples"],
    features: [
      "Controle remoto que permite ligar e desligar a iluminação à distância.",
      "Instalação simples e compatível com diversos tipos de lâmpadas."
    ],
    whatsapp: "https://wa.me/5511982139222?text=Olá!%20Quero%20detalhes%20do%20Produto%2010.",
    buy: "#",
    markets: {
      mercadolivre: "https://www.mercadolivre.com.br/interruptor-4-vias-controle-remoto-sem-fio-para-4-lampadas/up/MLBU3634101737",
      shopee: "https://shopee.com.br/product/228298477/19197159566/",
      magalu: "https://www.magazineluiza.com.br/seu-link-aqui",
      tiktok: "https://www.tiktok.com/@seu-perfil"
    }
  }
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
  function nowBR() {
    return new Date();
  }

  const CAMPAIGNS = [
    {
      key: "maes",
      title: "Especial Dia das Mães",
      url: "./Campanhas/dia-das-maes.html",
      img: "./Campanhas/Imagens/banner dia das maes site.png",
      start: "2026-05-01",
      end: "2026-05-12",
    },
    {
      key: "pais",
      title: "Especial Dia dos Pais",
      url: "./Campanhas/dia-dos-pais.html",
      img: "./assets/banners/banner-pais.jpg",
      start: "2026-08-01",
      end: "2026-08-11",
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
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  }

  function ensureContainer() {
    return document.getElementById("seasonalCampaignSlot");
  }

  function injectHomeCarousel(campaigns) {
    const slot = ensureContainer();
    if (!slot) return;

    const slides = campaigns
      .map(
        (c) => `
        <a class="seasonalSlide" href="${c.url}" aria-label="${c.title}">
          <img class="seasonalSlide__img" src="${c.img}" alt="${c.title}" loading="lazy">
        </a>
      `
      )
      .join("");

    slot.innerHTML = `
      <div class="seasonalCarousel" aria-label="Campanhas sazonais">
        <div class="seasonalViewport">
          <div class="seasonalTrack">
            ${slides}
          </div>
        </div>
      </div>
    `;

    const track = slot.querySelector(".seasonalTrack");
    const items = Array.from(slot.querySelectorAll(".seasonalSlide"));
    if (items.length <= 1) return;

    let index = 0;
    const setIndex = (i) => {
      index = (i + items.length) % items.length;
      track.style.transform = `translateX(${-index * 100}%)`;
    };

    let timer = setInterval(() => setIndex(index + 1), 5000);

    slot.addEventListener("mouseenter", () => {
      clearInterval(timer);
      timer = null;
    });

    slot.addEventListener("mouseleave", () => {
      if (!timer) timer = setInterval(() => setIndex(index + 1), 5000);
    });

    setIndex(0);
  } // ✅ FECHA A FUNÇÃO AQUI (isso estava faltando no seu)

  function injectMenuLink(campaign) {
    const slotDesktop = document.getElementById("seasonalMenuSlot");
    const slotMobile = document.getElementById("seasonalMenuSlotMobile");

    const html = `
      <a class="seasonalNavLink" href="${campaign.url}">
        🎁 Especial Dia das Mães
      </a>
    `;

    if (slotDesktop) slotDesktop.innerHTML = html;
    if (slotMobile) slotMobile.innerHTML = html;
  }

  const PREVIEW = false; // deixe true só pra testar

  const actives = PREVIEW ? CAMPAIGNS : CAMPAIGNS.filter(isActive);
  if (!actives.length) return;

  // ✅ Menu primeiro
  injectMenuLink(actives[0]);
  // ✅ Banner depois
  injectHomeCarousel(actives);
})();
// BOTÃO VOLTAR AO TOPO
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if(window.scrollY > 300){
    backToTop.style.display = "flex";
  } else{
    backToTop.style.display = "none";
  }
});

backToTop.addEventListener("click", () => {
  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
});
// ===============================
// FILTRO DE CATEGORIAS DOS VÍDEOS
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".videoFilterBtn");
  const videos = document.querySelectorAll("#videoRail .railCard");

  console.log("Filtro vídeos:", { buttons: buttons.length, videos: videos.length });

  if (!buttons.length || !videos.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = (button.getAttribute("data-filter") || "all").trim().toLowerCase();

      // ativa botão
      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // animação: fade out
videos.forEach(video => video.classList.add("isFadingOut"));

setTimeout(() => {

  videos.forEach(video => {
const cats = (video.getAttribute("data-cat") || "")
  .toLowerCase()
  .trim()
  .split(/\s+/);

const show = filter === "all" || cats.includes(filter);

    video.classList.toggle("isHidden", !show);
  });

  const visible = Array.from(videos).filter(v => !v.classList.contains("isHidden"));

  visible.forEach(v => {
    v.classList.remove("isFadingOut");
    v.classList.add("isFadingIn");
  });

  requestAnimationFrame(() => {
    visible.forEach(v => {
      v.classList.remove("isFadingIn");
    });
  });

},160);
    });
  });
});
// ===============================
// BOTÃO VOLTAR AO TOPO (FIX)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const backToTop = document.getElementById("backToTop");
  if (!backToTop) return;

  // mostrar/esconder
  const toggleBackToTop = () => {
    backToTop.style.display = (window.scrollY > 300) ? "flex" : "none";
  };

  window.addEventListener("scroll", toggleBackToTop);
  toggleBackToTop();

  // clique
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
// ===== TOPBAR HEADER ROTATIVA ESTÁVEL =====
document.addEventListener("DOMContentLoaded", () => {
  const pill = document.querySelector(".topbar-header");
  const badge = document.querySelector(".topbar-badge");
  const rotator = document.getElementById("topbarRotator");
  const dot = document.getElementById("topbarDot");
  const messages = document.querySelectorAll(".topbar-message");

  if (!pill || !badge || !rotator || !dot || !messages.length) return;

  let current = 0;
  let locked = false;

  function nextMessage() {
    if (locked) return;
    locked = true;

    const currentMsg = messages[current];
    const nextIndex = (current + 1) % messages.length;
    const nextMsg = messages[nextIndex];
    const nextColor = nextMsg.dataset.color || "#7c3aed";

    dot.style.background = nextColor;

    rotator.classList.remove("animating");
    void rotator.offsetWidth;
    rotator.classList.add("animating");

    setTimeout(() => {
      // muda a cor da cápsula e do badge junto
      pill.style.background = nextColor;
      badge.style.background = nextColor;

      currentMsg.classList.remove("active");
      nextMsg.classList.add("active");

      nextMsg.style.color = "#ffffff";
      pill.style.color = "#ffffff";
    }, 220);

    setTimeout(() => {
      rotator.classList.remove("animating");
      current = nextIndex;
      locked = false;
    }, 1400);
  }

  setInterval(nextMessage, 2600);
});