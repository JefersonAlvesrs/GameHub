(() => {
  "use strict";
  const $ = (s) => document.querySelector(s),
    $$ = (s) => document.querySelectorAll(s),
    storageKey = "gamehub-v2";
  let state;
  try {
    state = JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    state = {};
  }
  state.favorites = Array.isArray(state.favorites) ? state.favorites : [];
  state.library =
    state.library &&
    typeof state.library === "object" &&
    !Array.isArray(state.library)
      ? state.library
      : {};
  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      notify("Não foi possível salvar no navegador");
    }
  };
  const find = (id) => GAMES.find((g) => g.id === Number(id));
  const money = (n) =>
    n === 0
      ? "Grátis"
      : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const img = (g) =>
    `assets/art/${g.slug}.${NEW_ART.has(g.slug) ? "webp" : "jpg"}`;
  const NEW_ART = new Set([
    "blackout-2099",
    "echoes-of-eden",
    "midnight-circuit",
    "wild-frontier",
    "phantom-signal",
    "dream-quest",
    "starforge",
  ]);
  let toastTimer;
  function notify(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function updateHeader() {
    const n = $("#headerCount");
    if (n) n.textContent = Object.keys(state.library).length;
  }
  function card(g, library = false) {
    const fav = state.favorites.includes(g.id),
      lib = !!state.library[g.id];
    return `<article class="game-card"><a class="cover" href="jogo.html?id=${g.id}" aria-label="Ver detalhes de ${g.title}"><img loading="lazy" src="${img(g)}" alt="Arte original de ${g.title}"><span class="cover-tag">${g.year} · ${g.genre}</span></a><div class="card-body"><span class="card-genre">${g.genre}</span><h3><a href="jogo.html?id=${g.id}">${g.title}</a></h3><p>${g.tagline}</p><p class="card-synopsis">${g.synopsis || g.tagline}</p><div class="card-bottom"><span class="price">${money(g.price)}</span><span class="rating">★ ${g.rating.toFixed(1)}</span></div>${library ? `<select class="status-select" data-status="${g.id}" aria-label="Progresso de ${g.title}"><option value="want" ${state.library[g.id] === "want" ? "selected" : ""}>Quero jogar</option><option value="playing" ${state.library[g.id] === "playing" ? "selected" : ""}>Jogando</option><option value="done" ${state.library[g.id] === "done" ? "selected" : ""}>Concluído</option></select>` : ""}<div class="card-actions"><button class="icon-btn ${fav ? "selected" : ""}" data-fav="${g.id}" aria-label="${fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}: ${g.title}">${fav ? "♥ Favorito" : "♡ Favoritar"}</button><button class="icon-btn add ${lib ? "selected" : ""}" data-lib="${g.id}" aria-label="${lib ? "Remover da biblioteca" : "Adicionar à biblioteca"}: ${g.title}">${lib ? "✓ Na lista" : "+ Biblioteca"}</button></div></div></article>`;
  }
  const draw = (selector, arr, library = false) => {
    const el = $(selector);
    if (el) el.innerHTML = arr.map((g) => card(g, library)).join("");
  };
  function refresh() {
    updateHeader();
    const page = document.body.dataset.page;
    if (page === "index") {
      draw("#featuredGrid", GAMES.filter((g) => g.featured).slice(0, 4));
      const genres = ["Ação", "RPG", "Aventura", "Corrida"];
      $("#genreTiles").innerHTML = genres
        .map(
          (g) =>
            `<a class="genre-tile" href="catalogo.html?genre=${encodeURIComponent(g)}"><span>EXPLORAR GÊNERO ↗</span><strong>${g}</strong><span>${GAMES.filter((x) => x.genre === g).length} jogos disponíveis</span></a>`,
        )
        .join("");
      $("#homeRanking").innerHTML = [...GAMES]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3)
        .map(
          (g, i) =>
            `<a href="jogo.html?id=${g.id}"><img src="${img(g)}" alt=""><div><small>#0${i + 1} · ★ ${g.rating.toFixed(1)}</small><strong>${g.title}</strong><small>${g.genre}</small></div></a>`,
        )
        .join("");
    }
    if (page === "catalogo") renderCatalog();
    if (page === "favoritos") {
      const list = GAMES.filter((g) => state.favorites.includes(g.id));
      draw("#favGrid", list);
      $("#favSummary").textContent =
        `${list.length} ${list.length === 1 ? "jogo salvo" : "jogos salvos"} na sua lista de favoritos`;
      $("#favEmpty").hidden = !!list.length;
    }
    if (page === "biblioteca") renderLibrary();
    if (page === "jogo") renderDetail();
    if (page === "rankings") renderRankings();
    if (page === "colecoes") renderCollections();
  }
  function renderCatalog() {
    let q = ($("#search")?.value || "").toLocaleLowerCase("pt-BR").trim(),
      genre = $("#genre")?.value || "",
      price = $("#price")?.value || "",
      sort = $("#sort")?.value || "popular";
    let arr = GAMES.filter(
      (g) =>
        (!q ||
          `${g.title} ${g.genre} ${g.tagline} ${g.synopsis}`
            .toLocaleLowerCase("pt-BR")
            .includes(q)) &&
        (!genre || g.genre === genre) &&
        (price === "free"
          ? g.price === 0
          : price === "paid"
            ? g.price > 0
            : price === "under60"
              ? g.price <= 60
              : true),
    );
    if (sort === "rating") arr.sort((a, b) => b.rating - a.rating);
    if (sort === "recent") arr.sort((a, b) => b.year - a.year);
    if (sort === "low") arr.sort((a, b) => a.price - b.price);
    if (sort === "high") arr.sort((a, b) => b.price - a.price);
    if (sort === "name") arr.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "popular")
      arr.sort(
        (a, b) => Number(b.featured) - Number(a.featured) || a.id - b.id,
      );
    draw("#catalogGrid", arr);
    $("#resultsCount").textContent =
      `${arr.length} ${arr.length === 1 ? "jogo encontrado" : "jogos encontrados"}`;
    $("#emptyState").hidden = arr.length > 0;
  }
  function renderLibrary() {
    const ids = Object.keys(state.library).map(Number),
      all = GAMES.filter((g) => ids.includes(g.id));
    const count = (status) =>
      ids.filter((id) => state.library[id] === status).length;
    $("#libraryStats").innerHTML = [
      ["Na biblioteca", all.length],
      ["Quero jogar", count("want")],
      ["Jogando", count("playing")],
      ["Concluídos", count("done")],
    ]
      .map(
        ([k, v]) =>
          `<div class="stat"><span>${k}</span><strong>${v.toString().padStart(2, "0")}</strong></div>`,
      )
      .join("");
    const f = $("#libFilter").value;
    const filtered = all.filter(
      (g) => f === "all" || state.library[g.id] === f,
    );
    draw("#libGrid", filtered, true);
    $("#libEmpty").hidden = all.length > 0 || f !== "all";
    if (all.length && filtered.length === 0)
      $("#libGrid").innerHTML =
        '<div class="empty-state"><h2>Nenhum jogo nesta categoria</h2><p>Altere o filtro para visualizar sua coleção.</p></div>';
  }
  function renderDetail() {
    const params = new URLSearchParams(location.search),
      g = find(params.get("id")),
      el = $("#gameDetail");
    if (!g) {
      el.innerHTML =
        '<div class="empty-state"><h2>Jogo não encontrado</h2><a class="btn primary" href="catalogo.html">Voltar ao catálogo</a></div>';
      draw("#relatedGrid", GAMES.slice(0, 4));
      return;
    }
    document.title = `${g.title} | GameHub`;
    el.innerHTML = `<a class="text-link" href="catalogo.html">← Voltar ao catálogo</a><div class="detail-banner" style="margin-top:18px"><img src="${img(g)}" alt="Arte de ${g.title}"><div class="detail-banner-content"><span class="eyebrow">${g.genre.toUpperCase()} · ${g.year}</span><h1>${g.title}</h1><p>${g.tagline}</p><div class="actions"><span class="btn ghost">★ ${g.rating.toFixed(1)} / 5 · Avaliação ilustrativa</span><span class="btn ghost">${money(g.price)}</span></div></div></div><div class="detail-grid"><article class="detail-panel"><span class="eyebrow">CONHEÇA O UNIVERSO</span><h2>${g.tagline}</h2><p>${g.synopsis}</p><p>Esta página demonstra uma apresentação de produto com capa local, metadados, ações interativas e sugestões relacionadas. Não há jogo executável nem compra real.</p><div class="detail-actions"><button class="btn primary" data-lib="${g.id}">${state.library[g.id] ? "✓ Remover da biblioteca" : "+ Adicionar à biblioteca"}</button><button class="btn ghost" data-fav="${g.id}">${state.favorites.includes(g.id) ? "♥ Remover favorito" : "♡ Adicionar favorito"}</button></div></article><aside class="detail-panel"><span class="eyebrow">FICHA TÉCNICA</span><h2>Informações</h2><div class="specs"><div><span>Gênero</span><strong>${g.genre}</strong></div><div><span>Lançamento fictício</span><strong>${g.year}</strong></div><div><span>Modo</span><strong>${g.players}</strong></div><div><span>Duração estimada</span><strong>${g.duration}</strong></div><div><span>Avaliação fictícia</span><strong>★ ${g.rating.toFixed(1)} / 5</strong></div><div><span>Preço ilustrativo</span><strong>${money(g.price)}</strong></div></div></aside></div>`;
    draw(
      "#relatedGrid",
      GAMES.filter((x) => x.id !== g.id && x.genre === g.genre)
        .concat(GAMES.filter((x) => x.id !== g.id && x.genre !== g.genre))
        .slice(0, 4),
    );
  }
  function renderRankings() {
    $("#rankingsList").innerHTML = [...GAMES]
      .sort((a, b) => b.rating - a.rating || a.id - b.id)
      .slice(0, 12)
      .map(
        (g, i) =>
          `<a href="jogo.html?id=${g.id}" class="rank-item"><span class="rank-number">${String(i + 1).padStart(2, "0")}</span><img loading="lazy" src="${img(g)}" alt=""><div class="rank-info"><strong>${g.title}</strong><small>${g.genre} · ${g.year} · ${money(g.price)}</small></div><span class="rank-score">★ ${g.rating.toFixed(1)}</span><span>↗</span></a>`,
      )
      .join("");
  }
  function renderCollections() {
    const collections = [
      {
        name: "Velocidade máxima",
        desc: "Asfalto, adrenalina e circuitos futuristas.",
        genre: "Corrida",
      },
      {
        name: "Além do horizonte",
        desc: "Universos desconhecidos e histórias inesquecíveis.",
        genre: "Aventura",
      },
      {
        name: "Poder e estratégia",
        desc: "Decisões que mudam o destino de mundos inteiros.",
        genre: "RPG",
      },
      {
        name: "Alta intensidade",
        desc: "Missões, reflexos e muita ação.",
        genre: "Ação",
      },
    ];
    $("#collectionList").innerHTML = collections
      .map((c) => {
        let arr = GAMES.filter((g) => g.genre === c.genre);
        return `<article class="collection"><div class="collection-copy"><span class="eyebrow">COLEÇÃO CURADA · ${arr.length} JOGOS</span><h2>${c.name}</h2><p>${c.desc}</p><a class="btn primary" href="catalogo.html?genre=${encodeURIComponent(c.genre)}">Explorar ${c.genre} ↗</a></div><div class="collection-art">${arr
          .slice(0, 3)
          .map(
            (g) =>
              `<img loading="lazy" src="${img(g)}" alt="Arte de ${g.title}">`,
          )
          .join("")}</div></article>`;
      })
      .join("");
  }
  document.addEventListener("click", (e) => {
    const fav = e.target.closest("[data-fav]");
    if (fav) {
      let id = Number(fav.dataset.fav);
      state.favorites = state.favorites.includes(id)
        ? state.favorites.filter((x) => x !== id)
        : [...state.favorites, id];
      save();
      notify(
        state.favorites.includes(id)
          ? "Adicionado aos favoritos ♡"
          : "Removido dos favoritos",
      );
      refresh();
    }
    const lib = e.target.closest("[data-lib]");
    if (lib) {
      let id = Number(lib.dataset.lib);
      if (state.library[id]) delete state.library[id];
      else state.library[id] = "want";
      save();
      notify(
        state.library[id]
          ? "Jogo adicionado à biblioteca"
          : "Jogo removido da biblioteca",
      );
      refresh();
    }
    if (e.target.closest("#resetFilters,#emptyReset")) resetFilters();
  });
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-status]")) {
      state.library[e.target.dataset.status] = e.target.value;
      save();
      notify("Progresso atualizado");
      refresh();
    }
    if (e.target.matches("#genre,#price,#sort,#libFilter")) refresh();
  });
  document.addEventListener("input", (e) => {
    if (e.target.matches("#search")) renderCatalog();
  });
  function resetFilters() {
    ["search", "genre", "price"].forEach((id) => {
      if ($("#" + id)) $("#" + id).value = "";
    });
    if ($("#sort")) $("#sort").value = "popular";
    renderCatalog();
  }
  function init() {
    const menu = $("#menuBtn");
    menu?.addEventListener("click", () => {
      const open = $("#nav").classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
      menu.textContent = open ? "✕" : "☰";
    });
    if ($("#genre")) {
      const genres = [...new Set(GAMES.map((g) => g.genre))].sort();
      $("#genre").innerHTML += [...genres]
        .map((g) => `<option value="${g}">${g}</option>`)
        .join("");
      const initial = new URLSearchParams(location.search).get("genre");
      if (genres.includes(initial)) $("#genre").value = initial;
    }
    refresh();
  }
  init();
})();
