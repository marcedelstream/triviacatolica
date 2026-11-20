/* ==========================================================================
   Trivia Católica · lógica compartida de la landing (todos los idiomas)
   Los textos de cada idioma llegan en window.TC (los genera build.mjs).
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     CONFIGURACIÓN DE TIENDAS
     Cuando la app esté publicada, cambiá `available: true` y pegá los links
     reales de App Store y Google Play. Todos los botones (en todos los
     idiomas) se actualizan solos.
     ------------------------------------------------------------------------ */
  const STORE_CONFIG = {
    available: false,
    appStoreUrl: 'https://apps.apple.com/app/id0000000000',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.triviacatolica.app',
    waitlistEndpoint: ''
  };

  const TC = window.TC;
  const S = TC.js;
  const fmt = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* sin storage */ } }
  };

  /* Categorías: estructura fija + textos del idioma actual */
  const CATEGORY_BASE = [
    { slug: 'antiguo-testamento', icon: 'ph-scroll', color: 'var(--cat-at)', soft: 'var(--cat-at-soft)', status: ['free', 'free', 'pro'] },
    { slug: 'nuevo-testamento', icon: 'ph-book-open-text', color: 'var(--cat-nt)', soft: 'var(--cat-nt-soft)', status: ['free', 'free', 'pro'] },
    { slug: 'santos', icon: 'ph-hands-praying', color: 'var(--cat-sa)', soft: 'var(--cat-sa-soft)', status: ['free', 'free', 'pro'] },
    { slug: 'sacramentos', icon: 'ph-drop', color: 'var(--cat-sc)', soft: 'var(--cat-sc-soft)', status: ['free', 'free', 'pro'] },
    { slug: 'liturgia', icon: 'ph-church', color: 'var(--cat-li)', soft: 'var(--cat-li-soft)', status: ['free', 'free', 'pro'] },
    { slug: 'y-mas', icon: 'ph-plus-circle', color: 'var(--primary)', soft: 'var(--primary-soft)', status: ['soon', 'soon', 'soon'], isMore: true }
  ];
  const CATEGORIES = CATEGORY_BASE.map((base, i) => {
    const txt = TC.categories[i];
    return {
      ...base,
      title: txt.title,
      description: txt.description,
      levels: txt.levels.map(([title, sub], j) => ({
        num: base.isMore ? '+' : j + 1,
        title,
        sub,
        status: base.status[j]
      }))
    };
  });

  /* 1. Menú móvil ----------------------------------------------------------- */
  const menuToggle = document.getElementById('menuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');

  menuToggle.addEventListener('click', () => {
    const isOpen = mobileDrawer.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.innerHTML = isOpen
      ? '<i class="ph ph-x" aria-hidden="true"></i>'
      : '<i class="ph ph-list" aria-hidden="true"></i>';
  });

  mobileDrawer.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.innerHTML = '<i class="ph ph-list" aria-hidden="true"></i>';
    });
  });

  /* Cierra el selector de idioma al hacer clic afuera */
  document.addEventListener('click', (e) => {
    document.querySelectorAll('details.lang-menu[open]').forEach((d) => {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  });

  /* 2. Botones de descarga + modal ----------------------------------------- */
  const launchModal = document.getElementById('launchModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalTitle = document.getElementById('modalTitle');
  const modalText = document.getElementById('modalText');
  const modalStoreIcon = document.getElementById('modalStoreIcon');

  function initStoreButtons() {
    const storeButtons = document.querySelectorAll('[data-store]');

    if (STORE_CONFIG.available) {
      document.getElementById('heroStatusChip').classList.add('is-live');
      document.getElementById('heroStatusText').textContent = S.live_hero;
      document.getElementById('dlTagText').textContent = S.live_tag;
      document.getElementById('dlTitle').textContent = S.live_title;
      document.getElementById('dlDesc').textContent = S.live_desc;

      storeButtons.forEach((btn) => {
        const platform = btn.getAttribute('data-store');
        btn.setAttribute('href', platform === 'ios' ? STORE_CONFIG.appStoreUrl : STORE_CONFIG.googlePlayUrl);
        btn.setAttribute('target', '_blank');
        btn.setAttribute('rel', 'noopener noreferrer');
        const eyebrow = btn.querySelector('[data-store-eyebrow]');
        if (eyebrow) eyebrow.textContent = platform === 'ios' ? S.get_on : S.available_on;
        const pill = btn.querySelector('[data-store-pill]');
        if (pill) {
          pill.textContent = S.free;
          pill.classList.add('live');
        }
      });
    } else {
      storeButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const isIos = btn.getAttribute('data-store') === 'ios';
          modalStoreIcon.innerHTML = isIos
            ? '<i class="ph-duotone ph-apple-logo" aria-hidden="true"></i>'
            : '<i class="ph-duotone ph-google-play-logo" aria-hidden="true"></i>';
          modalTitle.textContent = isIos ? S.soon_ios : S.soon_android;
          modalText.textContent = isIos ? S.modal_ios : S.modal_android;
          openModal();
        });
      });
    }
  }

  function openModal() {
    launchModal.classList.add('open');
    launchModal.setAttribute('aria-hidden', 'false');
    document.getElementById('modalEmail').focus();
  }

  function closeModal() {
    launchModal.classList.remove('open');
    launchModal.setAttribute('aria-hidden', 'true');
  }

  modalCloseBtn.addEventListener('click', closeModal);
  launchModal.addEventListener('click', (e) => {
    if (e.target === launchModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && launchModal.classList.contains('open')) closeModal();
  });

  /* 3. Explorador de categorías -------------------------------------------- */
  const categoryButtonsEl = document.getElementById('categoryButtons');
  const levelsPanelEl = document.getElementById('levelsPanel');
  let activeCategorySlug = 'nuevo-testamento';

  function renderCategoryButtons() {
    categoryButtonsEl.innerHTML = CATEGORIES.map((cat) => {
      const isActive = cat.slug === activeCategorySlug;
      return `
        <button type="button" class="cat-selector ${isActive ? 'active' : ''}" role="tab"
          aria-selected="${isActive}" data-cat-slug="${cat.slug}"
          style="--c: ${cat.color}; --soft: ${cat.soft};">
          <span class="cat-sel-icon"><i class="ph-duotone ${cat.icon}" aria-hidden="true"></i></span>
          <span class="cat-sel-body">
            <span class="cat-sel-name">${cat.title}</span>
            <span class="cat-sel-desc">${cat.description}</span>
          </span>
          <i class="ph ph-caret-right cat-sel-caret" aria-hidden="true"></i>
        </button>`;
    }).join('');

    categoryButtonsEl.querySelectorAll('[data-cat-slug]').forEach((btn) => {
      btn.addEventListener('click', () => selectCategory(btn.getAttribute('data-cat-slug')));
    });
  }

  function badgeMarkup(status) {
    if (status === 'pro') {
      return `<span class="level-badge pro"><i class="ph-duotone ph-crown" aria-hidden="true"></i><span>${S.badge_pro}</span></span>`;
    }
    if (status === 'soon') {
      return `<span class="level-badge soon"><i class="ph-duotone ph-sparkle" aria-hidden="true"></i><span>${S.badge_soon}</span></span>`;
    }
    return `<span class="level-badge free"><i class="ph-duotone ph-check-circle" aria-hidden="true"></i><span>${S.free}</span></span>`;
  }

  function renderLevelsPanel(cat) {
    const heading = cat.isMore ? S.path_more : S.path;
    const note = cat.isMore ? S.note_more : S.note;

    levelsPanelEl.innerHTML = `
      <div class="levels-hero" style="--c: ${cat.color}; --soft: ${cat.soft};">
        <span class="levels-hero-icon"><i class="ph-duotone ${cat.icon}" aria-hidden="true"></i></span>
        <div>
          <h3>${cat.title}</h3>
          <p>${cat.description}</p>
        </div>
      </div>
      <p class="path-heading">${heading}</p>
      <div class="level-path" style="--c: ${cat.color}; --soft: ${cat.soft};">
        ${cat.levels.map((lvl, idx) => `
          ${idx > 0 ? `<div class="level-connector ${idx === 1 ? 'done' : ''}" aria-hidden="true"></div>` : ''}
          <div class="level-node ${idx === 0 ? 'recommended' : ''}">
            <span class="level-num ${lvl.status === 'pro' ? 'pro' : ''}">
              ${lvl.status === 'pro'
                ? '<i class="ph-duotone ph-crown" aria-hidden="true"></i>'
                : lvl.status === 'soon'
                  ? '<i class="ph-duotone ph-plus" aria-hidden="true"></i>'
                  : lvl.num}
            </span>
            <div class="level-body">
              <p class="level-title">${cat.isMore ? lvl.title : fmt(S.level, { n: lvl.num, title: lvl.title })}</p>
              <p class="level-sub">${lvl.sub}</p>
            </div>
            ${badgeMarkup(lvl.status)}
          </div>`).join('')}
      </div>
      <p class="path-note">
        <i class="ph-duotone ${cat.isMore ? 'ph-arrows-clockwise' : 'ph-star'}" aria-hidden="true"></i>
        <span>${note}</span>
      </p>`;
  }

  function selectCategory(slug) {
    const cat = CATEGORIES.find((c) => c.slug === slug) || CATEGORIES[0];
    activeCategorySlug = cat.slug;
    renderCategoryButtons();
    renderLevelsPanel(cat);
  }

  /* 4. Formulario "Avisame cuando salga" ----------------------------------- */
  function wireWaitlistForm(formId, inputId, statusId) {
    const form = document.getElementById(formId);
    const input = document.getElementById(inputId);
    const status = document.getElementById(statusId);

    const savedEmail = store.get('triviacatolica_waitlist_email');
    if (savedEmail) {
      status.className = 'waitlist-status ok';
      status.innerHTML = `<i class="ph-duotone ph-check-circle" aria-hidden="true"></i><span>${fmt(S.wl_saved, { email: escapeHtml(savedEmail) })}</span>`;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!isValid) {
        status.className = 'waitlist-status err';
        status.innerHTML = `<i class="ph-duotone ph-x-circle" aria-hidden="true"></i><span>${S.wl_invalid}</span>`;
        input.focus();
        return;
      }

      if (STORE_CONFIG.waitlistEndpoint) {
        try {
          await fetch(STORE_CONFIG.waitlistEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, lang: TC.lang, source: 'triviacatolica.com' })
          });
        } catch (_) {
          // Respaldo local si el endpoint aún no responde
        }
      }

      store.set('triviacatolica_waitlist_email', email);
      input.value = '';
      status.className = 'waitlist-status ok';
      status.innerHTML = `<i class="ph-duotone ph-check-circle" aria-hidden="true"></i><span>${fmt(S.wl_ok, { email: escapeHtml(email) })}</span>`;
    });
  }

  /* 5. Cartel de sugerencia de idioma -------------------------------------- */
  const BANNER = {
    es: { text: 'Esta página también está disponible en español.', cta: 'Ver en español', close: 'Cerrar' },
    en: { text: 'This page is also available in English.', cta: 'View in English', close: 'Close' },
    pt: { text: 'Esta página também está disponível em português.', cta: 'Ver em português', close: 'Fechar' },
    it: { text: 'Questa pagina è disponibile anche in italiano.', cta: 'Vedi in italiano', close: 'Chiudi' }
  };

  function initLangBanner() {
    const banner = document.getElementById('langBanner');
    if (!banner || store.get('tc_lang_choice')) return;
    const prefs = (navigator.languages || [navigator.language || '']).map((l) => String(l).slice(0, 2).toLowerCase());
    const wanted = prefs.find((l) => TC.alternates[l]);
    if (!wanted || wanted === TC.lang) return;
    const b = BANNER[wanted];
    banner.setAttribute('lang', wanted);
    banner.innerHTML = `
      <div class="container lang-banner-inner">
        <i class="ph-duotone ph-globe-hemisphere-west" aria-hidden="true"></i>
        <p>${b.text}</p>
        <a class="lang-banner-cta" href="${TC.alternates[wanted]}" data-lang-choice="${wanted}">${b.cta}<i class="ph ph-arrow-right" aria-hidden="true"></i></a>
        <button type="button" class="lang-banner-close" aria-label="${b.close}"><i class="ph ph-x" aria-hidden="true"></i></button>
      </div>`;
    banner.hidden = false;
    banner.querySelector('.lang-banner-close').addEventListener('click', () => {
      store.set('tc_lang_choice', TC.lang);
      banner.hidden = true;
    });
  }

  /* Recuerda el idioma elegido a mano (selector, menú, footer o cartel) */
  document.querySelectorAll('[data-lang-choice]').forEach((a) => {
    a.addEventListener('click', () => store.set('tc_lang_choice', a.getAttribute('data-lang-choice')));
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('.lang-banner [data-lang-choice]');
    if (a) store.set('tc_lang_choice', a.getAttribute('data-lang-choice'));
  });

  /* 6. Animaciones de aparición al hacer scroll ----------------------------- */
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const groups = [
      '.section-head', '.about-item', '.feature-card', '.plan-card',
      '.price-box', '.waitlist-card', '.dl-title', '.dl-store-btn', '#categorias .container > *:not(.section-head)'
    ].join(',');
    const els = document.querySelectorAll(groups);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach((el) => {
      const siblings = Array.from(el.parentElement.children).filter((c) => c.matches(groups));
      el.style.setProperty('--d', Math.min(siblings.indexOf(el), 4) * 90 + 'ms');
      el.classList.add('reveal');
      io.observe(el);
    });
    document.documentElement.classList.add('js-reveal');
  }

  // Inicialización
  initStoreButtons();
  selectCategory('nuevo-testamento');
  wireWaitlistForm('waitlistForm', 'waitlistEmail', 'waitlistStatus');
  wireWaitlistForm('modalWaitlistForm', 'modalEmail', 'modalStatus');
  initLangBanner();
  initReveal();
})();
