/* ============================================================
   RIDGEPORT LOGISTICS — shipping.js
   Full site JS: header, mobile menu, tracking, quote modal,
   shipment quotation generator & printable receipt
   ============================================================ */

/* ----------------------------------------------------------
   1. HEADER — scroll shrink + active nav highlight
   ---------------------------------------------------------- */
(function () {
  const header = document.querySelector('.header');
  const navLinks = document.querySelectorAll('.nav-menu a');
  const sections = document.querySelectorAll('section[id]');

  /* Shrink header on scroll */
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    highlightNav();
  }, { passive: true });

  /* Highlight active nav link based on scroll position */
  function highlightNav() {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  /* Smooth scroll for all anchor links */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        /* Close mobile menu if open */
        closeMobileMenu();
      }
    });
  });
})();


/* ----------------------------------------------------------
   2. HAMBURGER / MOBILE MENU
   ---------------------------------------------------------- */
(function () {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  /* Close on outside click */
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      closeMobileMenu();
    }
  });
})();

function closeMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!mobileMenu) return;
  mobileMenu.classList.remove('open');
  if (hamburger) {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  }
  document.body.style.overflow = '';
}


/* ----------------------------------------------------------
   3. HERO TRACKING FORM — validate & show result
   ---------------------------------------------------------- */
(function () {
  const form = document.querySelector('.tracking-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const input = form.querySelector('.Track-input');
    const trackingNumber = input.value.trim().toUpperCase();

    if (!trackingNumber) {
      showTrackingError('Please enter a tracking number.');
      return;
    }
    if (trackingNumber.length < 6) {
      showTrackingError('Tracking number must be at least 6 characters.');
      return;
    }

    /* Open the full quote/track modal in tracking mode */
    openQuoteModal('track', trackingNumber);
    input.value = '';
  });

  function showTrackingError(msg) {
    let err = form.querySelector('.tracking-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'tracking-error';
      err.style.cssText = 'color:#e74c3c;font-size:13px;margin-top:6px;';
      form.after(err);
    }
    err.textContent = msg;
    setTimeout(() => err.remove(), 3000);
  }
})();


/* ----------------------------------------------------------
   4. "GET A QUOTE" & "TRACK SHIPMENT" BUTTONS
   ---------------------------------------------------------- */
(function () {
  /* All buttons that open the quote modal */
  const quoteSelectors = [
    '.quote-button',
    '.quote-mobile',
    '.free-quote-button',
    'footer a[href="#"]'
  ];
  quoteSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        openQuoteModal('quote');
      });
    });
  });

  /* "Track Shipment" CTA button */
  document.querySelectorAll('.track-shipment').forEach(btn => {
    btn.addEventListener('click', () => openQuoteModal('track'));
  });
})();


/* ----------------------------------------------------------
   5. QUOTE / TRACKING MODAL — full implementation
   ---------------------------------------------------------- */

