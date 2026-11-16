/* Test de bout en bout des parcours (à lancer depuis une page du même serveur local).
   Chaque atelier est joué comme un étudiant : un seul événement par réglage, sans réglage « de trop ». */
window.__R = { done: false, labs: {} };
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (const l of ["r1-1", "r1-10", "r1-13", "r2-9", "r3-10", "r4-8"]) {
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;left:0;top:0;width:1300px;height:850px;opacity:0.01";
    f.src = `/labs/${l}/index.html`;
    document.body.append(f);
    await new Promise((r) => (f.onload = r));
    const w = f.contentWindow, d = f.contentDocument;
    const errs = [];
    w.addEventListener("error", (e) => errs.push(e.message));
    w.confirm = () => true;
    const PC = w.LABV3_PARCOURS;
    w.localStorage.removeItem(PC.storeKey);
    w.location.reload();
    await new Promise((r) => (f.onload = r));
    await sleep(2500);
    const W = f.contentWindow, D = f.contentDocument;
    W.addEventListener("error", (e) => errs.push(e.message));
    const P = W.LABV3_PARCOURS;
    const st = () => (JSON.parse(W.localStorage.getItem(P.storeKey) || "{}").at || {});
    const $ = (s, r = D) => r.querySelector(s);
    const $$ = (s, r = D) => [...r.querySelectorAll(s)];
    const btn = (root, re) => $$("button", root).find((b) => re.test(b.textContent) && !b.disabled);
    const set1 = async (k, v) => { // un seul événement, comme une saisie au clavier
      const e = D.getElementById(k);
      if (!e) return "absent:" + k;
      e.value = v;
      e.dispatchEvent(new W.Event("input", { bubbles: true })); // une liste déroulante émet aussi « change »
      if (e.tagName === "SELECT") e.dispatchEvent(new W.Event("change", { bubbles: true }));
      await sleep(120);
      return null;
    };
    const res = {};
    for (const id of Object.keys(P.ateliers)) {
      const cfg = P.ateliers[id];
      const r = (res[id] = { steps: [] });
      try {
        $(`.nav-btn[data-atelier="${id}"]`).click();
        await sleep(900);
        const pan = $(`#atelier-${id} .v3-panel`);
        const skipR = btn(pan, /Passer le rappel/); if (skipR) { skipR.click(); await sleep(100); }
        r.rappel = !!skipR;
        // 1 · prédire : bonne réponse, raisonnement juste
        const iok = cfg.predict.opts.findIndex((o) => o.ok);
        $(`.v3-opts .v3-opt[data-i="${iok}"]`, $(".v3-body", pan)).click();
        await sleep(60);
        const good = (cfg.predict.why && cfg.predict.why[iok] || []).find((x) => !x.faux);
        if (good) { const c = $$(".v3s-reason", pan).find((b) => b.textContent === good.t); if (c) c.click(); else r.steps.push("raisonnement introuvable"); }
        await sleep(60);
        btn(pan, /^Plutôt$/).click();
        await sleep(60);
        const vb = btn(pan, /Valider ma prédiction/);
        if (!vb) { r.steps.push("validation impossible"); continue; }
        vb.click();
        await sleep(300);
        // 2 · observer : réglages de la tâche, un événement chacun
        for (const x of cfg.observe.auto || []) {
          if (x.act) { // bouton d'action de la scène 3D (ex. « Venturi »)
            const b = $$(`#atelier-${id} .v2-views button`).find((bb) => bb.textContent.trim().startsWith(x.act));
            if (!b) r.steps.push("action absente : " + x.act); else if (b.getAttribute("aria-pressed") !== "true") b.click();
            await sleep(300);
            continue;
          }
          const e = await set1(x[0], x[1]); if (e) r.steps.push(e);
        }
        await sleep(300);
        r.obs = !!(st()[id] || {}).obsDone;
        if (!r.obs) { r.steps.push("observation non validée"); continue; }
        const sk = btn(pan, /Passer cet échange/); if (sk) { sk.click(); await sleep(200); }
        const nx = btn(pan, /Voir les mesures/);
        if (!nx) { r.steps.push("pas de bouton vers l'étape 3"); continue; }
        nx.click(); await sleep(300);
        // 3 · mesurer
        const okT = cfg.measure.opts.find((o) => o.ok).t;
        const mb = $$(".v3-opt", pan).find((b) => b.querySelector("span").innerHTML === okT);
        if (!mb) { r.steps.push("option juste de l'étape 3 introuvable"); continue; }
        mb.click(); await sleep(200);
        r.expl = !!(st()[id] || {}).explOk;
        const n4 = btn(pan, /Aller plus loin →/);
        if (!n4) { r.steps.push("pas de bouton vers l'étape 4"); continue; }
        n4.click(); await sleep(300);
        // 4 · aller plus loin
        if (cfg.plus && cfg.plus.demo) {
          for (const x of cfg.plus.demo) {
            if (x.act) { const b = $$(`#atelier-${id} .v2-views button`).find((bb) => bb.textContent.trim().startsWith(x.act)); if (!b) r.steps.push("action absente : " + x.act); else if (b.getAttribute("aria-pressed") !== "true") b.click(); await sleep(300); continue; }
            const e = await set1(x[0], x[1]); if (e) r.steps.push(e);
          }
          await sleep(300);
          r.plus = !!(st()[id] || {}).plusDone;
          if (!r.plus) { r.steps.push("étape 4 non validée"); }
        } else r.plus = "sans démo";
        const n5 = btn(pan, /Diagnostic →/);
        if (n5) { n5.click(); await sleep(300); }
        // 5 · diagnostic
        if (cfg.diag && cfg.diag.fix) {
          const lb = btn(pan, /Lancer le diagnostic/);
          if (lb) { lb.click(); await sleep(400); }
          const cul = cfg.diag.culprit;
          const ctl = $$(`#atelier-${id} .ctrl`).find((c) => c.querySelector(`#${CSS.escape(cul)}`));
          if (ctl) { ctl.click(); await sleep(300); }
          await set1(cfg.diag.fix[0], cfg.diag.fix[1]);
          await sleep(700);
          r.diag = !!(st()[id] || {}).diagDone;
          if (!r.diag) r.steps.push("diagnostic non validé");
          await sleep(1100);
          const fin = $(".v3s-fin");
          if (fin) { r.fin = true; r.transfert = !!$(".v3s-q", fin); const tb = $(".v3s-q .v3-opt", fin); if (tb) tb.click(); $(".v3s-fin-x", fin).click(); }
        } else r.diag = "sans correctif";
      } catch (e) { r.steps.push("exception : " + e.message); }
    }
    window.__R.labs[l] = { errs, res };
    f.remove();
  }
  window.__R.done = true;
})();
