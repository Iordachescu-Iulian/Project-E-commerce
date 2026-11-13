const baseUrl = process.env.APP_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`;

let failures = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`PASS ${label}`);
  } else {
    failures += 1;
    console.log(`FAIL ${label} ${detail}`);
  }
}

function cookiesFrom(response) {
  const setCookie = response.headers.getSetCookie?.() ?? [];
  const raw = setCookie.length
    ? setCookie
    : [response.headers.get('set-cookie')].filter(Boolean);

  return raw
    .map((value) => value.split(';')[0])
    .filter((value) => value.includes('=') && !value.endsWith('='));
}

async function get(path, cookies = []) {
  const headers = cookies.length ? { cookie: cookies.join('; ') } : {};
  return fetch(`${baseUrl}${path}`, { headers, redirect: 'manual' });
}

async function post(path, body, cookies = [], extraHeaders = {}) {
  const headers = { 'content-type': 'application/json', ...extraHeaders };

  if (cookies.length) {
    headers.cookie = cookies.join('; ');
  }

  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    redirect: 'manual',
  });
}

// Pages
const home = await get('/');
const homeHtml = await home.text();
check('home page renders', home.status === 200 && homeHtml.includes('HEXORA'));

for (const path of ['/catalog', '/login', '/register']) {
  const response = await get(path);
  const html = await response.text();
  check(`${path} renders`, response.status === 200 && html.length > 500);
}

const catalog = await get('/catalog?q=zzzz');
const catalogHtml = await catalog.text();
check(
  '/catalog?q=zzzz shows the empty state',
  catalog.status === 200 && /No games found/i.test(catalogHtml),
);

const product = await get('/products/ashen-crown-digital');
const productHtml = await product.text();
check(
  'product detail renders both editions',
  product.status === 200 &&
    productHtml.includes('Digital Edition') &&
    productHtml.includes('Physical Edition'),
);

const category = await get('/categories/action-adventure');
const categoryHtml = await category.text();
check('category page renders products', category.status === 200 && categoryHtml.includes('Ashen Crown'));

// Account redirect for anonymous visitors
const account = await get('/account');
check(
  'anonymous /account redirects to login',
  account.status === 307 && (account.headers.get('location') ?? '').includes('/login'),
  `${account.status} ${account.headers.get('location') ?? ''}`,
);
await account.text();

// API
const products = await get('/api/products?pageSize=99');
const productsBody = await products.json();
check(
  'product API clamps pageSize to 24',
  products.status === 200 &&
    productsBody.pageSize === 24 &&
    productsBody.items.length === 24 &&
    productsBody.total === 32,
  JSON.stringify({ pageSize: productsBody.pageSize, items: productsBody.items?.length, total: productsBody.total }),
);

const missingProduct = await get('/api/products/does-not-exist');
check('unknown product API returns 404', missingProduct.status === 404);
await missingProduct.text();

const categories = await get('/api/categories');
const categoriesBody = await categories.json();
check('category API returns four categories', categories.status === 200 && categoriesBody.length === 4);

// Seeded demo account
const login = await post('/api/auth/login', {
  email: 'demo@hexora.test',
  password: 'Demo1234!',
});
check('demo customer can log in', login.status === 200);
await login.text();
const cookies = cookiesFrom(login);

const signedInAccount = await get('/account', cookies);
const signedInHtml = await signedInAccount.text();
check('signed-in account page renders', signedInAccount.status === 200 && signedInHtml.includes('Delivery addresses'));

const addresses = await get('/api/addresses', cookies);
const addressesBody = await addresses.json();
check(
  'demo customer has a seeded address',
  addresses.status === 200 && (addressesBody.addresses ?? []).length >= 1,
);

const logout = await post('/api/auth/logout', {}, cookies, { origin: baseUrl });
check('logout succeeds', logout.status === 200);
await logout.text();

const anonymousMe = await get('/api/auth/me');
check('anonymous /api/auth/me returns 401', anonymousMe.status === 401);
await anonymousMe.text();

// Webhook rejections. A placeholder config answers 503; configured Stripe answers 400.
const badSignature = await fetch(`${baseUrl}/api/webhooks/stripe`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'stripe-signature': 't=1,v1=bad' },
  body: '{}',
});
const badSignatureBody = await badSignature.text();
if (badSignature.status === 503) {
  console.log('SKIP webhook signature checks (Stripe keys are placeholders)');
} else {
  check('webhook rejects a bad signature', badSignature.status === 400, `${badSignature.status} ${badSignatureBody}`);

  const missingSignature = await fetch(`${baseUrl}/api/webhooks/stripe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  check('webhook rejects a missing signature', missingSignature.status === 400);
  await missingSignature.text();
}

// Security headers
const headers = home.headers;
check(
  'security headers are present',
  headers.get('x-frame-options') === 'DENY' &&
    headers.get('x-content-type-options') === 'nosniff' &&
    headers.get('referrer-policy') === 'strict-origin-when-cross-origin',
);

console.log(failures === 0 ? 'ALL APP CHECKS PASSED' : `${failures} APP CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