/* ---- Inject modal HTML once ---- */
(function buildModal() {
  if (document.getElementById('rl-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'rl-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Shipment Tool');
  overlay.innerHTML = `
<div id="rl-modal">
  <button id="rl-modal-close" aria-label="Close">&times;</button>
  <div id="rl-modal-body"></div>
</div>`;

  document.body.appendChild(overlay);

  /* Inject modal styles */
  const style = document.createElement('style');
  style.textContent = `
    #rl-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:none;align-items:center;justify-content:center;padding:16px;overflow-y:auto;}
    #rl-modal-overlay.open{display:flex;}
    #rl-modal{background:#fff;border-radius:14px;width:100%;max-width:680px;max-height:92vh;overflow-y:auto;position:relative;padding:36px 32px 28px;box-shadow:0 24px 60px rgba(0,0,0,.22);}
    #rl-modal-close{position:absolute;top:14px;right:18px;background:none;border:none;font-size:26px;cursor:pointer;color:#888;line-height:1;}
    #rl-modal-close:hover{color:#111;}
    .rl-tabs{display:flex;gap:0;border-bottom:2px solid #e9ecef;margin-bottom:24px;}
    .rl-tab{flex:1;padding:10px 0;text-align:center;font-size:14px;font-weight:600;color:#888;background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .2s,border-color .2s;}
    .rl-tab.active{color:#1a4fa0;border-color:#1a4fa0;}
    .rl-panel{display:none;}
    .rl-panel.active{display:block;}
    .rl-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .rl-form-grid .full-width{grid-column:1/-1;}
    .rl-label{display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:5px;letter-spacing:.4px;}
    .rl-input,.rl-select{width:100%;padding:9px 12px;border:1.5px solid #dde1ea;border-radius:8px;font-size:14px;color:#222;background:#fff;transition:border-color .2s;box-sizing:border-box;}
    .rl-input:focus,.rl-select:focus{outline:none;border-color:#1a4fa0;}
    .rl-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:background .2s,transform .1s;}
    .rl-btn:active{transform:scale(.98);}
    .rl-btn-primary{background:#1a4fa0;color:#fff;}
    .rl-btn-primary:hover{background:#163d82;}
    .rl-btn-outline{background:#fff;color:#1a4fa0;border:1.5px solid #1a4fa0;}
    .rl-btn-outline:hover{background:#eef3fb;}
    .rl-btn-success{background:#16a34a;color:#fff;}
    .rl-btn-success:hover{background:#15803d;}
    .rl-section-title{font-size:22px;font-weight:700;color:#111;margin:0 0 4px;}
    .rl-section-sub{font-size:14px;color:#666;margin:0 0 22px;}
    .rl-result-box{background:#f4f7fd;border:1.5px solid #d0daf0;border-radius:10px;padding:20px;margin-top:20px;}
    .rl-result-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #e4eaf5;font-size:14px;}
    .rl-result-row:last-child{border-bottom:none;font-weight:700;font-size:15px;color:#1a4fa0;}
    .rl-track-status{display:flex;flex-direction:column;gap:14px;margin-top:16px;}
    .rl-track-step{display:flex;gap:14px;align-items:flex-start;}
    .rl-track-dot{width:14px;height:14px;border-radius:50%;background:#c8d8f0;flex-shrink:0;margin-top:4px;position:relative;}
    .rl-track-dot.done{background:#1a4fa0;}
    .rl-track-dot.current{background:#f59e0b;box-shadow:0 0 0 4px rgba(245,158,11,.25);}
    .rl-track-line{position:absolute;left:50%;top:14px;width:2px;height:32px;background:#dde5f5;transform:translateX(-50%);}
    .rl-track-info h4{font-size:14px;font-weight:600;margin:0 0 2px;color:#222;}
    .rl-track-info p{font-size:12px;color:#888;margin:0;}
    .rl-divider{border:none;border-top:1.5px solid #eee;margin:20px 0;}
    .rl-receipt-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;}
    .rl-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.5px;}
    .rl-badge-green{background:#dcfce7;color:#166534;}
    .rl-badge-amber{background:#fef9c3;color:#854d0e;}
    @media(max-width:540px){.rl-form-grid{grid-template-columns:1fr;}.rl-form-grid .full-width{grid-column:1;} #rl-modal{padding:24px 16px 20px;}}
    @media print{#rl-modal-overlay{position:static;display:block;padding:0;background:none;}#rl-modal{box-shadow:none;max-height:none;border-radius:0;}#rl-modal-close,.rl-no-print{display:none!important;}}
  `;
  document.head.appendChild(style);

  /* Close behaviour */
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
  document.getElementById('rl-modal-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
})();

function closeModal() {
  const overlay = document.getElementById('rl-modal-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function openQuoteModal(mode, prefillTracking) {
  const overlay = document.getElementById('rl-modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  const body = document.getElementById('rl-modal-body');
  body.innerHTML = buildModalContent();

  /* Activate correct tab */
  activateTab(mode === 'track' ? 'track' : 'quote');

  /* Pre-fill tracking number if provided */
  if (prefillTracking) {
    const trackInput = document.getElementById('rl-tracking-input');
    if (trackInput) {
      trackInput.value = prefillTracking;
      /* Auto-submit tracking */
      setTimeout(() => performTracking(prefillTracking), 200);
    }
  }

  /* Wire up tabs */
  body.querySelectorAll('.rl-tab').forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });

  /* Wire up quote form */
  const quoteForm = document.getElementById('rl-quote-form');
  if (quoteForm) {
    quoteForm.addEventListener('submit', handleQuoteSubmit);
    quoteForm.addEventListener('change', updateLiveEstimate);
    quoteForm.addEventListener('input', updateLiveEstimate);
  }

  /* Wire up tracking form */
  const trackForm = document.getElementById('rl-track-form');
  if (trackForm) {
    trackForm.addEventListener('submit', handleTrackSubmit);
  }
}

function activateTab(tab) {
  document.querySelectorAll('.rl-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.rl-panel').forEach(p => p.classList.toggle('active', p.id === `rl-panel-${tab}`));
}

function buildModalContent() {
  return `
  <div class="rl-tabs">
    <button class="rl-tab" data-tab="quote">Get a Quote</button>
    <button class="rl-tab" data-tab="track">Track Shipment</button>
    <button class="rl-tab" data-tab="receipt">Receipts</button>
  </div>

  <!-- QUOTE PANEL -->
  <div class="rl-panel" id="rl-panel-quote">
    <h2 class="rl-section-title">Shipment Quotation</h2>
    <p class="rl-section-sub">Fill in the details below to get an instant quote.</p>
    <form id="rl-quote-form">
      <div class="rl-form-grid">
        <div class="full-width">
          <label class="rl-label">Service Type</label>
          <select class="rl-select" name="service" required>
            <option value="">— Select service —</option>
            <option value="domestic_standard">Domestic Standard (3–5 days)</option>
            <option value="domestic_express">Domestic Express (Next Day)</option>
            <option value="domestic_sameday">Domestic Same-Day</option>
            <option value="international_economy">International Economy (7–14 days)</option>
            <option value="international_express">International Express (2–5 days)</option>
            <option value="air_cargo">Air Cargo</option>
            <option value="ocean_freight">Ocean Freight (FCL/LCL)</option>
            <option value="rail_transport">Rail Transport</option>
          </select>
        </div>

        <div>
          <label class="rl-label">Sender Name</label>
          <input class="rl-input" name="senderName" type="text" placeholder="Full name" required>
        </div>
        <div>
          <label class="rl-label">Sender Phone</label>
          <input class="rl-input" name="senderPhone" type="tel" placeholder="+234 000 000 0000">
        </div>
        <div>
          <label class="rl-label">Origin City / Country</label>
          <input class="rl-input" name="origin" type="text" placeholder="e.g. Lagos, Nigeria" required>
        </div>
        <div>
          <label class="rl-label">Destination City / Country</label>
          <input class="rl-input" name="destination" type="text" placeholder="e.g. London, UK" required>
        </div>

        <div>
          <label class="rl-label">Receiver Name</label>
          <input class="rl-input" name="receiverName" type="text" placeholder="Full name" required>
        </div>
        <div>
          <label class="rl-label">Receiver Phone</label>
          <input class="rl-input" name="receiverPhone" type="tel" placeholder="+1 000 000 0000">
        </div>

        <div>
          <label class="rl-label">Package Weight (kg)</label>
          <input class="rl-input" name="weight" type="number" min="0.1" step="0.1" placeholder="e.g. 2.5" required>
        </div>
        <div>
          <label class="rl-label">Package Type</label>
          <select class="rl-select" name="packageType">
            <option value="parcel">Parcel / Box</option>
            <option value="document">Documents / Envelope</option>
            <option value="pallet">Pallet</option>
            <option value="container">Container</option>
            <option value="fragile">Fragile Item</option>
          </select>
        </div>

        <div>
          <label class="rl-label">Length (cm)</label>
          <input class="rl-input" name="length" type="number" min="1" placeholder="cm">
        </div>
        <div>
          <label class="rl-label">Width (cm)</label>
          <input class="rl-input" name="width" type="number" min="1" placeholder="cm">
        </div>
        <div>
          <label class="rl-label">Height (cm)</label>
          <input class="rl-input" name="height" type="number" min="1" placeholder="cm">
        </div>
        <div>
          <label class="rl-label">Declared Value (USD)</label>
          <input class="rl-input" name="value" type="number" min="0" step="0.01" placeholder="0.00">
        </div>

        <div class="full-width">
          <label class="rl-label">Special Instructions</label>
          <input class="rl-input" name="notes" type="text" placeholder="Fragile, handle with care, etc.">
        </div>

        <div class="full-width" style="margin-top:4px;">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
            <input type="checkbox" name="insurance" style="width:16px;height:16px;">
            Add cargo insurance (1.5% of declared value, min $5)
          </label>
        </div>
      </div>

      <!-- Live estimate preview -->
      <div id="rl-live-estimate" style="display:none;background:#eef3fb;border-radius:8px;padding:12px 16px;margin:16px 0 0;font-size:14px;color:#1a4fa0;font-weight:600;"></div>

      <div style="display:flex;gap:10px;margin-top:20px;">
        <button type="submit" class="rl-btn rl-btn-primary">Generate Quotation &rarr;</button>
      </div>
    </form>
    <div id="rl-quote-result"></div>
  </div>

  <!-- TRACK PANEL -->
  <div class="rl-panel" id="rl-panel-track">
    <h2 class="rl-section-title">Track Your Shipment</h2>
    <p class="rl-section-sub">Enter your tracking number to see real-time status.</p>
    <form id="rl-track-form" style="display:flex;gap:10px;margin-bottom:24px;">
      <input id="rl-tracking-input" class="rl-input" type="text" placeholder="e.g. RL-20240417-4821" required style="flex:1;">
      <button type="submit" class="rl-btn rl-btn-primary">Track</button>
    </form>
    <div id="rl-track-result"></div>
  </div>

  <!-- RECEIPT PANEL -->
  <div class="rl-panel" id="rl-panel-receipt">
    <h2 class="rl-section-title">Saved Receipts</h2>
    <p class="rl-section-sub">Your recent shipment receipts are listed below.</p>
    <div id="rl-receipts-list"></div>
  </div>
  `;
}


/* ----------------------------------------------------------
   6. QUOTE LOGIC
   ---------------------------------------------------------- */

/* Pricing engine */
const RATES = {
  domestic_standard:       { base: 5,   perKg: 0.8,  days: '3–5 days' },
  domestic_express:        { base: 12,  perKg: 1.5,  days: '1 day' },
  domestic_sameday:        { base: 25,  perKg: 2.5,  days: 'Same day' },
  international_economy:   { base: 20,  perKg: 3.5,  days: '7–14 days' },
  international_express:   { base: 45,  perKg: 6.0,  days: '2–5 days' },
  air_cargo:               { base: 60,  perKg: 8.0,  days: '1–3 days' },
  ocean_freight:           { base: 80,  perKg: 1.2,  days: '15–35 days' },
  rail_transport:          { base: 35,  perKg: 2.0,  days: '5–12 days' },
};

const SURCHARGES = {
  fragile: 0.10,   /* 10% */
  pallet:  0.08,
  container: 0.05,
  document: -0.05,
};

function calcQuote(data) {
  const rate = RATES[data.service] || RATES.domestic_standard;
  const weight = parseFloat(data.weight) || 1;
  const vol = ((parseFloat(data.length)||20) * (parseFloat(data.width)||15) * (parseFloat(data.height)||10)) / 5000;
  const chargeableWeight = Math.max(weight, vol);

  let shipping = rate.base + chargeableWeight * rate.perKg;

  /* Package type surcharge */
  const surcharge = SURCHARGES[data.packageType] || 0;
  shipping *= (1 + surcharge);

  const fuel = shipping * 0.08;
  const handling = 2.50;
  let insurance = 0;
  if (data.insurance) {
    const declared = parseFloat(data.value) || 0;
    insurance = Math.max(5, declared * 0.015);
  }

  const subtotal = shipping + fuel + handling + insurance;
  const tax = subtotal * 0.075;
  const total = subtotal + tax;

  return {
    rate, chargeableWeight,
    shipping: +shipping.toFixed(2),
    fuel: +fuel.toFixed(2),
    handling,
    insurance: +insurance.toFixed(2),
    subtotal: +subtotal.toFixed(2),
    tax: +tax.toFixed(2),
    total: +total.toFixed(2),
    currency: 'USD',
  };
}

function updateLiveEstimate() {
  const form = document.getElementById('rl-quote-form');
  const el = document.getElementById('rl-live-estimate');
  if (!form || !el) return;
  const d = Object.fromEntries(new FormData(form).entries());
  d.insurance = form.querySelector('[name="insurance"]').checked;
  if (!d.service || !d.weight) { el.style.display = 'none'; return; }
  const q = calcQuote(d);
  el.style.display = 'block';
  el.textContent = `Estimated Total: $${q.total.toFixed(2)} USD · Delivery: ${q.rate.days}`;
}

function handleQuoteSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const d = Object.fromEntries(new FormData(form).entries());
  d.insurance = form.querySelector('[name="insurance"]').checked;
  const q = calcQuote(d);

  /* Generate tracking ID */
  const trackingId = 'RL-' + Date.now().toString().slice(-8) + '-' + Math.floor(1000 + Math.random() * 9000);
  const quoteDate = new Date().toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' });

  const serviceLabel = form.querySelector('[name="service"] option:checked').textContent;

  /* Save to receipt store */
  saveReceipt({ trackingId, quoteDate, d, q, serviceLabel });

  /* Show quotation result */
  const resultEl = document.getElementById('rl-quote-result');
  resultEl.innerHTML = buildQuotationHTML({ trackingId, quoteDate, d, q, serviceLabel });

  /* Wire up print/download */
  resultEl.querySelector('#rl-print-btn')?.addEventListener('click', () => printReceipt(trackingId));
  resultEl.querySelector('#rl-view-receipt-btn')?.addEventListener('click', () => {
    activateTab('receipt');
    renderReceiptsList();
  });

  /* Scroll result into view */
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildQuotationHTML({ trackingId, quoteDate, d, q, serviceLabel }) {
  return `
  <hr class="rl-divider">
  <div id="printable-${trackingId}">
    <div class="rl-receipt-header">
      <div>
        <div style="font-size:11px;color:#888;letter-spacing:.5px;margin-bottom:2px;">SHIPMENT QUOTATION</div>
        <div style="font-size:20px;font-weight:700;color:#1a4fa0;">Ridgeport Logistics</div>
        <div style="font-size:12px;color:#555;margin-top:4px;">151 N Broadway Street, Middletown, Delaware, US</div>
      </div>
      <div style="text-align:right;">
        <span class="rl-badge rl-badge-amber">QUOTATION</span>
        <div style="font-size:12px;color:#666;margin-top:6px;">Date: ${quoteDate}</div>
        <div style="font-size:12px;color:#666;">Tracking ID: <strong style="color:#1a4fa0;">${trackingId}</strong></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;">
      <div style="background:#f9fafb;border-radius:8px;padding:14px;">
        <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;">SENDER</div>
        <div style="font-size:14px;font-weight:600;">${d.senderName || '—'}</div>
        <div style="font-size:13px;color:#555;">${d.senderPhone || ''}</div>
        <div style="font-size:13px;color:#555;margin-top:4px;">${d.origin}</div>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:14px;">
        <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:8px;">RECEIVER</div>
        <div style="font-size:14px;font-weight:600;">${d.receiverName || '—'}</div>
        <div style="font-size:13px;color:#555;">${d.receiverPhone || ''}</div>
        <div style="font-size:13px;color:#555;margin-top:4px;">${d.destination}</div>
      </div>
    </div>

    <div class="rl-result-box">
      <div class="rl-result-row"><span style="color:#555;">Service</span><span style="font-weight:600;">${serviceLabel}</span></div>
      <div class="rl-result-row"><span style="color:#555;">Estimated Delivery</span><span>${q.rate.days}</span></div>
      <div class="rl-result-row"><span style="color:#555;">Package Type</span><span style="text-transform:capitalize;">${d.packageType}</span></div>
      <div class="rl-result-row"><span style="color:#555;">Chargeable Weight</span><span>${q.chargeableWeight.toFixed(2)} kg</span></div>
      ${d.value ? `<div class="rl-result-row"><span style="color:#555;">Declared Value</span><span>$${parseFloat(d.value).toFixed(2)}</span></div>` : ''}
      ${d.notes ? `<div class="rl-result-row"><span style="color:#555;">Instructions</span><span>${d.notes}</span></div>` : ''}
    </div>

    <div class="rl-result-box" style="margin-top:12px;">
      <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:10px;">COST BREAKDOWN</div>
      <div class="rl-result-row"><span>Shipping Cost</span><span>$${q.shipping.toFixed(2)}</span></div>
      <div class="rl-result-row"><span>Fuel Surcharge (8%)</span><span>$${q.fuel.toFixed(2)}</span></div>
      <div class="rl-result-row"><span>Handling Fee</span><span>$${q.handling.toFixed(2)}</span></div>
      ${q.insurance > 0 ? `<div class="rl-result-row"><span>Cargo Insurance</span><span>$${q.insurance.toFixed(2)}</span></div>` : ''}
      <div class="rl-result-row" style="border-top:1.5px solid #c5d0e8;padding-top:10px;margin-top:4px;"><span>Subtotal</span><span>$${q.subtotal.toFixed(2)}</span></div>
      <div class="rl-result-row"><span>Tax (7.5%)</span><span>$${q.tax.toFixed(2)}</span></div>
      <div class="rl-result-row"><span>TOTAL (USD)</span><span>$${q.total.toFixed(2)}</span></div>
    </div>

    <p style="font-size:11px;color:#999;margin-top:12px;">This quotation is valid for 72 hours. Final charges may vary based on actual weight/dimensions at pickup. Subject to Ridgeport Logistics Terms & Conditions.</p>
  </div>

  <div class="rl-no-print" style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
    <button id="rl-print-btn" class="rl-btn rl-btn-outline">&#x1F5A8; Print / Save PDF</button>
    <button id="rl-view-receipt-btn" class="rl-btn rl-btn-success">View All Receipts</button>
  </div>
  `;
}


/* ----------------------------------------------------------
   7. TRACKING LOGIC
   ---------------------------------------------------------- */

function handleTrackSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('rl-tracking-input');
  performTracking(input.value.trim().toUpperCase());
}

function performTracking(trackingNumber) {
  const resultEl = document.getElementById('rl-track-result');
  if (!resultEl) return;

  /* Check saved receipts first */
  const receipts = getSavedReceipts();
  const saved = receipts.find(r => r.trackingId === trackingNumber);

  if (saved) {
    resultEl.innerHTML = buildTrackingResult(trackingNumber, saved);
  } else {
    /* Simulate a real tracking result for demo numbers */
    resultEl.innerHTML = buildTrackingResult(trackingNumber, null);
  }
}

const TRACK_STATUSES = ['Order Placed', 'Pickup Scheduled', 'In Transit', 'At Sorting Hub', 'Out for Delivery', 'Delivered'];

function buildTrackingResult(trackingNumber, saved) {
  /* Deterministic "progress" from tracking number characters */
  const hash = trackingNumber.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const stepCount = saved ? 3 : (hash % 5) + 1;
  const isDelivered = saved ? false : stepCount >= 5;
  const statusLabel = isDelivered ? 'Delivered' : TRACK_STATUSES[stepCount];
  const badgeClass = isDelivered ? 'rl-badge-green' : 'rl-badge-amber';

  const now = new Date();
  const dates = TRACK_STATUSES.map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (TRACK_STATUSES.length - 1 - i));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  });

  let steps = '';
  TRACK_STATUSES.forEach((label, i) => {
    const done = i < stepCount;
    const current = i === stepCount;
    const dotClass = done ? 'done' : current ? 'current' : '';
    const hasLine = i < TRACK_STATUSES.length - 1;
    steps += `
    <div class="rl-track-step">
      <div class="rl-track-dot ${dotClass}">${hasLine ? '<div class="rl-track-line"></div>' : ''}</div>
      <div class="rl-track-info">
        <h4 style="${done || current ? 'color:#111;' : 'color:#bbb;'}">${label}</h4>
        <p>${done || current ? dates[i] : 'Pending'}</p>
      </div>
    </div>`;
  });

  const origin = saved ? saved.d.origin : 'Lagos, Nigeria';
  const dest = saved ? saved.d.destination : 'Port Harcourt, Nigeria';
  const service = saved ? saved.serviceLabel : 'Domestic Standard';

  return `
  <div style="background:#f4f7fd;border-radius:10px;padding:16px 18px;margin-bottom:18px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-size:11px;color:#888;letter-spacing:.5px;">TRACKING NUMBER</div>
        <div style="font-size:17px;font-weight:700;color:#1a4fa0;">${trackingNumber}</div>
      </div>
      <span class="rl-badge ${badgeClass}" style="font-size:12px;padding:5px 14px;">${statusLabel}</span>
    </div>
    <div style="display:flex;gap:24px;margin-top:12px;font-size:13px;color:#555;flex-wrap:wrap;">
      <span>&#x1F4E6; ${service}</span>
      <span>&#x1F4CD; ${origin} &rarr; ${dest}</span>
    </div>
  </div>
  <div class="rl-track-status">${steps}</div>`;
}


