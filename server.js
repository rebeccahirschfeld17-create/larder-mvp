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
  reports: {},
  clients: [],
  contracts: [],
  actions: [],
  approvals: {},
  questions: [],
  documents: [],
  uploads: []
};

const users = {
  operator: { name: 'Rebecca Hirschfeld', roleLabel: 'Larder team', role: 'operator' },
  client: { name: 'Main Street Bistro', roleLabel: 'Client Portal', role: 'client', clientKey: 'client1', clientName: 'Main Street Bistro' },
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

  if (req.method === 'POST' && url.pathname === '/api/clients') {
    const store = await readStore();
    const body = await readJson(req);
    const name = String(body.name || '').trim();
    if (!name) return send(res, 400, { error: 'Client name is required' });
    const client = {
      id: crypto.randomUUID(),
      name,
      profile: String(body.profile || '').trim(),
      contactName: String(body.contactName || '').trim(),
      contactEmail: String(body.contactEmail || '').trim(),
      spendRange: String(body.spendRange || '').trim(),
      monthlyRate: String(body.monthlyRate || '').trim(),
      successFeeRate: String(body.successFeeRate || '').trim(),
      categories: Array.isArray(body.categories) ? body.categories : [],
      notes: String(body.notes || '').trim(),
      status: 'Documents needed',
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
      contactName: String(body.contactName || '').trim(),
      contactEmail: String(body.contactEmail || '').trim(),
      spendRange: String(body.spendRange || '').trim(),
      monthlyRate: String(body.monthlyRate || '').trim(),
      successFeeRate: String(body.successFeeRate || '').trim(),
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
