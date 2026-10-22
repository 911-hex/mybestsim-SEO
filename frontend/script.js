document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) window.lucide.createIcons();

  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");

  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    toggle.innerHTML = open
      ? '<i data-lucide="x"></i>'
      : '<i data-lucide="menu"></i>';

    if (window.lucide) window.lucide.createIcons();
  });

  nav?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");

      if (toggle) toggle.innerHTML = '<i data-lucide="menu"></i>';
      if (window.lucide) window.lucide.createIcons();
    });
  });

  const sections = [...document.querySelectorAll(".article-section[id]")];
  const tocLinks = [...document.querySelectorAll(".toc-link")];

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          tocLinks.forEach(link => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        }
      });
    }, { rootMargin: "-20% 0px -65% 0px" });

    sections.forEach(section => observer.observe(section));
  }
});


/* Simulateur de préparation de connexion en croisière */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cruisePlannerForm");
  const result = document.getElementById("cruisePlannerResult");

  if (!form || !result) return;

  const destinations = {
    mediterranee: "Méditerranée",
    caraibes: "Caraïbes",
    nord: "Europe du Nord",
    multi: "plusieurs régions / autres pays"
  };

  const durations = {
    "3": "1 à 3 jours",
    "7": "7 jours",
    "14": "8 à 14 jours",
    "15": "plus de 14 jours"
  };

  const usages = {
    light: "essentiel",
    regular: "régulier",
    intensive: "intensif"
  };

  const atSeaOptions = {
    offline: "contenus hors ligne",
    wifi: "Wi-Fi du navire",
    maritime: "offre maritime dédiée"
  };

  form.addEventListener("submit", event => {
    event.preventDefault();

    const destination = form.elements.destination.value;
    const duration = form.elements.duration.value;
    const usage = form.elements.usage.value;
    const atSea = form.elements.atSea.value;

    const checklist = [];

    /* Les conseils portent sur les vérifications à effectuer.
       Ils ne certifient jamais la couverture d'une offre. */
    const destinationAdvice = {
      mediterranee:
        "Dressez la liste de chaque port et de chaque pays visité, y compris les escales hors UE. Vérifiez chaque destination dans les conditions officielles du forfait envisagé. Le nom « Méditerranée » ne garantit pas que toutes les escales soient incluses.",
      caraibes:
        "Vérifiez chaque île et territoire séparément : des destinations proches peuvent relever de pays, territoires ou réseaux différents. Ne supposez pas qu'un forfait couvrant une partie des Caraïbes couvre tout l'itinéraire.",
      nord:
        "Vérifiez chaque pays et chaque escale, notamment les territoires ou destinations qui pourraient être exclus d'une offre présentée comme européenne. Seule la liste officielle du fournisseur permet de confirmer les destinations incluses.",
      multi:
        "Contrôlez chaque pays et territoire un par un. Une offre régionale ne signifie pas automatiquement que toutes les escales sont incluses. Si une destination n'est pas clairement indiquée, demandez confirmation au fournisseur."
    };

    checklist.push({
      title: "Vérifier les escales de votre itinéraire",
      detail: destinationAdvice[destination]
    });

    checklist.push({
      title: "Confirmer la couverture de l'eSIM à terre",
      detail:
        "Consultez la liste officielle des pays et territoires inclus, les réseaux partenaires, les exclusions et les conditions du fournisseur. Ce simulateur ne vérifie pas la couverture en direct et ne peut pas garantir la disponibilité ou la qualité du réseau à chaque escale."
    });

    const durationTitle = {
      "3": "Vérifier la validité pour une courte croisière",
      "7": "Faire correspondre la validité aux 7 jours de voyage",
      "14": "Prévoir la validité pour 8 à 14 jours",
      "15": "Vérifier les conditions pour plus de 14 jours"
    };

    const durationDetails = {
      "3":
        "Vérifiez si la validité commence à l'achat, à l'installation ou à la première connexion, et si elle couvre vos éventuels jours avant ou après la croisière.",
      "7":
        "Pour votre croisière de 7 jours, vérifiez la date de début et d'expiration du forfait. Prévoyez une marge si vous avez besoin de connexion avant l'embarquement ou après le débarquement. La durée de validité dépend de l'offre choisie.",
      "14":
        "Comparez la durée de validité avec le calendrier réel, y compris les journées avant l'embarquement et après le débarquement. Vérifiez les conditions du forfait avant l'achat.",
      "15":
        "Vérifiez la durée maximale du forfait, les possibilités de recharge et les conditions de renouvellement. Ne supposez pas qu'une recharge est disponible ou qu'elle prolonge automatiquement la validité."
    };

    checklist.push({
      title: durationTitle[duration],
      detail: durationDetails[duration]
    });

    const usageDetails = {
      light:
        "Pour un usage essentiel (messages, cartes et réservations), téléchargez les ressources hors ligne et désactivez si nécessaire les mises à jour et sauvegardes automatiques sur données mobiles. Vérifiez tout de même les limites du forfait : la consommation dépend des applications utilisées.",
      regular:
        "Pour un usage régulier (navigation, recherche et réseaux sociaux), vérifiez le volume de données réellement inclus, les règles de partage de connexion et les moyens de suivre la consommation. Les besoins varient selon les applications et la fréquence d'utilisation ; ce simulateur ne peut pas garantir un volume de Go suffisant.",
      intensive:
        "Pour un usage intensif (vidéos, appels vidéo ou partage de connexion), examinez les limites de données, les restrictions de débit et les usages autorisés. Comparez les solutions possibles et leurs conditions. Aucune qualité de service ni quantité de données n'est garantie par ce simulateur."
    };

    checklist.push({
      title: "Adapter le forfait à votre usage",
      detail: usageDetails[usage]
    });

    const seaDetails = {
      offline:
        "Téléchargez cartes, billets, réservations et documents avant le départ. En mer, une connexion peut être absente ou limitée ; gardez les informations importantes accessibles sans Internet.",
      wifi:
        "Consultez l'offre officielle de votre compagnie pour vérifier le prix applicable, les appareils autorisés, les applications accessibles, les éventuelles limites et la procédure d'accès. Le Wi-Fi n'est pas nécessairement inclus dans la croisière et sa disponibilité ou ses performances ne sont pas garanties.",
      maritime:
        "Avant tout achat, demandez au fournisseur de confirmer explicitement la compatibilité avec votre navire, votre compagnie et votre itinéraire. Vérifiez les zones desservies, les limites, les frais éventuels et les conditions d'activation. Ne présumez pas que cette offre fonctionnera sur votre traversée."
    };

    checklist.push({
      title: "Préparer la connexion en pleine mer",
      detail: seaDetails[atSea]
    });

    checklist.push({
      title: "Éviter le roaming maritime involontaire",
      detail:
        "Demandez à votre opérateur les conditions et tarifs applicables aux réseaux maritimes, qui peuvent différer du roaming terrestre. Si vous ne souhaitez pas les utiliser, vérifiez comment désactiver les données mobiles ou l'itinérance sur votre téléphone. Suivez les consignes de votre opérateur et de la compagnie."
    });

    checklist.push({
      title: "Vérifier le téléphone et l'installation",
      detail:
        "Confirmez que votre téléphone prend en charge l'eSIM, qu'il est déverrouillé si nécessaire et qu'il est compatible avec le fournisseur. Suivez les instructions officielles d'installation et vérifiez quand la validité commence. L'installation ne garantit pas à elle seule une connexion fonctionnelle à chaque destination."
    });

    const usagePreparation = {
      intensive: {
        title: "Prévoir une solution pour les usages gourmands",
        detail:
          "Identifiez à l'avance les tâches qui nécessitent vraiment une connexion. Ne comptez pas sur le streaming ou les appels vidéo sans avoir vérifié les limites et la qualité annoncée par le fournisseur ou la compagnie."
      },
      regular: {
        title: "Préparer les applications utilisées au quotidien",
        detail:
          "Mettez à jour les applications avant le départ, téléchargez les cartes utiles et limitez les téléchargements automatiques. Surveillez la consommation réelle plutôt que de vous fier à une estimation générique."
      },
      light: {
        title: "Télécharger l'essentiel avant l'embarquement",
        detail:
          "Enregistrez billets, cartes, réservations et traductions hors ligne. Cela réduit la dépendance à une connexion mobile ou au Wi-Fi, sans garantir qu'aucun accès Internet ne sera nécessaire."
      }
    };

    checklist.push(usagePreparation[usage]);

    if (duration === "14" || duration === "15") {
      checklist.push({
        title: "Prévoir le suivi sur la durée",
        detail:
          "Contrôlez régulièrement la consommation et la date d'expiration. Vérifiez auprès du fournisseur si une recharge est possible, son coût éventuel et ses conditions. Le simulateur ne confirme ni la disponibilité ni le prix d'une recharge."
      });
    }

    if (destination === "multi") {
      checklist.push({
        title: "Préparer un plan de secours par escale",
        detail:
          "Notez les options de connexion à vérifier pour chaque escale et prévoyez des ressources hors ligne. Ne partez pas du principe qu'un même forfait fonctionnera partout ; demandez confirmation pour toute destination incertaine."
      });
    }

    if (atSea === "wifi" || atSea === "maritime") {
      checklist.push({
        title: atSea === "wifi"
          ? "Confirmer les conditions du Wi-Fi du navire"
          : "Confirmer la compatibilité de l'offre maritime",
        detail: atSea === "wifi"
          ? "Vérifiez auprès de la compagnie le prix applicable, les appareils autorisés, les applications accessibles, les restrictions et la procédure de connexion. Ces informations peuvent varier selon l'offre et le navire."
          : "Obtenez une confirmation explicite du fournisseur pour le navire et l'itinéraire concernés avant de vous engager. Vérifiez les exclusions, les limites et les conditions d'utilisation."
      });
    }

    const title = document.createElement("h4");
    title.textContent = "Votre checklist personnalisée";

    const summary = document.createElement("p");
    summary.textContent =
      "Destination : " + destinations[destination] +
      " · Durée : " + durations[duration] +
      " · Usage : " + usages[usage] +
      " · En mer : " + atSeaOptions[atSea] + ".";

    const progress = document.createElement("p");
    progress.className = "cruise-check-progress";

    const list = document.createElement("ul");

    function updateProgress() {
      const checked = list.querySelectorAll('input[type="checkbox"]:checked').length;
      progress.textContent =
        "Vérifications terminées : " + checked + " / " + checklist.length + ".";
    }

    checklist.forEach(item => {
      const li = document.createElement("li");
      const label = document.createElement("label");
      label.className = "cruise-check-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.addEventListener("change", updateProgress);

      const content = document.createElement("span");
      const strong = document.createElement("strong");
      strong.textContent = item.title;

      const detail = document.createElement("span");
      detail.className = "cruise-check-detail";
      detail.textContent = item.detail;

      content.append(strong, detail);
      label.append(checkbox, content);
      li.appendChild(label);
      list.appendChild(li);
    });

    const note = document.createElement("p");
    note.className = "cruise-result-note";
    note.textContent =
      "À retenir : les recommandations sont indicatives. Ce simulateur ne vérifie pas les offres en temps réel et ne garantit aucun prix, aucune couverture réseau, aucune disponibilité en mer ni aucun volume de données. Confirmez les informations et les conditions auprès du fournisseur eSIM, de votre opérateur et de la compagnie de croisière avant le départ.";

    updateProgress();
    result.replaceChildren(title, summary, progress, list, note);
    result.hidden = false;

    if (window.lucide) window.lucide.createIcons();
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});


