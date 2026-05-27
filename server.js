const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 4174);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

const sampleClients = [
  {
    id: 'sample-atlas-hospitality-group',
    name: 'Atlas Hospitality Group',
    profile: '12-location premium casual group',
    locationCount: '12',
    region: 'Northeast',
    contactName: 'Mara Ellison',
    contactEmail: 'mara@atlashospitality.example',
    spendRange: 'Over $10M',
    monthlyRate: '$15,000',
    categories: ['Food distribution', 'Payment processing', 'Produce', 'Proteins & seafood', 'Linen & uniforms', 'Waste management', 'POS & delivery platforms'],
    notes: 'High-volume group with shared distributor, processor, linen, and waste vendors across urban locations. Strong fit for lifecycle monitoring and pricing intelligence.',
    status: 'Actions ready',
    createdAt: '2026-05-23T14:15:00.000Z'
  },
  {
    id: 'sample-maison-verre',
    name: 'Maison Verre',
    profile: 'Premium fine dining operator',
    locationCount: '2',
    region: 'Mid-Atlantic',
    contactName: 'Elena Roth',
    contactEmail: 'elena@maisonverre.example',
    spendRange: '$3M - $10M',
    monthlyRate: '$9,000',
    categories: ['Food distribution', 'Proteins & seafood', 'Beverage', 'Linen & uniforms', 'Pest control', 'Equipment maintenance'],
    notes: 'Premium restaurant with high ingredient standards, frequent specialty ordering, and enough vendor spend to justify hands-on review.',
    status: 'Documents needed',
    createdAt: '2026-05-23T14:16:00.000Z'
  },
  {
    id: 'sample-northstar-dining-collective',
    name: 'Northstar Dining Collective',
    profile: '8-location neighborhood restaurant group',
    locationCount: '8',
    region: 'Southeast',
    contactName: 'Priya Raman',
    contactEmail: 'priya@northstardining.example',
    spendRange: '$3M - $10M',
    monthlyRate: '$9,000',
    categories: ['Food distribution', 'Payment processing', 'Waste management', 'Janitorial supplies', 'Smallwares', 'POS & delivery platforms'],
    notes: 'Good fit for shared-vendor leverage, card processing benchmark, and waste schedule review across locations.',
    status: 'In intake',
    createdAt: '2026-05-23T14:17:00.000Z'
  }
];

const sampleUploads = [
  {
    id: 'sample-upload-atlas-processor',
    originalName: '03-payment-processor-statement-northstar-payments.pdf',
    storedName: 'sample-upload-atlas-processor-03-payment-processor-statement-northstar-payments.pdf',
    url: '/sample-input-documents/03-payment-processor-statement-northstar-payments.pdf',
    size: 1478,
    type: 'application/pdf',
    scope: 'client',
    client: 'Atlas Hospitality Group',
    category: 'Payment processing',
    createdAt: '2026-05-23T14:30:00.000Z',
    status: 'In intake'
  },
  {
    id: 'sample-upload-atlas-food',
    originalName: '07-food-distribution-agreement-riverbend-foods.pdf',
    storedName: 'sample-upload-atlas-food-07-food-distribution-agreement-riverbend-foods.pdf',
    url: '/sample-input-documents/07-food-distribution-agreement-riverbend-foods.pdf',
    size: 1696,
    type: 'application/pdf',
    scope: 'client',
    client: 'Atlas Hospitality Group',
    category: 'Food distribution',
    createdAt: '2026-05-23T14:31:00.000Z',
    status: 'In intake'
  },
  {
    id: 'sample-upload-atlas-linen',
    originalName: '02-linen-service-invoice-coastal-linen.pdf',
    storedName: 'sample-upload-atlas-linen-02-linen-service-invoice-coastal-linen.pdf',
    url: '/sample-input-documents/02-linen-service-invoice-coastal-linen.pdf',
    size: 1398,
    type: 'application/pdf',
    scope: 'client',
    client: 'Atlas Hospitality Group',
    category: 'Linen & uniforms',
    createdAt: '2026-05-23T14:32:00.000Z',
    status: 'In intake'
  },
  {
    id: 'sample-upload-atlas-waste',
    originalName: '04-waste-service-invoice-evergreen-waste.pdf',
    storedName: 'sample-upload-atlas-waste-04-waste-service-invoice-evergreen-waste.pdf',
    url: '/sample-input-documents/04-waste-service-invoice-evergreen-waste.pdf',
    size: 1361,
    type: 'application/pdf',
    scope: 'client',
    client: 'Atlas Hospitality Group',
    category: 'Waste management',
    createdAt: '2026-05-23T14:33:00.000Z',
    status: 'In intake'
  },
  {
    id: 'sample-upload-maison-proteins',
    originalName: '11-proteins-seafood-invoice-atlantic-provisions.pdf',
    storedName: 'sample-upload-maison-proteins-11-proteins-seafood-invoice-atlantic-provisions.pdf',
    url: '/sample-input-documents/11-proteins-seafood-invoice-atlantic-provisions.pdf',
    size: 1298,
    type: 'application/pdf',
    scope: 'client',
    client: 'Maison Verre',
    category: 'Proteins & seafood',
    createdAt: '2026-05-23T14:34:00.000Z',
    status: 'In intake'
  },
  {
    id: 'sample-upload-maison-beverage',
    originalName: '10-beverage-distributor-invoice-copper-keg.pdf',
    storedName: 'sample-upload-maison-beverage-10-beverage-distributor-invoice-copper-keg.pdf',
    url: '/sample-input-documents/10-beverage-distributor-invoice-copper-keg.pdf',
    size: 1329,
    type: 'application/pdf',
    scope: 'client',
    client: 'Maison Verre',
    category: 'Beverage',
    createdAt: '2026-05-23T14:35:00.000Z',
    status: 'In intake'
  },
  {
    id: 'sample-upload-maison-pest',
    originalName: '05-pest-control-service-invoice-urban-shield.pdf',
    storedName: 'sample-upload-maison-pest-05-pest-control-service-invoice-urban-shield.pdf',
    url: '/sample-input-documents/05-pest-control-service-invoice-urban-shield.pdf',
    size: 1351,
    type: 'application/pdf',
    scope: 'client',
    client: 'Maison Verre',
    category: 'Pest control',
    createdAt: '2026-05-23T14:36:00.000Z',
    status: 'In intake'
  },
  {
    id: 'sample-upload-maison-equipment',
    originalName: '08-equipment-maintenance-contractor-invoice-steadyfix.pdf',
    storedName: 'sample-upload-maison-equipment-08-equipment-maintenance-contractor-invoice-steadyfix.pdf',
    url: '/sample-input-documents/08-equipment-maintenance-contractor-invoice-steadyfix.pdf',
    size: 1407,
    type: 'application/pdf',
    scope: 'client',
    client: 'Maison Verre',
    category: 'Equipment maintenance',
    createdAt: '2026-05-23T14:37:00.000Z',
    status: 'In intake'
  },
  {
    id: 'sample-upload-northstar-processor',
    originalName: '03-payment-processor-statement-northstar-payments.pdf',
    storedName: 'sample-upload-northstar-processor-03-payment-processor-statement-northstar-payments.pdf',
    url: '/sample-input-documents/03-payment-processor-statement-northstar-payments.pdf',
    size: 1478,
    type: 'application/pdf',
    scope: 'client',
    client: 'Northstar Dining Collective',
    category: 'Payment processing',
    createdAt: '2026-05-23T14:38:00.000Z',
    status: 'In intake'
  },
  {
    id: 'sample-upload-northstar-janitorial',
    originalName: '12-janitorial-supplies-invoice-brightstock.pdf',
    storedName: 'sample-upload-northstar-janitorial-12-janitorial-supplies-invoice-brightstock.pdf',
    url: '/sample-input-documents/12-janitorial-supplies-invoice-brightstock.pdf',
    size: 1282,
    type: 'application/pdf',
    scope: 'client',
    client: 'Northstar Dining Collective',
    category: 'Janitorial supplies',
    createdAt: '2026-05-23T14:39:00.000Z',
    status: 'In intake'
  },
  {
    id: 'sample-upload-northstar-smallwares',
    originalName: '13-smallwares-order-invoice-marketline.pdf',
    storedName: 'sample-upload-northstar-smallwares-13-smallwares-order-invoice-marketline.pdf',
    url: '/sample-input-documents/13-smallwares-order-invoice-marketline.pdf',
    size: 1284,
    type: 'application/pdf',
    scope: 'client',
    client: 'Northstar Dining Collective',
    category: 'Smallwares',
    createdAt: '2026-05-23T14:40:00.000Z',
    status: 'In intake'
  },
  {
    id: 'sample-upload-northstar-pos',
    originalName: '06-pos-platform-invoice-tableline.pdf',
    storedName: 'sample-upload-northstar-pos-06-pos-platform-invoice-tableline.pdf',
    url: '/sample-input-documents/06-pos-platform-invoice-tableline.pdf',
    size: 1359,
    type: 'application/pdf',
    scope: 'client',
    client: 'Northstar Dining Collective',
    category: 'POS & delivery platforms',
    createdAt: '2026-05-23T14:41:00.000Z',
    status: 'In intake'
  }
];