/* ----------------------------------------------------------
   8. RECEIPT STORE
   ---------------------------------------------------------- */
function getSavedReceipts() {
  try { return JSON.parse(sessionStorage.getItem('rl_receipts') || '[]'); }
  catch (e) { return []; }
}

function saveReceipt(data) {
  const receipts = getSavedReceipts();
  receipts.unshift(data);
  if (receipts.length > 20) receipts.pop();
  try { sessionStorage.setItem('rl_receipts', JSON.stringify(receipts)); }
  catch (e) { /* storage full */ }
}

function renderReceiptsList() {
  const el = document.getElementById('rl-receipts-list');
  if (!el) return;
  const receipts = getSavedReceipts();

  if (receipts.length === 0) {
    el.innerHTML = `<p style="color:#888;font-size:14px;text-align:center;padding:24px 0;">No receipts yet. Generate a quote to create your first receipt.</p>`;
    return;
  }

  el.innerHTML = receipts.map((r, i) => `
  <div style="border:1.5px solid #dde1ea;border-radius:10px;padding:14px 18px;margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-weight:700;font-size:14px;color:#1a4fa0;">${r.trackingId}</div>
        <div style="font-size:12px;color:#888;">${r.quoteDate} · ${r.serviceLabel}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <span style="font-size:16px;font-weight:700;">$${r.q.total.toFixed(2)}</span>
        <button onclick="openFullReceipt(${i})" class="rl-btn rl-btn-outline" style="padding:6px 14px;font-size:12px;">View Receipt</button>
        <button onclick="printReceipt('${r.trackingId}')" class="rl-btn rl-btn-primary" style="padding:6px 14px;font-size:12px;">Print</button>
      </div>
    </div>
    <div style="font-size:13px;color:#666;margin-top:8px;">${r.d.origin} &rarr; ${r.d.destination} · ${r.d.senderName || 'N/A'} &rarr; ${r.d.receiverName || 'N/A'}</div>
  </div>`).join('');
}