/* Catalogue réel eSIM Go : utilise uniquement les champs retournés par /api/catalogue. */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mbsCatalogueForm");
  const destinationInput = document.getElementById("mbsCatalogueDestination");
  const refreshButton = document.getElementById("mbsCatalogueRefresh");
  const status = document.getElementById("mbsCatalogueStatus");
  const results = document.getElementById("mbsCatalogueResults");
  const controls = document.getElementById("mbsCatalogueControls");
  const showMoreButton = document.getElementById("mbsShowMoreOffers");
  const toggleOffersButton = document.getElementById("mbsToggleOffers");

  if (!form || !destinationInput || !refreshButton || !status || !results || !controls || !showMoreButton || !toggleOffersButton) return;

  // Si la page est servie par FastAPI sur le port 8000, utilise la même origine (évite CORS).
  // Si la page est servie séparément, utilise le backend local par défaut.
  const pageOrigin = window.location.origin;
  const defaultApiBase = (pageOrigin === "http://127.0.0.1:8000" || pageOrigin === "http://localhost:8000")
    ? pageOrigin
    : "http://127.0.0.1:8000";
  const apiBase = (document.documentElement.dataset.apiBase || defaultApiBase).replace(/\/+$/, "");
  let requestNumber = 0;
  const pageSize = 10;
  let offerCards = [];
  let visibleOfferCount = pageSize;
  let offersCollapsed = false;

  function updateOfferControls() {
    const total = offerCards.length;
    controls.hidden = total === 0;
    results.hidden = offersCollapsed;
    toggleOffersButton.hidden = total === 0;
    toggleOffersButton.textContent = offersCollapsed ? `Afficher les offres (${total})` : "Masquer les offres et continuer l’article";
    toggleOffersButton.setAttribute("aria-expanded", String(!offersCollapsed));
    showMoreButton.hidden = offersCollapsed || visibleOfferCount >= total;
    if (!showMoreButton.hidden) {
      const remaining = total - visibleOfferCount;
      showMoreButton.textContent = `Afficher ${Math.min(pageSize, remaining)} offre(s) supplémentaire(s)`;
    }
  }

  const text = (value) => value == null || value === "" ? "" : String(value);

  function addParagraph(card, value) {
    if (!value) return;
    const paragraph = document.createElement("p");
    paragraph.textContent = value;
    card.appendChild(paragraph);
  }

  function formatData(offer) {
    if (offer.unlimited === true) return "Données illimitées (selon le catalogue)";
    const amount = Number(offer.data_amount_mb);
    if (offer.data_amount_mb == null || !Number.isFinite(amount)) return "Volume de données non renseigné";
    if (amount >= 1024) {
      const gb = amount / 1024;
      return `Données : ${Number(gb.toFixed(2))} Go (${amount} Mo indiqués par le fournisseur)`;
    }
    return `Données : ${amount} Mo`;
  }

  function renderOffers(payload) {
    results.replaceChildren();
    offerCards = [];
    visibleOfferCount = pageSize;
    offersCollapsed = false;
    const offers = Array.isArray(payload.offers) ? payload.offers : [];

    if (offers.length === 0) {
      controls.hidden = true;
      results.hidden = false;
      const empty = document.createElement("p");
      empty.className = "mbs-catalogue-empty";
      empty.textContent = "Aucune offre ne correspond à cette destination dans la réponse du catalogue. Essayez un autre nom de pays ou un code ISO.";
      results.appendChild(empty);
      return;
    }

    offers.forEach((offer, index) => {
      const card = document.createElement("article");
      card.className = "mbs-offer-card";
      const heading = document.createElement("h3");
      heading.textContent = text(offer.name) || "Offre sans nom dans la réponse fournisseur";
      card.appendChild(heading);

      const meta = document.createElement("div");
      meta.className = "mbs-offer-meta";
      [formatData(offer),
        offer.duration_days != null && Number.isFinite(Number(offer.duration_days))
          ? `Validité : ${offer.duration_days} jour(s)` : "Validité non renseignée",
        offer.provider_price != null && Number.isFinite(Number(offer.provider_price))
          ? `Prix fournisseur : ${offer.provider_price}${offer.currency ? ` ${offer.currency}` : " (devise non renseignée)"}`
          : "Prix fournisseur non renseigné"
      ].forEach((label) => {
        const chip = document.createElement("span");
        chip.className = "mbs-offer-chip";
        chip.textContent = label;
        meta.appendChild(chip);
      });
      card.appendChild(meta);
      addParagraph(card, text(offer.description));

      const countries = Array.isArray(offer.countries)
        ? offer.countries.map((country) => {
            if (!country || typeof country !== "object") return "";
            return text(country.name) || text(country.iso);
          }).filter(Boolean)
        : [];
      addParagraph(card, countries.length
        ? `Destinations indiquées par le catalogue : ${countries.join(", ")}`
        : "Destinations couvertes non renseignées dans la réponse.");

      if (Array.isArray(offer.networks) && offer.networks.length) {
        const networkLabels = offer.networks.map((entry) => {
          if (!entry || typeof entry !== "object") return "";
          const names = Array.isArray(entry.names) ? entry.names.filter(Boolean).join(", ") : "";
          return names ? `${text(entry.country) ? `${entry.country} : ` : ""}${names}` : "";
        }).filter(Boolean);
        if (networkLabels.length) addParagraph(card, `Réseaux indiqués par le catalogue : ${networkLabels.join(" ; ")}`);
      }
      if (Array.isArray(offer.groups) && offer.groups.length) {
        const groups = offer.groups.map((group) => {
          if (typeof group === "string") return group;
          if (group && typeof group === "object") return text(group.name) || text(group.id);
          return "";
        }).filter(Boolean);
        if (groups.length) addParagraph(card, `Groupes : ${groups.join(", ")}`);
      }
      card.hidden = index >= pageSize;
      offerCards.push(card);
      results.appendChild(card);
    });
    updateOfferControls();
  }

  async function loadCatalogue(forceRefresh = false) {
    const currentRequest = ++requestNumber;
    const destination = destinationInput.value.trim();
    if (destination.length < 2) {
      status.dataset.state = "error";
      status.textContent = "Saisissez un pays ou un code ISO d’au moins deux caractères.";
      results.replaceChildren();
      return;
    }

    status.dataset.state = "loading";
    status.textContent = forceRefresh ? "Actualisation du catalogue eSIM Go en cours…" : "Chargement des offres eSIM Go…";
    results.replaceChildren();
    results.hidden = false;
    controls.hidden = true;
    form.querySelectorAll("button").forEach((button) => { button.disabled = true; });

    try {
      const params = new URLSearchParams({ destination });
      if (forceRefresh) params.set("refresh", "true");
      const response = await fetch(`${apiBase}/api/catalogue?${params.toString()}`, { headers: { "Accept": "application/json" } });
      let payload;
      try { payload = await response.json(); }
      catch { throw new Error(`Le backend a renvoyé une réponse non JSON (HTTP ${response.status}).`); }
      if (!response.ok) {
        const detail = payload && typeof payload.detail === "string" ? payload.detail : `Erreur HTTP ${response.status}`;
        throw new Error(detail);
      }
      if (!payload || !Array.isArray(payload.offers)) throw new Error("Format de réponse inattendu : la propriété « offers » est absente ou invalide.");
      if (currentRequest !== requestNumber) return;
      renderOffers(payload);
      const count = Number.isFinite(Number(payload.count)) ? Number(payload.count) : payload.offers.length;
      const verifiedAt = text(payload.verified_at_utc);
      status.dataset.state = "success";
      status.textContent = `${count} offre(s) retournée(s) pour « ${destination} ».` + (verifiedAt ? ` Dernier chargement réussi du catalogue (UTC) : ${verifiedAt}.` : "");
    } catch (error) {
      if (currentRequest !== requestNumber) return;
      status.dataset.state = "error";
      status.textContent = `Impossible de charger le catalogue : ${error instanceof Error ? error.message : "erreur inconnue"}. Vérifiez que le backend FastAPI est démarré et accessible.`;
      results.replaceChildren();
      offerCards = [];
      controls.hidden = true;
      results.hidden = false;
    } finally {
      if (currentRequest === requestNumber) form.querySelectorAll("button").forEach((button) => { button.disabled = false; });
    }
  }

  showMoreButton.addEventListener("click", () => {
    visibleOfferCount = Math.min(visibleOfferCount + pageSize, offerCards.length);
    offerCards.forEach((card, index) => { card.hidden = index >= visibleOfferCount; });
    updateOfferControls();
  });

  toggleOffersButton.addEventListener("click", () => {
    offersCollapsed = !offersCollapsed;
    updateOfferControls();
  });

  form.addEventListener("submit", (event) => { event.preventDefault(); loadCatalogue(false); });
  refreshButton.addEventListener("click", () => loadCatalogue(true));
  loadCatalogue(false);
});