const eventStages = ['New Inquiry', 'Proposal Sent', 'Follow-Up', 'Contracted', 'Closed Won', 'Closed Lost'];

const sampleEventLeads = [
  {
    id: 'event-lead-acme',
    contactName: 'Jordan Blake',
    email: 'jordan@acme.example',
    phone: '(212) 555-0198',
    companyName: 'Acme Partners',
    eventCategory: 'private_dining',
    eventSubtype: 'Corporate dinner',
    eventType: 'Private dining',
    preferredDate: '2026-06-18',
    alternateDate: '2026-06-19',
    guestCount: 72,
    estimatedBudget: '$32,000',
    heardFrom: 'Planner referral',
    specialRequests: 'Private room, pescatarian option, AV for short remarks, and a clean deposit link.',
    stage: 'New Inquiry',
    lastContactAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    acknowledgmentDraft: '',
    proposalDraft: '',
    proposalSentAt: '',
    contractDraft: '',
    contractSignedAt: '',
    depositStatus: 'Not requested',
    eventBrief: '',
    followUps: []
  },
  {
    id: 'event-lead-fashion-week',
    contactName: 'Mina Laurent',
    email: 'mina@atelier.example',
    phone: '(646) 555-0121',
    companyName: 'Atelier Agency',
    eventCategory: 'brand_activation',
    eventSubtype: 'Brand buyout',
    eventType: 'Brand activation',
    brandName: 'Maison Aurelia',
    agencyName: 'Atelier Agency',
    eventObjective: 'Fashion Week press dinner and creator content moment',
    exclusivityRequired: true,
    preferredDate: '2026-09-09',
    alternateDate: '2026-09-10',
    guestCount: 140,
    estimatedBudget: '$86,000',
    heardFrom: 'Agency relationship',
    specialRequests: 'Brand dinner during Fashion Week, late-night extension, passed canapes, premium bar, and step-and-repeat.',
    stage: 'Proposal Sent',
    lastContactAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    acknowledgmentDraft: '',
    proposalDraft: '',
    proposalSentAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    contractDraft: '',
    contractSignedAt: '',
    depositStatus: 'Not requested',
    eventBrief: '',
    followUps: []
  },
  {
    id: 'event-lead-anniversary',
    contactName: 'Elena Park',
    email: 'elena@example.com',
    phone: '(202) 555-0144',
    companyName: 'Personal event',
    eventCategory: 'private_dining',
    eventSubtype: 'Buyout',
    eventType: 'Private dining',
    preferredDate: '2026-07-14',
    alternateDate: '2026-07-15',
    guestCount: 58,
    estimatedBudget: '$42,000',
    heardFrom: 'Concierge',
    specialRequests: 'Full buyout, tasting menu, wine pairing, vegetarian alternate, and low floral arrangements.',
    stage: 'Closed Won',
    lastContactAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    acknowledgmentDraft: '',
    proposalDraft: '',
    proposalSentAt: '',
    contractDraft: '',
    contractSignedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    depositStatus: 'Paid',
    eventBrief: '',
    followUps: []
  }
];

const initialStore = {
  reports: {},
  clients: sampleClients,
  contracts: [],
  actions: [],
  pricingIntel: [],
  eventLeads: sampleEventLeads,
  eventMessages: [],
  eventContracts: [],
  eventPayments: [],
  approvals: {},
  questions: [],
  documents: [],
  uploads: sampleUploads
};

const users = {
  operator: { name: 'Rebecca Hirschfeld', roleLabel: 'Larder team', role: 'operator' },
  client: { name: 'Main Street Hospitality Group', roleLabel: 'Group Portal', role: 'client', clientKey: 'client1', clientName: 'Main Street Hospitality Group' },
  demo: { name: 'Product walkthrough', roleLabel: 'Product walkthrough', role: 'demo' }
};

const operatorCredentials = {
  username: 'rhirschfeld',
  password: 'Larder2026!'
};

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,x-file-name,x-file-type,x-upload-scope,x-client,x-category',
    ...headers
  });
  res.end(payload);
}