window.openFullReceipt = function (index) {
  const receipts = getSavedReceipts();
  const r = receipts[index];
  if (!r) return;

  /* Switch to quote panel and show the receipt there */
  activateTab('quote');
  const resultEl = document.getElementById('rl-quote-result');
  if (!resultEl) return;
  resultEl.innerHTML = buildQuotationHTML(r);
  resultEl.querySelector('#rl-print-btn')?.addEventListener('click', () => printReceipt(r.trackingId));
  resultEl.querySelector('#rl-view-receipt-btn')?.addEventListener('click', () => {
    activateTab('receipt');
    renderReceiptsList();
  });
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* Listen for tab switch to receipt */
document.addEventListener('click', e => {
  if (e.target.dataset?.tab === 'receipt') {
    setTimeout(renderReceiptsList, 0);
  }
});

function printReceipt(trackingId) {
  const el = document.getElementById(`printable-${trackingId}`);
  if (!el) { window.print(); return; }

  const printWindow = window.open('', '_blank', 'width=700,height=900');
  printWindow.document.write(`<!DOCTYPE html><html><head>
    <title>Ridgeport Logistics — Receipt ${trackingId}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:14px;color:#111;padding:32px;max-width:680px;margin:0 auto;}
      .rl-receipt-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;}
      .rl-result-box{background:#f4f7fd;border:1.5px solid #d0daf0;border-radius:10px;padding:20px;margin-top:12px;}
      .rl-result-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e4eaf5;font-size:14px;}
      .rl-result-row:last-child{border-bottom:none;font-weight:700;font-size:15px;color:#1a4fa0;}
      .rl-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;}
      .rl-badge-amber{background:#fef9c3;color:#854d0e;}
      .rl-divider{border:none;border-top:1.5px solid #eee;margin:20px 0;}
    </style>
  </head><body>${el.outerHTML}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
}


/* ----------------------------------------------------------
   9. NEWSLETTER FORM
   ---------------------------------------------------------- */
(function () {
  const form = document.querySelector('.newsletter-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button');
    btn.textContent = 'Subscribed!';
    btn.style.background = '#16a34a';
    btn.disabled = true;
    input.value = '';
    setTimeout(() => {
      btn.textContent = 'Subscribe';
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  });
})();


/* ----------------------------------------------------------
   10. SCROLL REVEAL — fade in sections
   ---------------------------------------------------------- */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    .rl-reveal{opacity:0;transform:translateY(28px);transition:opacity .55s ease,transform .55s ease;}
    .rl-reveal.visible{opacity:1;transform:none;}
    .header.scrolled{padding-top:8px;padding-bottom:8px;box-shadow:0 4px 20px rgba(0,0,0,.12);}
    .nav-menu a.active{color:#1a4fa0;font-weight:700;}
    .hamburger.active span:nth-child(1){transform:rotate(45deg) translate(5px,5px);}
    .hamburger.active span:nth-child(2){opacity:0;}
    .hamburger.active span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px);}
    .hamburger span{display:block;transition:transform .3s,opacity .3s;}
    .mobile-menu{transition:transform .35s ease,opacity .35s ease;transform:translateY(-12px);opacity:0;pointer-events:none;}
    .mobile-menu.open{transform:none;opacity:1;pointer-events:all;}
  `;
  document.head.appendChild(style);

  const targets = document.querySelectorAll(
    '.stat-item,.service-card,.step-item,.review-card,.b-stat,.locations,.cta-content'
  );
  targets.forEach(el => el.classList.add('rl-reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => observer.observe(el));
})();