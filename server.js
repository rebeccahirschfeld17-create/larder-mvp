const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 4174);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

const initialStore = {
  reports: {
    mfg: { reviewState: 'Client ready', status: 'Final' },
    ushg: { reviewState: 'Approved', status: 'Final' },
    nobu: { reviewState: 'Draft', status: 'Draft' }
  },
  contracts: [
    {
      id: 'demo-sysco',
      client: 'Major Food Group',
      vendor: 'Sysco Northeast',
      category: 'Food distribution',
      source: 'Seeded demo record',
      status: 'Reviewing terms',
      renewalDate: 'Jun 3, 2026',
      annualValue: '$2.1M',
      risk: 'High',
      savings: '$181K',
      owner: 'Rebecca',
      createdAt: '2026-05-19T23:54:00.000Z'
    },
    {
      id: 'demo-heartland',
      client: 'Major Food Group',
      vendor: 'Heartland Payment',
      category: 'Payment processing',
      source: 'Seeded demo record',
      status: 'Ready for report',
      renewalDate: 'Jul 8, 2026',
      annualValue: '$520K',
      risk: 'High',
      savings: '$252K',
      owner: 'Rebecca',
      createdAt: '2026-05-19T23:54:00.000Z'
    },
    {
      id: 'demo-ecolab',
      client: 'Nobu Hospitality NYC',
      vendor: 'Ecolab',
      category: 'Sanitation',
      source: 'Seeded demo record',
      status: 'Needs source file',
      renewalDate: 'Jul 1, 2026',
      annualValue: '$180K',
      risk: 'Medium',
      savings: '$11K',
      owner: 'Unassigned',
      createdAt: '2026-05-19T23:54:00.000Z'
    }
  ],
  approvals: {},
  questions: [],
  documents: [
    { label: 'Latest Heartland processing statement', received: true },
    { label: 'Sysco trailing 12-month purchase summary', received: false },
    { label: 'Waste invoice sample by location', received: false }
  ],
  uploads: []
};

const users = {
  operator: { name: 'Rebecca Hirschfeld', roleLabel: 'VendorIQ operator', role: 'operator' },
  client: { name: 'Major Food Group', roleLabel: 'Client stakeholder', role: 'client', clientKey: 'mfg' }
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

  if (req.method === 'GET' && url.pathname === '/api/contracts') {
    const store = await readStore();
    return send(res, 200, { contracts: store.contracts || [] });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const { type } = await readJson(req);
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
    console.log(`VendorIQ backend running at http://localhost:${PORT}`);
  });
}

async function handle(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, '');
  if (req.url.startsWith('/api/')) return handleApi(req, res);
  return serveStatic(req, res);
}

main();