function safeName(name) {
  return String(name || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function actionIdentity(action) {
  return [
    action.client || '',
    action.category || '',
    action.title || '',
    action.sourceFile || action.vendor || ''
  ].map(value => String(value).trim().toLowerCase()).join('::');
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(initialStore, null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const store = JSON.parse(await fs.readFile(STORE_PATH, 'utf8'));
  let changed = false;
  for (const [key, value] of Object.entries(initialStore)) {
    if (store[key] === undefined) {
      store[key] = value;
      changed = true;
    }
  }
  if (changed) await writeStore(store);
  return store;
}

async function writeStore(store) {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw.length) return {};
  return JSON.parse(raw.toString('utf8'));
}

function moneyNumber(value) {
  return Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0;
}

function eventCategory(lead) {
  const raw = String(lead.eventCategory || '').toLowerCase();
  if (raw.includes('brand')) return 'brand_activation';
  if (/brand|activation|launch|agency|press|experiential|product/i.test(`${lead.eventType || ''} ${lead.eventSubtype || ''} ${lead.specialRequests || ''}`)) return 'brand_activation';
  return 'private_dining';
}

function eventCategoryLabel(lead) {
  return eventCategory(lead) === 'brand_activation' ? 'Brand activation' : 'Private dining';
}

function eventSubtype(lead) {
  return lead.eventSubtype || (eventCategory(lead) === 'brand_activation' ? 'Brand experience' : lead.eventType || 'Private event');
}

function eventDateDaysAway(value) {
  if (!value) return 999;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 999;
  return Math.ceil((time - Date.now()) / 86400000);
}

function eventPackageMatch(lead) {
  const category = eventCategory(lead);
  const type = String(lead.eventType || '').toLowerCase();
  const subtype = String(eventSubtype(lead) || '').toLowerCase();
  const guests = Number(lead.guestCount) || 0;
  const budget = moneyNumber(lead.estimatedBudget);
  if (category === 'brand_activation') {
    if (/launch|press|agency|brand|experiential/.test(subtype) || guests >= 100 || budget >= 75000) return { package: 'Brand Buyout', room: 'Full venue or hero room with controlled guest flow', minimum: 65000, depositRate: 0.6, menu: 'venue fee plus production, staffing, beverage, content, and exclusivity add-ons' };
    return { package: 'Press Dinner Activation', room: 'Private dining room with content-friendly arrival path', minimum: 35000, depositRate: 0.5, menu: 'flat venue fee with curated dinner, brand moments, staffing, and content terms' };
  }
  if (type.includes('buyout') || subtype.includes('buyout') || guests >= 120 || budget >= 65000) return { package: 'Full Buyout', room: 'Full restaurant buyout', minimum: 45000, depositRate: 0.5, menu: 'chef-curated reception or seated menu with premium beverage package' };
  if (type.includes('wine') || subtype.includes('wine') || guests <= 32) return { package: 'Chef’s Table Dinner', room: 'Private dining room', minimum: 8000, depositRate: 0.35, menu: 'seasonal prix fixe menu with optional wine pairing' };
  if (type.includes('rehearsal') || subtype.includes('rehearsal')) return { package: 'Rehearsal Dinner', room: 'Private dining room or patio backup', minimum: 12000, depositRate: 0.35, menu: 'family-style or prix fixe menu with dietary collection' };
  return { package: 'Corporate Reception', room: 'Semi-private room or reception space', minimum: 18000, depositRate: 0.5, menu: 'passed canapes, stations, and optional open bar package' };
}

function eventGuardrails(lead) {
  const match = eventPackageMatch(lead);
  const budget = moneyNumber(lead.estimatedBudget);
  const guests = Number(lead.guestCount) || 0;
  const perGuest = guests ? budget / guests : 0;
  const daysAway = eventDateDaysAway(lead.preferredDate);
  const guardrails = [];
  if (eventCategory(lead) === 'brand_activation') {
    if (lead.exclusivityRequired && budget < 65000) guardrails.push('Exclusivity requested; protect venue fee and minimum before offering full buyout terms.');
    if (!lead.brandName) guardrails.push('Brand name missing; confirm brand, agency, and usage rights before proposal.');
    if (!lead.eventObjective) guardrails.push('Activation objective missing; clarify whether the goal is press, content, sales, launch, or hospitality.');
    if (/content|photo|video|press|creator|influencer/i.test(lead.specialRequests || '')) guardrails.push('Content capture likely requires usage rights, load-in rules, and staff/guest photography boundaries.');
  }
  if (budget && budget < match.minimum) guardrails.push(`Budget is below the recommended ${match.package} minimum of $${match.minimum.toLocaleString('en-US')}.`);
  if (guests > 110 && !/buyout/i.test(match.package)) guardrails.push('Guest count may require buyout-level space or a simplified reception format.');
  if (daysAway <= 14) guardrails.push('Event date is close; require fast deposit, menu lock, and final-count deadline.');
  if (perGuest && perGuest < 175) guardrails.push('Budget per guest is low for a premium event; protect menu scope and beverage assumptions.');
  if (/av|toast|stage|floral|late|extension|brand|step/i.test(lead.specialRequests || '')) guardrails.push('Special requests may add staffing, AV, decor, or extended-hours costs.');
  if (budget >= 50000) guardrails.push('Operator approval required before discounting minimum, deposit, or cancellation terms.');
  return guardrails.length ? guardrails : ['No major guardrails flagged. Keep standard deposit, cancellation, final count, and menu-lock terms.'];
}

function eventProfitability(lead) {
  const budget = moneyNumber(lead.estimatedBudget);
  const guests = Number(lead.guestCount) || 0;
  if (eventCategory(lead) === 'brand_activation') {
    const productionLoad = /install|step|photo|video|press|creator|display|sampling/i.test(lead.specialRequests || '') ? 4500 : 2200;
    const staffingRate = guests >= 120 ? 0.18 : 0.14;
    const estimatedCost = Math.round(budget * staffingRate + productionLoad);
    const margin = Math.max(0, budget - estimatedCost);
    const marginRate = budget ? margin / budget : 0;
    return { estimatedCost, margin, marginRate, label: marginRate >= 0.72 ? 'Premium fit' : marginRate >= 0.58 ? 'Workable fit' : 'Scope risk' };
  }
  const type = String(lead.eventType || '').toLowerCase();
  const foodRate = type.includes('wine') ? 0.28 : type.includes('rehearsal') ? 0.31 : 0.27;
  const laborRate = guests >= 100 ? 0.23 : 0.2;
  const specialCost = /av|floral|late|extension|brand|step/i.test(lead.specialRequests || '') ? 1200 : 0;
  const estimatedCost = Math.round(budget * (foodRate + laborRate) + specialCost);
  const margin = Math.max(0, budget - estimatedCost);
  const marginRate = budget ? margin / budget : 0;
  return { estimatedCost, margin, marginRate, label: marginRate >= 0.48 ? 'Strong fit' : marginRate >= 0.38 ? 'Workable fit' : 'Margin risk' };
}

function scoreEventLead(lead) {
  const budget = moneyNumber(lead.estimatedBudget);
  const guests = Number(lead.guestCount) || 0;
  const perGuest = guests ? budget / guests : 0;
  const age = Math.floor((Date.now() - new Date(lead.lastContactAt || lead.createdAt || Date.now()).getTime()) / 3600000);
  const daysAway = eventDateDaysAway(lead.preferredDate);
  let score = 35;
  if (budget >= 75000) score += 22;
  else if (budget >= 35000) score += 16;
  else if (budget >= 15000) score += 9;
  if (perGuest >= 250) score += 14;
  else if (perGuest >= 175) score += 8;
  if (/corporate|buyout|holiday|brand|wine/i.test(lead.eventType || '')) score += 10;
  if (eventCategory(lead) === 'brand_activation') score += 10;
  if (lead.exclusivityRequired) score += 6;
  if (/repeat|series|annual|quarterly|corporate/i.test(`${lead.specialRequests || ''} ${lead.eventType || ''}`)) score += 8;
  if (age >= 48) score += 12;
  else if (age >= 24) score += 7;
  if (daysAway > 21 && daysAway < 180) score += 6;
  if (daysAway <= 7) score -= 8;
  if (eventGuardrails(lead).length > 2) score -= 5;
  return Math.max(1, Math.min(100, score));
}

function enrichEventLead(lead) {
  const match = eventPackageMatch(lead);
  const profitability = eventProfitability(lead);
  return Object.assign(lead, {
    eventCategory: eventCategory(lead),
    eventTypeLabel: eventCategoryLabel(lead),
    eventSubtype: eventSubtype(lead),
    score: scoreEventLead(lead),
    recommendedPackage: match.package,
    recommendedRoom: match.room,
    recommendedMinimum: `$${match.minimum.toLocaleString('en-US')}`,
    depositAmount: `$${Math.max(1000, Math.round(moneyNumber(lead.estimatedBudget) * match.depositRate)).toLocaleString('en-US')}`,
    recommendedMenu: match.menu,
    guardrails: eventGuardrails(lead),
    profitability
  });
}

function eventLeadSummary(lead) {
  const enriched = enrichEventLead({ ...lead });
  return `${enriched.eventTypeLabel}: ${enriched.eventSubtype} for ${lead.companyName || lead.contactName || 'the client'} with ${lead.guestCount || 'TBD'} guests on ${lead.preferredDate || 'TBD'} with an estimated budget of ${lead.estimatedBudget || 'TBD'}. Brand: ${lead.brandName || 'N/A'}. Agency: ${lead.agencyName || 'N/A'}. Objective: ${lead.eventObjective || 'N/A'}. Recommended package: ${enriched.recommendedPackage}. Recommended room: ${enriched.recommendedRoom}. Guardrails: ${enriched.guardrails.join(' ')} Special requests: ${lead.specialRequests || 'None noted'}.`;
}

function localEventDraft(kind, lead) {
  const enriched = enrichEventLead({ ...lead });
  const name = lead.contactName || 'there';
  const company = lead.companyName || lead.brandName || 'your team';
  const budget = lead.estimatedBudget || 'the working budget';
  const guests = lead.guestCount || 'your group';
  const date = lead.preferredDate || 'your preferred date';
  const category = eventCategory(lead);
  if (kind === 'acknowledgment') {
    if (category === 'brand_activation') {
      return `Subject: We received your brand activation inquiry\n\nHi ${name},\n\nThank you for reaching out to Larder. We received the inquiry for ${lead.brandName || company} and are reviewing the activation objective, guest count, preferred date, exclusivity needs, and venue fit.\n\nOur team will come back with a commercially clear proposal covering configuration, venue responsibilities, brand responsibilities, usage rights, staffing, and deposit terms. If the date is competitive or the brief is still evolving, reply here and we will prioritize the right hold strategy.\n\nBest,\nLarder`;
    }
    return `Subject: We received your private dining inquiry\n\nHi ${name},\n\nThank you for reaching out to Larder. We received your inquiry for ${eventSubtype(lead)} on ${date} for ${guests} guests.\n\nOur team is reviewing the details now, including room fit, menu direction, timing, and any special requests. You can expect a thoughtful proposal within a few hours. If anything is especially time-sensitive, just reply here and we will prioritize it.\n\nWarmly,\nLarder`;
  }
  if (kind === 'proposal') {
    const deposit = enriched.depositAmount;
    if (category === 'brand_activation') {
      return `Brand Activation Proposal\n\nHi ${name},\n\nThank you for considering Larder for ${lead.brandName || company}. Based on the brief, we recommend the following structure.\n\nActivation Overview\nBrand: ${lead.brandName || 'To confirm'}\nAgency: ${lead.agencyName || 'N/A'}\nObjective: ${lead.eventObjective || 'To confirm'}\nDate: ${date}\nAlternate date: ${lead.alternateDate || 'To confirm'}\nGuest count: ${guests}\nEstimated budget: ${budget}\nExclusivity required: ${lead.exclusivityRequired ? 'Yes' : 'No / to confirm'}\n\nVenue Fit\n${enriched.recommendedRoom}. This configuration gives the brand a controlled hospitality environment, clear arrival flow, and a premium food and beverage experience without making the event feel like a generic rental.\n\nActivation Configuration\n${enriched.recommendedPackage}: ${enriched.recommendedMenu}.\n\nVenue Provides\nCore venue access, agreed room configuration, hospitality staff, food and beverage program, house equipment where applicable, and event-day coordination.\n\nBrand Provides\nBrand assets, specialty production, external vendors, product displays, step-and-repeat or content equipment, insurance certificates, and final creative direction.\n\nExclusivity and Usage Rights\nAny exclusivity, photography, videography, guest content, press, and brand usage rights should be confirmed in the agreement before public announcement or production load-in.\n\nCommercial Terms\nEstimated venue fee / minimum: ${budget}\nRecommended minimum: ${enriched.recommendedMinimum}\nDeposit due to hold date: ${deposit}\nFinal payment and final production details due before the event according to the signed agreement.\n\nProposal Guardrails\n${enriched.guardrails.map(item => `- ${item}`).join('\n')}\n\nNext Steps\nIf the date, activation format, and commercial direction are aligned, Larder will prepare the event agreement, deposit link, and internal production brief.`;
    }
    return `Private Dining Proposal\n\nHi ${name},\n\nThank you for considering Larder for your ${eventSubtype(lead)}. Based on your inquiry, we recommend the following direction.\n\nEvent Overview\nDate: ${date}\nAlternate date: ${lead.alternateDate || 'To confirm'}\nGuest count: ${guests}\nEstimated budget: ${budget}\nSpecial requests: ${lead.specialRequests || 'None noted'}\n\nRecommended Package\n${enriched.recommendedPackage}: ${enriched.recommendedMenu}.\n\nRoom Description and Configuration\nRecommended space: ${enriched.recommendedRoom}. We will confirm seated, reception, chef's table, or buyout configuration based on final count and service style.\n\nIncluded\nMenu planning, private dining coordination, service staffing, room setup guidance, dietary accommodation tracking, payment coordination, and day-of event brief.\n\nDeposit, Payment, and Cancellation Terms\nEstimated total: ${budget}\nRecommended minimum: ${enriched.recommendedMinimum}\nDeposit due to hold date: ${deposit}\nFinal payment and final count due before the event according to the signed agreement. Cancellations inside the agreed window may be subject to minimum spend or committed preparation costs.\n\nProposal Guardrails\n${enriched.guardrails.map(item => `- ${item}`).join('\n')}\n\nNext Steps\nPlease review the proposal. If the date, guest count, and budget direction look right, we will prepare the event agreement and deposit link.`;
  }
  if (kind === 'contract') {
    if (category === 'brand_activation') {
      return `Brand Activation Agreement\n\nClient: ${name}\nCompany: ${company}\nBrand: ${lead.brandName || 'To confirm'}\nAgency: ${lead.agencyName || 'N/A'}\nActivation Type: ${eventSubtype(lead)}\nEvent Date: ${date}\nAlternate Date: ${lead.alternateDate || 'N/A'}\nGuest Count: ${guests}\nVenue Fee / Estimated Total: ${budget}\nDeposit Amount: ${enriched.depositAmount}\nExclusivity: ${lead.exclusivityRequired ? 'Exclusive venue use requested and subject to final approval' : 'No exclusivity unless explicitly stated'}\n\nBrand Use and Restrictions\nBrand may activate only within the approved footprint, timeline, and production rules. Open flame, exterior signage, amplified sound, alcohol sampling, third-party vendors, and structural installations require written approval.\n\nIP, Photography, and Usage Rights\nPhotography, videography, press access, guest content, and venue name/logo usage must follow the rights summary approved by the venue before event announcement or publication.\n\nStaffing and Logistics\nVenue staffing, load-in, setup, breakdown, security, insurance, and vendor access will be confirmed in the event brief.\n\nPayment Terms\nDeposit is due to hold the date. Final payment and production details are due before the event according to the agreed schedule.\n\nCancellation and Postponement\nCancellation, postponement, force majeure, and committed production costs are governed by the final signed agreement.\n\nSignature\nClient Signature: ___________________________  Date: ____________`;
    }
    return `Private Dining Agreement\n\nClient: ${name}\nCompany: ${company}\nEvent Type: ${eventSubtype(lead)}\nEvent Date: ${date}\nGuest Count: ${guests}\nMenu Package: ${enriched.recommendedPackage}, final selections to be confirmed.\nEstimated Total Value: ${budget}\nDeposit Amount: ${enriched.depositAmount}\nDeposit Due Date: Upon signing unless otherwise agreed\nFinal Payment Due Date: Before event date according to venue policy\n\nCancellation Policy\nDeposits are refundable until 14 days before the event, less committed third-party costs. Cancellations inside 14 days may be subject to minimum spend or preparation charges.\n\nForce Majeure\nNeither party is liable for delay or non-performance caused by events beyond reasonable control, subject to prompt notice and commercially reasonable mitigation.\n\nSignature\nBy signing, the client confirms the event details, payment terms, and cancellation policy.\n\nClient Signature: ___________________________  Date: ____________`;
  }
  if (kind === 'brief') {
    if (category === 'brand_activation') {
      return `Internal Brand Activation Brief\n\nContact: ${name}\nCompany: ${company}\nBrand: ${lead.brandName || 'To confirm'}\nAgency: ${lead.agencyName || 'N/A'}\nEmail: ${lead.email || 'Not provided'}\nPhone: ${lead.phone || 'Not provided'}\nDate: ${date}\nSetup / Breakdown: Confirm production windows\nGuest Count: ${guests}\nEstimated Value: ${budget}\nPayment Status: ${lead.depositStatus || 'Not requested'}\n\nActivation Footprint\n${enriched.recommendedRoom}. Confirm floor plan, arrival flow, production footprint, green room needs, and protected service areas.\n\nBrand Is Bringing\nConfirm product, signage, photo/video equipment, displays, agency vendors, premiums, insurance certificates, and any sampling requirements.\n\nVenue Staff Required\nConfirm event manager, service team, bar team, security, porter, facilities, and production liaison.\n\nRights and Exclusivity\nPhotography/content rights confirmed: ${/photo|video|content|press/i.test(lead.specialRequests || '') ? 'Needs explicit confirmation' : 'Standard approval path'}.\nExclusivity confirmed: ${lead.exclusivityRequired ? 'Yes, pending agreement language' : 'No / to confirm'}.\n\nSpecial Notes\n${lead.specialRequests || 'None noted'}\n\nFinal Handoff\nConfirm load-in, breakdown, payment, insurance, production rules, staffing, and guest-facing hospitality plan before distribution.`;
    }
    return `Internal Private Dining Brief\n\nContact: ${name}\nEmail: ${lead.email || 'Not provided'}\nPhone: ${lead.phone || 'Not provided'}\nEvent Type: ${eventSubtype(lead)}\nDate / Arrival Time: ${date} / confirm arrival time\nGuest Count: ${guests}\nEstimated Value: ${budget}\nPayment Status: ${lead.depositStatus || 'Not requested'}\n\nMenu Selections\n${enriched.recommendedPackage}: ${enriched.recommendedMenu}. Confirm final selections, allergies, dietary restrictions, and special courses.\n\nRoom Setup and Configuration\nRecommended space: ${enriched.recommendedRoom}. Confirm seating format, AV, florals, signage, service timing, gratuity, and final count deadline.\n\nMargin Read\n${enriched.profitability.label}: estimated margin ${Math.round(enriched.profitability.marginRate * 100)}% before management review.\n\nSpecial Notes\n${lead.specialRequests || 'None noted'}\n\nKitchen/Floor Handoff\nConfirm final count, menu, dietary restrictions, arrival time, beverage plan, gratuity/payment status, and special notes before BEO distribution.`;
  }
  return '';
}

function localFollowUpDraft(day, lead) {
  const name = lead.contactName || 'there';
  if (eventCategory(lead) === 'brand_activation') {
    if (day === 1) {
      return `Subject: Following up on the ${lead.brandName || 'brand'} activation fit\n\nHi ${name},\n\nI wanted to check in on the activation proposal and make sure the venue direction, exclusivity assumptions, and production scope feel aligned for ${lead.brandName || 'the brand'}.\n\nIf helpful, we can revise the configuration around guest flow, content capture, staffing, or date hold strategy.\n\nBest,\nLarder`;
    }
    if (day === 3) {
      return `Subject: A useful activation reference\n\nHi ${name},\n\nOne structure that has worked well for similar brand experiences is separating the commercial venue fee from production add-ons and usage rights. It keeps the creative flexible while making approvals much cleaner for the venue and agency team.\n\nHappy to adjust the proposal in that format if useful.\n\nBest,\nLarder`;
    }
    return `Subject: Should we keep this activation date active?\n\nHi ${name},\n\nJust closing the loop on the activation inquiry. If ${lead.brandName || 'the brand'} is still considering the date, we should move toward a hold, agreement, and deposit. If the brief has shifted, no problem. A quick update helps us manage availability.\n\nBest,\nLarder`;
  }
  if (day === 1) {
    return `Subject: Checking in on your private event proposal\n\nHi ${name},\n\nI wanted to make sure you received the proposal and see whether the date, guest count, and menu direction still feel right. Happy to adjust the room setup, beverage package, or timing if helpful.\n\nWarmly,\nLarder Private Events`;
  }
  if (day === 3) {
    return `Subject: A helpful private dining example\n\nHi ${name},\n\nOne thing that has worked well for similar events is keeping the menu seasonal and giving guests one clear beverage upgrade option. It keeps the experience polished while making planning easier.\n\nIf you would like, we can revise your proposal with that structure and hold the date pending deposit.\n\nWarmly,\nLarder Private Events`;
  }
  return `Subject: Should we keep this date on hold?\n\nHi ${name},\n\nJust closing the loop on your private event inquiry. If you are still considering the date, we can keep moving toward a deposit and agreement. If plans have changed, no problem at all. A quick reply either way helps us manage the room calendar.\n\nWarmly,\nLarder Private Events`;
}

async function generateClaudeText(kind, lead, extra = '') {
  if (!process.env.ANTHROPIC_API_KEY) {
    return kind === 'followup' ? localFollowUpDraft(extra.day || 1, lead) : localEventDraft(kind, lead);
  }
  const tone = eventCategory(lead) === 'brand_activation'
    ? 'professional, brand-aware, commercially confident, and precise about venue versus brand responsibilities'
    : 'warm, personal, experiential, and hospitality-forward';
  const prompt = `You are writing for Larder, the revenue desk for premium hospitality events. Generate ${kind} copy that is ${tone}. Never overpromise. Every output must be editable by a coordinator before sending. Context: ${eventLeadSummary(lead)} ${extra.note || ''}`;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!response.ok) throw new Error(`Claude request failed: ${response.status}`);
  const data = await response.json();
  return data.content?.map(part => part.text || '').join('\n').trim() || localEventDraft(kind, lead);
}

async function sendTransactionalEmail({ to, subject, body }) {
  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.LARDER_FROM_EMAIL || 'Larder Events <events@larder.local>',
        to: [to],
        subject,
        text: body
      })
    });
    if (!response.ok) throw new Error(`Resend request failed: ${response.status}`);
    return 'Sent via Resend';
  }
  if (process.env.SENDGRID_API_KEY) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.LARDER_FROM_EMAIL || 'events@larder.local', name: 'Larder Events' },
        subject,
        content: [{ type: 'text/plain', value: body }]
      })
    });
    if (!response.ok) throw new Error(`SendGrid request failed: ${response.status}`);
    return 'Sent via SendGrid';
  }
  return 'Local send log';
}

