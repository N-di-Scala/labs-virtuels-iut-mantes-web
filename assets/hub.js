(function () {
  const doc = document;
  const ytMap = window.YOUTUBE_IDS || {};
  const labsMeta = window.IUT_LABS_META || [];

  /* =====================================================================
     1. Lecture unifiée de la progression locale (localStorage navigateur)
     ===================================================================== */
  function safeJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function readAll() {
    const byLab = {};
    let totalDone = 0;
    let totalStarted = 0;
    let totalWs = 0;
    let totalStars = 0;
    let latest = null;

    labsMeta.forEach((m) => {
      const pStore = safeJSON(m.storeKey) || {};
      const atMap = pStore.at || {};
      const v1Store = safeJSON(m.v1Key) || {};
      const v1Stars = v1Store.stars || {};
      const v1Expl = v1Store.explored || {};

      let done = 0;
      let started = 0;
      let stars = 0;
      let nextWs = null;
      const wsStates = {};

      (m.workshops || []).forEach((w) => {
        const a = atMap[w.id] || {};
        const isDone = !!(a.done || a.diagDone);
        const steps = isDone ? 5 : (a.pred != null ? 1 : 0) + (a.obsDone ? 1 : 0) + (a.explOk ? 1 : 0) + (a.plusDone ? 1 : 0) + (a.diagDone ? 1 : 0);
        const isStarted = steps > 0 || !!v1Expl[w.id];
        const isStar = !!(v1Stars[w.id] || (a.obsDone && a.explOk) || isDone);
        if (isDone) done++;
        if (isStarted) started++;
        if (isStar) stars++;
        if (!isDone && !nextWs) nextWs = w;
        wsStates[w.id] = { done: isDone, started: isStarted, steps, star: isStar, label: w.label };
      });

      const count = (m.workshops || []).length;
      totalWs += count;
      totalDone += done;
      totalStarted += started;
      totalStars += stars;

      const lastSeen = +pStore.lastSeen || (started > 0 ? 1 : 0);
      const targetWs = nextWs || (m.workshops && m.workshops[0]) || null;
      const rec = {
        id: m.id,
        code: m.code,
        title: m.title,
        accent: m.accent,
        total: count,
        done,
        started,
        stars,
        lastSeen,
        nextWs: targetWs,
        ws: wsStates,
      };
      byLab[m.id] = rec;
      if (started > 0 && (!latest || lastSeen > latest.lastSeen || (lastSeen === latest.lastSeen && done < count))) {
        latest = rec;
      }
    });

    return { byLab, totalDone, totalStarted, totalWs, totalStars, latest };
  }

  function progressKeys() {
    const keys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k !== "iut_mantes_theme" && k !== "labv2_sound" && k !== "labs-lang" && k !== "labs-i18n-collect") {
          keys.push(k);
        }
      }
    } catch (_) {}
    return keys;
  }

  function exportFile() {
    const data = { app: "labs-virtuels-iut-mantes", v: 1, date: new Date().toISOString(), lab: "portail", items: {} };
    progressKeys().forEach((k) => {
      try { data.items[k] = localStorage.getItem(k); } catch (_) {}
    });
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = doc.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "progression-labs-" + new Date().toISOString().slice(0, 10) + ".json";
    doc.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importFile() {
    const f = doc.createElement("input");
    f.type = "file";
    f.accept = "application/json,.json";
    f.addEventListener("change", () => {
      const file = f.files && f.files[0];
      if (!file) return;
      file.text().then((t) => {
        let d = null;
        try { d = JSON.parse(t); } catch (_) {}
        if (!d || d.app !== "labs-virtuels-iut-mantes" || !d.items) {
          alert("Ce fichier n’est pas un fichier de progression des laboratoires virtuels.");
          return;
        }
        if (!confirm("Charger la progression contenue dans ce fichier sur ce navigateur ?")) return;
        Object.entries(d.items).forEach(([k, v]) => {
          try { localStorage.setItem(k, v); } catch (_) {}
        });
        location.reload();
      });
    });
    f.click();
  }

  function resetAll() {
    if (!confirm("Effacer toute la progression enregistrée sur ce navigateur (utile en fin de séance sur un PC partagé) ?")) return;
    progressKeys().forEach((k) => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
    location.reload();
  }

  window.IUT_PROGRESS = { readAll, exportFile, importFile, resetAll };

  function renderPortalProgress() {
    if (!labsMeta.length) return;
    const snap = readAll();

    // Bandeau d'accueil (index.html)
    const host = doc.querySelector("[data-my-progress]");
    if (host) {
      host.hidden = false;
      if (snap.totalStarted > 0) {
        const pct = snap.totalWs ? Math.round((snap.totalDone / snap.totalWs) * 100) : 0;
        const lat = snap.latest;
        const resumeHref = lat
          ? "labs/" + lat.id + "/index.html" + (lat.nextWs && lat.done < lat.total ? "#atelier=" + lat.nextWs.id : "")
          : "#semestres";
        const resumeLbl = lat
          ? (lat.done < lat.total && lat.nextWs
              ? "Reprendre " + lat.code + " · " + lat.nextWs.label + " →"
              : "Revoir " + lat.code + " →")
          : "Choisir un atelier →";
        host.innerHTML =
          '<div class="mp-main">' +
            '<div class="mp-info">' +
              '<p class="mp-kicker">Ma progression personnelle sur cet appareil</p>' +
              '<div class="mp-nums">' +
                '<span><b>' + snap.totalDone + ' / ' + snap.totalWs + '</b> ateliers terminés</span>' +
                (snap.totalStarted > snap.totalDone ? '<span><b>' + (snap.totalStarted - snap.totalDone) + '</b> en cours</span>' : '') +
                '<span><b>★ ' + snap.totalStars + '</b> étoiles</span>' +
              '</div>' +
              '<div class="mp-bar" aria-hidden="true"><i style="width:' + Math.max(4, pct) + '%"></i></div>' +
              '<p class="mp-priv">Enregistré uniquement dans le stockage local de votre navigateur : aucun autre étudiant ne voit votre avancement.</p>' +
            '</div>' +
            '<div class="mp-actions">' +
              '<a class="btn primary" href="' + resumeHref + '">' + resumeLbl + '</a>' +
              '<div class="mp-links">' +
                '<button type="button" class="mp-link" data-mp="export">Sauvegarder (.json)</button>' +
                '<button type="button" class="mp-link" data-mp="import">Importer (.json)</button>' +
                '<button type="button" class="mp-link danger" data-mp="reset">Poste partagé : effacer</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      } else {
        host.innerHTML =
          '<div class="mp-empty">' +
            '<span><b>Suivi individuel local :</b> votre avancement s’enregistrera automatiquement sur votre navigateur (invisible des autres étudiants).</span>' +
            '<button type="button" class="mp-link" data-mp="import">Reprendre depuis un fichier .json →</button>' +
          '</div>';
      }
      host.querySelectorAll("[data-mp]").forEach((b) => {
        b.addEventListener("click", () => {
          const act = b.getAttribute("data-mp");
          if (act === "export") exportFile();
          else if (act === "import") importFile();
          else if (act === "reset") resetAll();
        });
      });
    }

    // Lignes de laboratoires sur l'accueil
    doc.querySelectorAll("[data-lab-row]").forEach((row) => {
      const id = row.getAttribute("data-lab-row");
      const r = snap.byLab[id];
      if (!r || !r.started) return;
      row.classList.toggle("is-done", r.done === r.total && r.total > 0);
      row.classList.add("has-prog");
      const em = row.querySelector("em");
      if (em) {
        em.textContent =
          (r.done === r.total ? "✓ " : "◐ ") +
          r.done + "/" + r.total +
          (r.stars ? " · ★ " + r.stars : "");
      }
      if (r.done < r.total && r.nextWs) {
        row.setAttribute("href", "labs/" + id + "/index.html#atelier=" + r.nextWs.id);
      }
    });

    // Cartes de laboratoires sur les pages semestres (s1..s4)
    doc.querySelectorAll("[data-lab-prog]").forEach((pill) => {
      const id = pill.getAttribute("data-lab-prog");
      const r = snap.byLab[id];
      if (!r || !r.started) return;
      pill.hidden = false;
      pill.classList.toggle("done", r.done === r.total && r.total > 0);
      pill.textContent =
        (r.done === r.total ? "✓ Parcours terminé (" : "◐ Progression : ") +
        r.done + "/" + r.total + (r.done === r.total ? ")" : "") +
        (r.stars ? " · ★ " + r.stars : "");
    });

    doc.querySelectorAll("[data-ws-chip]").forEach((chip) => {
      const [labId, wsId] = (chip.getAttribute("data-ws-chip") || "").split(":");
      const r = snap.byLab[labId];
      const w = r && r.ws && r.ws[wsId];
      if (!w) return;
      chip.classList.toggle("is-done", w.done);
      chip.classList.toggle("is-started", !w.done && w.started);
      chip.classList.toggle("is-star", w.star);
      chip.title = w.done
        ? "Atelier terminé" + (w.star ? " · Étoile obtenue" : "")
        : w.started
        ? "En cours (" + w.steps + "/5 étapes)"
        : "Ouvrir directement cet atelier";
    });

    doc.querySelectorAll("[data-lab-cta]").forEach((cta) => {
      const id = cta.getAttribute("data-lab-cta");
      const r = snap.byLab[id];
      if (!r || !r.started || r.done >= r.total || !r.nextWs) return;
      const baseHref = cta.getAttribute("href").split("#")[0];
      cta.setAttribute("href", baseHref + "#atelier=" + r.nextWs.id);
      cta.textContent = "Reprendre (" + r.nextWs.label + ") →";
    });
  }

  renderPortalProgress();
  window.addEventListener("storage", renderPortalProgress);

  /* =====================================================================
     2. Galerie & Visionneuse intégrée (Lightbox zoom + vidéo + lien atelier)
     ===================================================================== */
  const itemsByKey = {};
  const labLists = {};

  doc.querySelectorAll(".fig").forEach((fig) => {
    const key = fig.getAttribute("data-key");
    const lab = fig.getAttribute("data-lab") || (key ? key.split("/")[0] : "");
    const rec = ytMap[key] || {};
    const slot = fig.querySelector(".yt");
    const vidPill = fig.querySelector("[data-vid-pill]");
    const item = {
      key,
      lab,
      img: fig.getAttribute("data-img") || (fig.querySelector("img") && fig.querySelector("img").getAttribute("src")) || "",
      title: fig.getAttribute("data-title") || rec.title || "",
      vid: rec.id || "",
      mp4: rec.mp4Url || "",
      wsUrl: fig.getAttribute("data-ws") || "",
      wsLabel: fig.getAttribute("data-ws-label") || rec.atelierLabel || "",
    };
    itemsByKey[key] = item;
    (labLists[lab] = labLists[lab] || []).push(item);

    if (rec.id || rec.mp4Url) {
      if (vidPill) vidPill.hidden = false;
      if (slot) {
        slot.hidden = false;
        const btn = doc.createElement("button");
        btn.type = "button";
        btn.className = "fig-act vid";
        btn.textContent = "▶ Voir la vidéo";
        btn.addEventListener("click", () => openLightbox(key, "video"));
        slot.innerHTML = "";
        slot.appendChild(btn);
      }
    }
  });

  doc.querySelectorAll("[data-open-lightbox]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openLightbox(btn.getAttribute("data-open-lightbox"), "image");
    });
  });

  doc.querySelectorAll("[data-toggle-gallery]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-toggle-gallery");
      const gallery = doc.getElementById("g-" + id);
      if (!gallery) return;
      const willOpen = gallery.hidden;
      doc.querySelectorAll(".lab-card .gallery").forEach((g) => { g.hidden = true; });
      doc.querySelectorAll("[data-toggle-gallery]").forEach((b) => { b.setAttribute("aria-expanded", "false"); });
      if (willOpen) {
        gallery.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        gallery.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  });

  let lb = null;
  let curList = [];
  let curIdx = 0;
  let curMode = "image";
  let zoomed = false;

  function ensureLightbox() {
    if (lb) return lb;
    lb = doc.createElement("div");
    lb.className = "lb-backdrop";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Visionneuse d’infographies et vidéos");
    lb.innerHTML =
      '<div class="lb-dialog">' +
        '<header class="lb-head">' +
          '<div class="lb-meta"><span class="lb-count" data-lb-count></span><h3 class="lb-title" data-lb-title></h3></div>' +
          '<div class="lb-tabs">' +
            '<button type="button" class="lb-tab on" data-lb-mode="image">Infographie HD</button>' +
            '<button type="button" class="lb-tab" data-lb-mode="video" data-lb-vidtab hidden>▶ Vidéo expliquée</button>' +
            '<button type="button" class="lb-tab" data-lb-zoom title="Zoomer / dézoomer sur l’infographie">🔍 Loupe</button>' +
          '</div>' +
          '<button type="button" class="lb-close" data-lb-close aria-label="Fermer la visionneuse">×</button>' +
        '</header>' +
        '<div class="lb-stage" data-lb-stage>' +
          '<button type="button" class="lb-nav prev" data-lb-prev aria-label="Fiche précédente">‹</button>' +
          '<div class="lb-viewport" data-lb-vp></div>' +
          '<button type="button" class="lb-nav next" data-lb-next aria-label="Fiche suivante">›</button>' +
        '</div>' +
        '<footer class="lb-foot">' +
          '<a class="btn primary lb-ws" data-lb-ws href="#">Manipuler cette notion dans l’atelier 3D →</a>' +
          '<div class="lb-ext">' +
            '<a class="lb-link" data-lb-raw href="#" target="_blank" rel="noopener">Ouvrir l’image seule ↗</a>' +
            '<a class="lb-link" data-lb-yt href="#" target="_blank" rel="noopener" hidden>Ouvrir sur YouTube ↗</a>' +
          '</div>' +
        '</footer>' +
      '</div>';
    doc.body.appendChild(lb);

    lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
    lb.querySelector("[data-lb-close]").addEventListener("click", closeLightbox);
    lb.querySelector("[data-lb-prev]").addEventListener("click", () => stepLightbox(-1));
    lb.querySelector("[data-lb-next]").addEventListener("click", () => stepLightbox(1));
    lb.querySelectorAll("[data-lb-mode]").forEach((b) => {
      b.addEventListener("click", () => {
        curMode = b.getAttribute("data-lb-mode");
        zoomed = false;
        renderLightbox();
      });
    });
    lb.querySelector("[data-lb-zoom]").addEventListener("click", () => {
      if (curMode !== "image") curMode = "image";
      zoomed = !zoomed;
      renderLightbox();
    });
    doc.addEventListener("keydown", (e) => {
      if (!lb || lb.hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") stepLightbox(-1);
      else if (e.key === "ArrowRight") stepLightbox(1);
    });
    return lb;
  }

  function openLightbox(key, mode) {
    const it = itemsByKey[key];
    if (!it) return;
    ensureLightbox();
    curList = labLists[it.lab] || [it];
    curIdx = Math.max(0, curList.indexOf(it));
    curMode = mode === "video" && (it.vid || it.mp4) ? "video" : "image";
    zoomed = false;
    lb.hidden = false;
    doc.documentElement.classList.add("lb-lock");
    renderLightbox();
    lb.querySelector("[data-lb-close]").focus();
  }

  function closeLightbox() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    lb.querySelector("[data-lb-vp]").innerHTML = "";
    doc.documentElement.classList.remove("lb-lock");
  }

  function stepLightbox(dir) {
    if (!curList.length) return;
    curIdx = (curIdx + dir + curList.length) % curList.length;
    const it = curList[curIdx];
    if (curMode === "video" && !it.vid && !it.mp4) curMode = "image";
    zoomed = false;
    renderLightbox();
  }

  function renderLbYtCard(wrap, it, ytWatch) {
    const safeT = (it.title || "").replace(/"/g, "&quot;");
    const thumb = it.vid ? "https://i.ytimg.com/vi/" + encodeURIComponent(it.vid) + "/hqdefault.jpg" : it.img;
    wrap.innerHTML =
      '<a class="lb-ytcard" href="' + ytWatch + '" target="_blank" rel="noopener">' +
        '<img class="lb-ytbg" src="' + thumb + '" alt="' + safeT + '" />' +
        '<div class="lb-ytshade">' +
          '<span class="lb-ytplay" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span>' +
          '<b>Lancer la capsule vidéo commentée sur YouTube ↗</b>' +
          '<small>Ouverture locale hors serveur web : cliquez pour ouvrir directement la vidéo sans erreur de lecteur intégré.</small>' +
        '</div>' +
      '</a>';
    const bg = wrap.querySelector(".lb-ytbg");
    if (bg && it.img) bg.addEventListener("error", () => { if (bg.src !== it.img) bg.src = it.img; }, { once: true });
  }

  function renderLightbox() {
    const it = curList[curIdx];
    if (!it) return;
    lb.querySelector("[data-lb-count]").textContent = (it.lab || "").toUpperCase() + " · Fiche " + (curIdx + 1) + " / " + curList.length;
    lb.querySelector("[data-lb-title]").textContent = it.title;
    const vidTab = lb.querySelector("[data-lb-vidtab]");
    vidTab.hidden = !(it.vid || it.mp4);
    lb.querySelectorAll("[data-lb-mode]").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-lb-mode") === curMode);
    });
    const zoomBtn = lb.querySelector("[data-lb-zoom]");
    zoomBtn.hidden = curMode !== "image";
    zoomBtn.classList.toggle("on", zoomed);

    const vp = lb.querySelector("[data-lb-vp]");
    vp.classList.toggle("is-zoomed", zoomed && curMode === "image");
    const isHttp = location.protocol === "http:" || location.protocol === "https:";
    const ytWatch = it.vid ? "https://www.youtube.com/watch?v=" + encodeURIComponent(it.vid) : "";
    if (curMode === "video" && (it.vid || it.mp4)) {
      if (isHttp && it.vid) {
        vp.innerHTML =
          '<div class="lb-vidwrap"><iframe src="https://www.youtube-nocookie.com/embed/' +
          encodeURIComponent(it.vid) +
          '?rel=0&autoplay=1&origin=' + encodeURIComponent(location.origin) + '" title="' + it.title.replace(/"/g, "&quot;") +
          '" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>';
      } else {
        vp.innerHTML = '<div class="lb-vidwrap"></div>';
        const wrap = vp.querySelector(".lb-vidwrap");
        if (it.mp4) {
          const vidEl = doc.createElement("video");
          vidEl.controls = true;
          vidEl.autoplay = true;
          vidEl.playsInline = true;
          vidEl.preload = "metadata";
          if (it.img) vidEl.poster = it.img;
          vidEl.addEventListener("error", () => {
            if (ytWatch) renderLbYtCard(wrap, it, ytWatch);
          }, { once: true });
          vidEl.src = it.mp4;
          wrap.appendChild(vidEl);
        } else if (ytWatch) {
          renderLbYtCard(wrap, it, ytWatch);
        }
      }
    } else {
      vp.innerHTML = '<img src="' + it.img + '" alt="' + it.title.replace(/"/g, "&quot;") + '" />';
      const imgEl = vp.querySelector("img");
      imgEl.addEventListener("click", () => {
        zoomed = !zoomed;
        vp.classList.toggle("is-zoomed", zoomed);
        zoomBtn.classList.toggle("on", zoomed);
      });
    }

    const wsBtn = lb.querySelector("[data-lb-ws]");
    if (it.wsUrl) {
      wsBtn.hidden = false;
      wsBtn.href = it.wsUrl;
      wsBtn.innerHTML = '<span>Manipuler cette notion dans l’atelier</span> · <b>' + (it.wsLabel || "3D") + '</b> →';
    } else {
      wsBtn.hidden = true;
    }

    const rawA = lb.querySelector("[data-lb-raw]");
    rawA.href = it.img;
    const ytA = lb.querySelector("[data-lb-yt]");
    if (it.vid) {
      ytA.hidden = false;
      ytA.href = ytWatch;
    } else {
      ytA.hidden = true;
    }

    const multi = curList.length > 1;
    lb.querySelector("[data-lb-prev]").hidden = !multi;
    lb.querySelector("[data-lb-next]").hidden = !multi;
  }
})();