function simplePdfBuffer(title, text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n').flatMap(line => {
    const chunks = [];
    let rest = line || ' ';
    while (rest.length > 86) {
      chunks.push(rest.slice(0, 86));
      rest = rest.slice(86);
    }
    chunks.push(rest);
    return chunks;
  }).slice(0, 62);
  const escapePdf = value => String(value).replace(/[\\()]/g, '\\$&');
  const content = [
    'BT',
    '/F1 18 Tf',
    '54 760 Td',
    `(${escapePdf(title)}) Tj`,
    '/F1 10 Tf',
    '0 -28 Td',
    ...lines.map((line, index) => `${index ? '0 -14 Td' : ''}(${escapePdf(line)}) Tj`),
    'ET'
  ].join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain; charset=utf-8'
    };
    res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    send(res, 404, 'Not found');
  }
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/state') {
    return send(res, 200, await readStore());
  }

  if (req.method === 'GET' && url.pathname === '/api/events/state') {
    const store = await readStore();
    return send(res, 200, {
      leads: (store.eventLeads || []).map(lead => enrichEventLead(lead)),
      messages: store.eventMessages || [],
      contracts: store.eventContracts || [],
      payments: store.eventPayments || [],
      stages: eventStages
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/events/inquiries') {
    const store = await readStore();
    const body = await readJson(req);
    const lead = {
      id: crypto.randomUUID(),
      contactName: String(body.contactName || '').trim(),
      companyName: String(body.companyName || '').trim(),
      email: String(body.email || '').trim(),
      phone: String(body.phone || '').trim(),
      eventCategory: String(body.eventCategory || body.eventType || 'private_dining').trim(),
      eventSubtype: String(body.eventSubtype || '').trim(),
      eventType: String(body.eventType || '').trim(),
      preferredDate: String(body.preferredDate || '').trim(),
      alternateDate: String(body.alternateDate || '').trim(),
      guestCount: Number(body.guestCount) || 0,
      estimatedBudget: String(body.estimatedBudget || '').trim(),
      heardFrom: String(body.heardFrom || '').trim(),
      brandName: String(body.brandName || '').trim(),
      agencyName: String(body.agencyName || '').trim(),
      eventObjective: String(body.eventObjective || '').trim(),
      exclusivityRequired: Boolean(body.exclusivityRequired),
      specialRequests: String(body.specialRequests || '').trim(),
      stage: 'New Inquiry',
      lastContactAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      acknowledgmentDraft: '',
      proposalDraft: '',
      proposalSentAt: '',
      contractDraft: '',
      contractSignedAt: '',
      depositStatus: 'Not requested',
      eventBrief: '',
      followUps: []
    };
    if (!lead.contactName || !lead.email) return send(res, 400, { error: 'Contact name and email are required' });
    enrichEventLead(lead);
    lead.acknowledgmentDraft = await generateClaudeText('acknowledgment', lead);
    store.eventLeads ||= [];
    store.eventMessages ||= [];
    store.eventLeads.unshift(lead);
    store.eventMessages.unshift({
      id: crypto.randomUUID(),
      leadId: lead.id,
      type: 'Acknowledgment draft',
      to: lead.email,
      subject: 'We received your private event inquiry',
      body: lead.acknowledgmentDraft,
      status: 'Drafted for review',
      createdAt: new Date().toISOString()
    });
    await writeStore(store);
    return send(res, 201, { lead, leads: store.eventLeads.map(item => enrichEventLead(item)), messages: store.eventMessages });
  }

  const eventLeadMatch = url.pathname.match(/^\/api\/events\/leads\/([^/]+)$/);
  if (req.method === 'PATCH' && eventLeadMatch) {
    const store = await readStore();
    const lead = (store.eventLeads || []).find(item => item.id === eventLeadMatch[1]);
    if (!lead) return send(res, 404, { error: 'Unknown event lead' });
    const body = await readJson(req);
    Object.assign(lead, {
      stage: body.stage || lead.stage,
      contactName: body.contactName !== undefined ? String(body.contactName || '') : lead.contactName,
      companyName: body.companyName !== undefined ? String(body.companyName || '') : lead.companyName,
      email: body.email !== undefined ? String(body.email || '') : lead.email,
      phone: body.phone !== undefined ? String(body.phone || '') : lead.phone,
      eventCategory: body.eventCategory !== undefined ? String(body.eventCategory || '') : lead.eventCategory,
      eventSubtype: body.eventSubtype !== undefined ? String(body.eventSubtype || '') : lead.eventSubtype,
      eventType: body.eventType !== undefined ? String(body.eventType || '') : lead.eventType,
      preferredDate: body.preferredDate !== undefined ? String(body.preferredDate || '') : lead.preferredDate,
      alternateDate: body.alternateDate !== undefined ? String(body.alternateDate || '') : lead.alternateDate,
      guestCount: body.guestCount !== undefined ? Number(body.guestCount) || 0 : lead.guestCount,
      estimatedBudget: body.estimatedBudget !== undefined ? String(body.estimatedBudget || '') : lead.estimatedBudget,
      heardFrom: body.heardFrom !== undefined ? String(body.heardFrom || '') : lead.heardFrom,
      brandName: body.brandName !== undefined ? String(body.brandName || '') : lead.brandName,
      agencyName: body.agencyName !== undefined ? String(body.agencyName || '') : lead.agencyName,
      eventObjective: body.eventObjective !== undefined ? String(body.eventObjective || '') : lead.eventObjective,
      exclusivityRequired: body.exclusivityRequired !== undefined ? Boolean(body.exclusivityRequired) : lead.exclusivityRequired,
      specialRequests: body.specialRequests !== undefined ? String(body.specialRequests || '') : lead.specialRequests,
      closeLostReason: body.closeLostReason !== undefined ? String(body.closeLostReason || '') : lead.closeLostReason,
      lastContactAt: body.lastContactAt || lead.lastContactAt,
      updatedAt: new Date().toISOString()
    });
    enrichEventLead(lead);
    await writeStore(store);
    return send(res, 200, { lead, leads: store.eventLeads.map(item => enrichEventLead(item)) });
  }

  const eventGenerateMatch = url.pathname.match(/^\/api\/events\/leads\/([^/]+)\/generate\/([^/]+)$/);
  if (req.method === 'POST' && eventGenerateMatch) {
    const store = await readStore();
    const lead = (store.eventLeads || []).find(item => item.id === eventGenerateMatch[1]);
    if (!lead) return send(res, 404, { error: 'Unknown event lead' });
    const kind = eventGenerateMatch[2];
    const body = await readJson(req);
    let draft = '';
    if (kind === 'proposal') {
      draft = await generateClaudeText('proposal', lead);
      lead.proposalDraft = draft;
    } else if (kind === 'contract') {
      draft = await generateClaudeText('contract', lead);
      lead.contractDraft = draft;
      store.eventContracts ||= [];
      store.eventContracts.unshift({
        id: crypto.randomUUID(),
        leadId: lead.id,
        body: draft,
        status: 'Draft',
        createdAt: new Date().toISOString()
      });
    } else if (kind === 'brief') {
      draft = await generateClaudeText('brief', lead);
      lead.eventBrief = draft;
    } else if (kind === 'followup') {
      const day = Number(body.day) || 1;
      draft = await generateClaudeText('followup', lead, { day });
      lead.followUps ||= [];
      lead.followUps.push({ day, body: draft, status: 'Draft', createdAt: new Date().toISOString() });
    } else if (kind === 'acknowledgment') {
      draft = await generateClaudeText('acknowledgment', lead);
      lead.acknowledgmentDraft = draft;
    } else {
      return send(res, 400, { error: 'Unknown generation type' });
    }
    lead.updatedAt = new Date().toISOString();
    await writeStore(store);
    enrichEventLead(lead);
    return send(res, 200, { lead, draft, leads: store.eventLeads.map(item => enrichEventLead(item)), contracts: store.eventContracts || [] });
  }

  const eventSendMatch = url.pathname.match(/^\/api\/events\/leads\/([^/]+)\/send$/);
  if (req.method === 'POST' && eventSendMatch) {
    const store = await readStore();
    const lead = (store.eventLeads || []).find(item => item.id === eventSendMatch[1]);
    if (!lead) return send(res, 404, { error: 'Unknown event lead' });
    const body = await readJson(req);
    const status = await sendTransactionalEmail({
      to: String(body.to || lead.email),
      subject: String(body.subject || 'Private event follow-up'),
      body: String(body.body || '')
    });
    const message = {
      id: crypto.randomUUID(),
      leadId: lead.id,
      type: String(body.type || 'Email'),
      to: String(body.to || lead.email),
      subject: String(body.subject || 'Private event follow-up'),
      body: String(body.body || ''),
      status,
      createdAt: new Date().toISOString()
    };
    store.eventMessages ||= [];
    store.eventMessages.unshift(message);
    lead.lastContactAt = new Date().toISOString();
    if (/proposal/i.test(message.type)) {
      lead.stage = 'Proposal Sent';
      lead.proposalSentAt = lead.lastContactAt;
    }
    if (/follow/i.test(message.type) && lead.stage === 'Proposal Sent') lead.stage = 'Follow-Up';
    lead.updatedAt = new Date().toISOString();
    await writeStore(store);
    enrichEventLead(lead);
    return send(res, 200, { message, lead, leads: store.eventLeads.map(item => enrichEventLead(item)), messages: store.eventMessages });
  }

  const eventPdfMatch = url.pathname.match(/^\/api\/events\/leads\/([^/]+)\/proposal.pdf$/);
  if (req.method === 'GET' && eventPdfMatch) {
    const store = await readStore();
    const lead = (store.eventLeads || []).find(item => item.id === eventPdfMatch[1]);
    if (!lead) return send(res, 404, { error: 'Unknown event lead' });
    const pdf = simplePdfBuffer('Larder Hospitality Event Proposal', lead.proposalDraft || localEventDraft('proposal', lead));
    res.writeHead(200, {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${safeName(lead.contactName || 'proposal')}-proposal.pdf"`
    });
    return res.end(pdf);
  }

  const eventSignMatch = url.pathname.match(/^\/api\/events\/leads\/([^/]+)\/sign$/);
  if (req.method === 'POST' && eventSignMatch) {
    const store = await readStore();
    const lead = (store.eventLeads || []).find(item => item.id === eventSignMatch[1]);
    if (!lead) return send(res, 404, { error: 'Unknown event lead' });
    const body = await readJson(req);
    lead.contractSignedAt = new Date().toISOString();
    lead.signature = String(body.signature || 'Signed electronically');
    lead.stage = 'Contracted';
    lead.updatedAt = new Date().toISOString();
    await writeStore(store);
    enrichEventLead(lead);
    return send(res, 200, { lead, leads: store.eventLeads.map(item => enrichEventLead(item)) });
  }

  const eventDepositMatch = url.pathname.match(/^\/api\/events\/leads\/([^/]+)\/deposit$/);
  if (req.method === 'POST' && eventDepositMatch) {
    const store = await readStore();
    const lead = (store.eventLeads || []).find(item => item.id === eventDepositMatch[1]);
    if (!lead) return send(res, 404, { error: 'Unknown event lead' });
    const total = moneyNumber(lead.estimatedBudget);
    const amount = Math.max(1000, Math.round(total * 0.5));
    const payment = {
      id: crypto.randomUUID(),
      leadId: lead.id,
      amount,
      status: process.env.STRIPE_SECRET_KEY ? 'Stripe checkout ready' : 'Marked paid locally',
      checkoutUrl: process.env.STRIPE_SECRET_KEY ? '' : `/larder-events.html#deposit-${lead.id}`,
      createdAt: new Date().toISOString()
    };
    store.eventPayments ||= [];
    store.eventPayments.unshift(payment);
    lead.depositStatus = payment.status === 'Marked paid locally' ? 'Paid' : 'Requested';
    lead.updatedAt = new Date().toISOString();
    await writeStore(store);
    enrichEventLead(lead);
    return send(res, 200, { payment, lead, leads: store.eventLeads.map(item => enrichEventLead(item)), payments: store.eventPayments });
  }

  if (req.method === 'GET' && url.pathname === '/api/contracts') {
    const store = await readStore();
    return send(res, 200, { contracts: store.contracts || [] });
  }

  if (req.method === 'GET' && url.pathname === '/api/pricing-intel') {
    const store = await readStore();
    return send(res, 200, { pricingIntel: store.pricingIntel || [] });
  }

  if (req.method === 'POST' && url.pathname === '/api/pricing-intel') {
    const store = await readStore();
    const body = await readJson(req);
    const record = {
      id: body.id || crypto.randomUUID(),
      sourceActionId: String(body.sourceActionId || ''),
      source: String(body.source || 'Closed action'),
      client: String(body.client || 'Client from upload'),
      vendor: String(body.vendor || 'Vendor'),
      category: String(body.category || 'Other'),
      region: String(body.region || 'Mid-Atlantic'),
      volumeTier: String(body.volumeTier || ''),
      annualVolume: Number(body.annualVolume) || 0,
      incumbentCost: Number(body.incumbentCost) || 0,
      settledCost: Number(body.settledCost) || 0,
      savings: Number(body.savings) || 0,
      savingsRate: Number(body.savingsRate) || 0,
      rateLabel: String(body.rateLabel || ''),
      confidence: String(body.confidence || 'Closed'),
      closedAt: body.closedAt || new Date().toISOString(),
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.pricingIntel ||= [];
    const existingIndex = store.pricingIntel.findIndex(item =>
      item.id === record.id ||
      (record.sourceActionId && item.sourceActionId === record.sourceActionId)
    );
    if (existingIndex >= 0) {
      store.pricingIntel[existingIndex] = { ...store.pricingIntel[existingIndex], ...record, id: store.pricingIntel[existingIndex].id };
    } else {
      store.pricingIntel.unshift(record);
    }
    await writeStore(store);
    return send(res, 201, { record, pricingIntel: store.pricingIntel });
  }

  if (req.method === 'POST' && url.pathname === '/api/contracts') {
    const store = await readStore();
    const body = await readJson(req);
    const contract = {
      id: body.id || crypto.randomUUID(),
      client: String(body.client || 'Unassigned client'),
      vendor: String(body.vendor || 'Vendor'),
      category: String(body.category || 'Uncategorized'),
      source: String(body.source || ''),
      sourceUploadId: String(body.sourceUploadId || ''),
      uploadId: String(body.uploadId || body.sourceUploadId || ''),
      uploadUrl: String(body.uploadUrl || ''),
      status: String(body.status || 'Monitored'),
      renewalDate: String(body.renewalDate || 'Needs review'),
      noticeWindowDays: Number(body.noticeWindowDays) || 90,
      noticeDeadline: String(body.noticeDeadline || 'Needs review'),
      escalationClause: String(body.escalationClause || 'Needs review'),
      autoRenew: Boolean(body.autoRenew),
      marketWatch: Boolean(body.marketWatch),
      annualValue: String(body.annualValue || 'Needs review'),
      risk: String(body.risk || 'Unreviewed'),
      savings: String(body.savings || 'TBD'),
      owner: String(body.owner || 'Unassigned'),
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.contracts ||= [];
    const identity = [contract.client, contract.vendor, contract.category]
      .map(value => String(value || '').trim().toLowerCase()).join('::');
    const existingIndex = store.contracts.findIndex(item =>
      item.id === contract.id ||
      [item.client, item.vendor, item.category].map(value => String(value || '').trim().toLowerCase()).join('::') === identity
    );
    if (existingIndex >= 0) {
      store.contracts[existingIndex] = { ...store.contracts[existingIndex], ...contract, id: store.contracts[existingIndex].id };
    } else {
      store.contracts.unshift(contract);
    }
    await writeStore(store);
    return send(res, 201, { contract, contracts: store.contracts });
  }

  if (req.method === 'POST' && url.pathname === '/api/clients') {
    const store = await readStore();
    const body = await readJson(req);
    const name = String(body.name || '').trim();
    if (!name) return send(res, 400, { error: 'Client name is required' });
    const client = {
      id: crypto.randomUUID(),
      name,
      profile: String(body.profile || '').trim(),
      locationCount: String(body.locationCount || '1').trim(),
      region: String(body.region || 'Mid-Atlantic').trim(),
      contactName: String(body.contactName || '').trim(),
      contactEmail: String(body.contactEmail || '').trim(),
      spendRange: String(body.spendRange || '').trim(),
      monthlyRate: String(body.monthlyRate || '').trim(),
      categories: Array.isArray(body.categories) ? body.categories : [],
      notes: String(body.notes || '').trim(),
      status: String(body.status || 'Documents needed').trim(),
      createdAt: new Date().toISOString()
    };
    store.clients ||= [];
    store.clients.unshift(client);
    await writeStore(store);
    return send(res, 201, { client, clients: store.clients });
  }

  const clientMatch = url.pathname.match(/^\/api\/clients\/([^/]+)$/);
  if (req.method === 'PATCH' && clientMatch) {
    const store = await readStore();
    store.clients ||= [];
    const client = store.clients.find(item => item.id === clientMatch[1]);
    if (!client) return send(res, 404, { error: 'Unknown client' });
    const body = await readJson(req);
    const previousName = client.name;
    const name = String(body.name || '').trim();
    if (!name) return send(res, 400, { error: 'Client name is required' });
    Object.assign(client, {
      name,
      profile: String(body.profile || '').trim(),
      locationCount: String(body.locationCount || '1').trim(),
      region: String(body.region || 'Mid-Atlantic').trim(),
      contactName: String(body.contactName || '').trim(),
      contactEmail: String(body.contactEmail || '').trim(),
      spendRange: String(body.spendRange || '').trim(),
      monthlyRate: String(body.monthlyRate || '').trim(),
      categories: Array.isArray(body.categories) ? body.categories : [],
      notes: String(body.notes || '').trim(),
      updatedAt: new Date().toISOString()
    });
    if (previousName && previousName !== client.name) {
      for (const action of store.actions || []) {
        if (action.client === previousName) action.client = client.name;
      }
      for (const contract of store.contracts || []) {
        if (contract.client === previousName) contract.client = client.name;
      }
      for (const upload of store.uploads || []) {
        if (upload.client === previousName) upload.client = client.name;
      }
    }
    await writeStore(store);
    return send(res, 200, { client, clients: store.clients, actions: store.actions || [], contracts: store.contracts || [], uploads: store.uploads || [] });
  }

  if (req.method === 'POST' && url.pathname === '/api/actions') {
    const store = await readStore();
    const body = await readJson(req);
    const action = {
      id: body.id || crypto.randomUUID(),
      client: String(body.client || 'Client from upload'),
      vendor: String(body.vendor || 'Uploaded vendor'),
      category: String(body.category || 'Other'),
      title: String(body.title || 'Review vendor document'),
      description: String(body.description || ''),
      savings: String(body.savings || 'Needs evidence'),
      spend: String(body.spend || ''),
      priority: String(body.priority || 'Medium'),
      status: String(body.status || 'Actions ready'),
      nextStep: String(body.nextStep || ''),
      evidence: String(body.evidence || ''),
      sourceFile: String(body.sourceFile || ''),
      sourceUploadId: String(body.sourceUploadId || ''),
      costMathHeadline: String(body.costMathHeadline || ''),
      costMathRows: Array.isArray(body.costMathRows) ? body.costMathRows : [],
      ledger: body.ledger && typeof body.ledger === 'object' ? body.ledger : {},
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.actions ||= [];
    const identity = actionIdentity(action);
    const existingIndex = store.actions.findIndex(item =>
      item.id === action.id ||
      (item.sourceUploadId && item.sourceUploadId === action.sourceUploadId && item.title === action.title) ||
      actionIdentity(item) === identity
    );
    if (existingIndex >= 0) {
      store.actions[existingIndex] = { ...store.actions[existingIndex], ...action, id: store.actions[existingIndex].id };
    } else {
      store.actions.unshift(action);
    }
    await writeStore(store);
    return send(res, 201, { action, actions: store.actions });
  }

  const actionMatch = url.pathname.match(/^\/api\/actions\/([^/]+)$/);
  if (req.method === 'PATCH' && actionMatch) {
    const store = await readStore();
    store.actions ||= [];
    const action = store.actions.find(item => item.id === actionMatch[1]);
    if (!action) return send(res, 404, { error: 'Unknown action' });
    const body = await readJson(req);
    Object.assign(action, {
      status: body.status || action.status,
      completionNote: body.completionNote !== undefined ? String(body.completionNote || '') : action.completionNote,
      completedAt: body.completedAt !== undefined ? String(body.completedAt || '') : action.completedAt,
      updatedAt: new Date().toISOString()
    });
    await writeStore(store);
    return send(res, 200, { action, actions: store.actions });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const { type, username, password } = await readJson(req);
    if (!users[type]) return send(res, 401, { error: 'Unknown user type' });
    return send(res, 200, { user: users[type] });
  }

  const reportMatch = url.pathname.match(/^\/api\/reports\/([^/]+)\/state$/);
  if (req.method === 'PATCH' && reportMatch) {
    const store = await readStore();
    const key = reportMatch[1];
    const body = await readJson(req);
    if (!store.reports[key]) return send(res, 404, { error: 'Unknown report' });
    store.reports[key].reviewState = body.reviewState || store.reports[key].reviewState;
    store.reports[key].status = body.status || store.reports[key].status;
    await writeStore(store);
    return send(res, 200, store.reports[key]);
  }

  if (req.method === 'POST' && url.pathname === '/api/client/approvals') {
    const store = await readStore();
    const { approval, approved } = await readJson(req);
    store.approvals[approval] = Boolean(approved);
    await writeStore(store);
    return send(res, 200, { approvals: store.approvals });
  }

  if (req.method === 'POST' && url.pathname === '/api/client/questions') {
    const store = await readStore();
    const { message, user } = await readJson(req);
    store.questions.push({ id: crypto.randomUUID(), message, user, createdAt: new Date().toISOString() });
    await writeStore(store);
    return send(res, 201, { questions: store.questions });
  }

  const questionReplyMatch = url.pathname.match(/^\/api\/client\/questions\/([^/]+)\/reply$/);
  if (req.method === 'PATCH' && questionReplyMatch) {
    const store = await readStore();
    const question = (store.questions || []).find(item => item.id === questionReplyMatch[1]);
    if (!question) return send(res, 404, { error: 'Unknown question' });
    const { reply, repliedBy } = await readJson(req);
    question.reply = reply || question.reply;
    question.repliedBy = repliedBy || question.repliedBy || 'Larder';
    question.repliedAt = new Date().toISOString();
    await writeStore(store);
    return send(res, 200, { question, questions: store.questions });
  }

  if (req.method === 'POST' && url.pathname === '/api/client/documents') {
    const store = await readStore();
    const { index, received } = await readJson(req);
    if (store.documents[index]) store.documents[index].received = Boolean(received);
    await writeStore(store);
    return send(res, 200, { documents: store.documents });
  }

  const contractMatch = url.pathname.match(/^\/api\/contracts\/([^/]+)$/);
  if (req.method === 'PATCH' && contractMatch) {
    const store = await readStore();
    const contract = (store.contracts || []).find(item => item.id === contractMatch[1]);
    if (!contract) return send(res, 404, { error: 'Unknown contract' });
    const body = await readJson(req);
    Object.assign(contract, {
      status: body.status || contract.status,
      owner: body.owner || contract.owner,
      risk: body.risk || contract.risk,
      renewalDate: body.renewalDate || contract.renewalDate,
      noticeWindowDays: body.noticeWindowDays || contract.noticeWindowDays,
      noticeDeadline: body.noticeDeadline || contract.noticeDeadline,
      escalationClause: body.escalationClause || contract.escalationClause,
      autoRenew: body.autoRenew !== undefined ? Boolean(body.autoRenew) : contract.autoRenew,
      marketWatch: body.marketWatch !== undefined ? Boolean(body.marketWatch) : contract.marketWatch,
      annualValue: body.annualValue || contract.annualValue,
      savings: body.savings || contract.savings,
      updatedAt: new Date().toISOString()
    });
    await writeStore(store);
    return send(res, 200, { contract, contracts: store.contracts });
  }

  if (req.method === 'POST' && url.pathname === '/api/uploads') {
    const store = await readStore();
    const body = await readBody(req);
    const originalName = decodeURIComponent(req.headers['x-file-name'] || 'upload.bin');
    const fileName = `${Date.now()}-${crypto.randomUUID()}-${safeName(originalName)}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    await fs.writeFile(filePath, body);
    const upload = {
      id: crypto.randomUUID(),
      originalName,
      storedName: fileName,
      url: `/uploads/${fileName}`,
      size: body.length,
      type: req.headers['x-file-type'] || 'application/octet-stream',
      scope: req.headers['x-upload-scope'] || 'client',
      client: req.headers['x-client'] || '',
      category: req.headers['x-category'] || '',
      createdAt: new Date().toISOString()
    };
    store.uploads.push(upload);
    if (upload.scope === 'contract') {
      store.contracts ||= [];
      store.contracts.unshift({
        id: crypto.randomUUID(),
        client: upload.client || 'Unassigned client',
        vendor: safeName(originalName).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
        category: upload.category || 'Uncategorized',
        source: upload.originalName,
        uploadId: upload.id,
        uploadUrl: upload.url,
        status: 'Uploaded',
        renewalDate: 'Needs review',
        noticeWindowDays: 90,
        noticeDeadline: 'Needs review',
        escalationClause: 'Needs review',
        autoRenew: false,
        marketWatch: upload.category === 'Payment processing',
        annualValue: 'Needs review',
        risk: 'Unreviewed',
        savings: 'TBD',
        owner: 'Unassigned',
        createdAt: upload.createdAt
      });
    }
    await writeStore(store);
    return send(res, 201, { upload, uploads: store.uploads });
  }

  const uploadMatch = url.pathname.match(/^\/api\/uploads\/([^/]+)$/);
  if (req.method === 'PATCH' && uploadMatch) {
    const store = await readStore();
    const uploadId = uploadMatch[1];
    const upload = store.uploads.find(item => item.id === uploadId);
    if (!upload) return send(res, 404, { error: 'Unknown upload' });
    const body = await readJson(req);
    Object.assign(upload, {
      client: body.client || upload.client,
      category: body.category || upload.category,
      status: body.status || upload.status,
      processedAt: body.processedAt || upload.processedAt,
      updatedAt: new Date().toISOString()
    });
    await writeStore(store);
    return send(res, 200, { upload, uploads: store.uploads });
  }

  if (req.method === 'DELETE' && uploadMatch) {
    const store = await readStore();
    const uploadId = uploadMatch[1];
    const upload = store.uploads.find(item => item.id === uploadId);
    store.uploads = store.uploads.filter(item => item.id !== uploadId);
    store.contracts = (store.contracts || []).filter(item => item.uploadId !== uploadId);
    if (upload) {
      await fs.rm(path.join(UPLOAD_DIR, upload.storedName), { force: true });
    }
    await writeStore(store);
    return send(res, 200, { uploads: store.uploads });
  }

  send(res, 404, { error: 'Not found' });
}

async function main() {
  await ensureStore();
  const server = http.createServer((req, res) => {
    handle(req, res).catch(error => {
      console.error(error);
      send(res, 500, { error: 'Server error' });
    });
  });
  server.listen(PORT, () => {
    console.log(`Larder backend running at http://localhost:${PORT}`);
  });
}

async function handle(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, '');
  if (req.url.startsWith('/api/')) return handleApi(req, res);
  return serveStatic(req, res);
}

main();
