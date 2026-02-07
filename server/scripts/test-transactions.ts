/**
 * scripts/test-transactions.ts
 *
 * End-to-end smoke test for every transaction endpoint.
 * Registers a temporary user, logs in, exercises all CRUD + summary routes,
 * validates responses, then cleans up.
 *
 * Prerequisites:
 *   - The server must be running (e.g. `pnpm dev`)
 *   - The database must be migrated
 *
 * Usage:
 *   pnpm test:transactions                     # default: http://localhost:3000
 *   BASE_URL=http://localhost:4000 pnpm test:transactions
 */

const BASE = process.env.BASE_URL?.replace(/\/+$/, '') || 'http://localhost:3000';
const API = `${BASE}/api`;

// Unique email so re-runs never collide
const TEST_EMAIL = `txn-test-${Date.now()}@test.local`;
const TEST_PASSWORD = 'Test1234!secure';

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${label}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function request(
  method: string,
  path: string,
  opts: { body?: unknown; token?: string; query?: Record<string, string> } = {},
) {
  const url = new URL(path, API.endsWith('/') ? API : `${API}/`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { status: res.status, json };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Transaction Endpoint Tests ===`);
  console.log(`Target: ${API}\n`);

  // 0. Health check
  console.log('0. Health check');
  try {
    const { status, json } = await request('GET', `${BASE}/health`);
    assert(status === 200, 'GET /health returns 200', `got ${status}`);
    assert(
      typeof json === 'object' && json !== null && (json as Record<string, unknown>).status === 'ok',
      'Health response has status "ok"',
    );
  } catch (err) {
    console.error(`  [FAIL] Could not reach ${BASE}/health — is the server running?\n`, err);
    process.exit(1);
  }

  // 1. Register + Login
  console.log('\n1. Register & Login');
  const { json: regJson, status: regStatus } = await request('POST', `${API}/auth/register`, {
    body: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  assert(regStatus === 201, 'POST /auth/register returns 201', `got ${regStatus}`);

  const { json: loginJson, status: loginStatus } = await request('POST', `${API}/auth/login`, {
    body: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  assert(loginStatus === 200, 'POST /auth/login returns 200', `got ${loginStatus}`);

  const token = (loginJson as Record<string, unknown>).token as string | undefined;
  assert(!!token, 'Login response includes a token');
  if (!token) {
    console.error('\nCannot continue without a token. Aborting.\n');
    process.exit(1);
  }

  // 2. Auth guard — unauthenticated requests must be rejected
  console.log('\n2. Auth guard');
  const { status: noAuth } = await request('GET', `${API}/transactions`);
  assert(noAuth === 401, 'GET /transactions without token returns 401', `got ${noAuth}`);

  // 3. Create transactions
  console.log('\n3. Create transactions');
  const txns: { id: string }[] = [];

  const income1 = await request('POST', `${API}/transactions`, {
    token,
    body: { type: 'income', amount: 5000, description: 'Salary', category: 'Work', date: '2026-02-01' },
  });
  assert(income1.status === 201, 'Create income transaction returns 201', `got ${income1.status}`);
  const income1Data = ((income1.json as Record<string, unknown>).data as Record<string, unknown>) ?? {};
  assert(!!income1Data.id, 'Response includes transaction id');
  assert(income1Data.type === 'income', 'Type is "income"');
  assert(income1Data.amount === 5000, 'Amount is 5000');
  if (income1Data.id) txns.push({ id: income1Data.id as string });

  const expense1 = await request('POST', `${API}/transactions`, {
    token,
    body: { type: 'expense', amount: 42.5, description: 'Groceries', category: 'Food', date: '2026-02-02' },
  });
  assert(expense1.status === 201, 'Create expense transaction returns 201', `got ${expense1.status}`);
  const expense1Data = ((expense1.json as Record<string, unknown>).data as Record<string, unknown>) ?? {};
  if (expense1Data.id) txns.push({ id: expense1Data.id as string });

  const expense2 = await request('POST', `${API}/transactions`, {
    token,
    body: { type: 'expense', amount: 120, description: 'Electric bill', category: 'Utilities', date: '2026-02-03' },
  });
  assert(expense2.status === 201, 'Create second expense returns 201', `got ${expense2.status}`);
  const expense2Data = ((expense2.json as Record<string, unknown>).data as Record<string, unknown>) ?? {};
  if (expense2Data.id) txns.push({ id: expense2Data.id as string });

  // 4. Validation — bad input
  console.log('\n4. Validation');
  const bad1 = await request('POST', `${API}/transactions`, {
    token,
    body: { type: 'invalid', amount: -10, date: 'not-a-date' },
  });
  assert(bad1.status === 400, 'Invalid type/amount/date returns 400', `got ${bad1.status}`);

  const bad2 = await request('POST', `${API}/transactions`, {
    token,
    body: {},
  });
  assert(bad2.status === 400, 'Empty body returns 400', `got ${bad2.status}`);

  // 5. List transactions
  console.log('\n5. List transactions');
  const list = await request('GET', `${API}/transactions`, { token });
  assert(list.status === 200, 'GET /transactions returns 200', `got ${list.status}`);
  const listBody = list.json as Record<string, unknown>;
  const listData = listBody.data as unknown[];
  const pagination = listBody.pagination as Record<string, unknown>;
  assert(Array.isArray(listData), 'Response data is an array');
  assert(listData.length === 3, `Contains 3 transactions (got ${listData.length})`);
  assert(pagination?.total === 3, `Pagination total is 3 (got ${pagination?.total})`);

  // 5b. Filtered list — by type
  const incomeOnly = await request('GET', `${API}/transactions`, {
    token,
    query: { type: 'income' },
  });
  assert(incomeOnly.status === 200, 'Filtered list returns 200');
  const incomeArr = (incomeOnly.json as Record<string, unknown>).data as unknown[];
  assert(incomeArr.length === 1, `type=income returns 1 result (got ${incomeArr.length})`);

  // 5c. Filtered list — by category (case-insensitive)
  const foodFilter = await request('GET', `${API}/transactions`, {
    token,
    query: { category: 'food' },
  });
  assert(foodFilter.status === 200, 'Category filter returns 200');
  const foodArr = (foodFilter.json as Record<string, unknown>).data as unknown[];
  assert(foodArr.length === 1, `category=food returns 1 result (got ${foodArr.length})`);

  // 5d. Pagination
  const page = await request('GET', `${API}/transactions`, {
    token,
    query: { page: '1', limit: '2' },
  });
  assert(page.status === 200, 'Paginated list returns 200');
  const pageData = (page.json as Record<string, unknown>).data as unknown[];
  const pagePag = (page.json as Record<string, unknown>).pagination as Record<string, unknown>;
  assert(pageData.length === 2, `limit=2 returns 2 items (got ${pageData.length})`);
  assert(pagePag?.totalPages === 2, `totalPages is 2 (got ${pagePag?.totalPages})`);

  // 6. Get by ID
  console.log('\n6. Get by ID');
  if (txns[0]) {
    const byId = await request('GET', `${API}/transactions/${txns[0].id}`, { token });
    assert(byId.status === 200, 'GET /transactions/:id returns 200', `got ${byId.status}`);
    const byIdData = (byId.json as Record<string, unknown>).data as Record<string, unknown>;
    assert(byIdData?.id === txns[0].id, 'Returned transaction has correct id');
  }

  // 6b. Non-existent ID
  const fake = await request('GET', `${API}/transactions/00000000-0000-0000-0000-000000000000`, { token });
  assert(fake.status === 404, 'Non-existent ID returns 404', `got ${fake.status}`);

  // 7. Update
  console.log('\n7. Update');
  if (txns[0]) {
    const upd = await request('PUT', `${API}/transactions/${txns[0].id}`, {
      token,
      body: { amount: 5500, description: 'Salary (revised)' },
    });
    assert(upd.status === 200, 'PUT /transactions/:id returns 200', `got ${upd.status}`);
    const updData = (upd.json as Record<string, unknown>).data as Record<string, unknown>;
    assert(updData?.amount === 5500, 'Amount updated to 5500');
    assert(updData?.description === 'Salary (revised)', 'Description updated');
  }

  // 8. Summary
  console.log('\n8. Summary');
  const summary = await request('GET', `${API}/transactions/summary`, { token });
  assert(summary.status === 200, 'GET /transactions/summary returns 200', `got ${summary.status}`);
  const sumData = (summary.json as Record<string, unknown>).data as Record<string, unknown>;
  assert(sumData?.totalIncome === 5500, `totalIncome is 5500 (got ${sumData?.totalIncome})`);
  assert(sumData?.totalExpense === 162.5, `totalExpense is 162.5 (got ${sumData?.totalExpense})`);
  assert(sumData?.balance === 5337.5, `balance is 5337.5 (got ${sumData?.balance})`);
  assert(sumData?.transactionCount === 3, `transactionCount is 3 (got ${sumData?.transactionCount})`);

  // 8b. Summary with date range
  const rangeSummary = await request('GET', `${API}/transactions/summary`, {
    token,
    query: { startDate: '2026-02-02', endDate: '2026-02-03' },
  });
  assert(rangeSummary.status === 200, 'Date-filtered summary returns 200');
  const rangeData = (rangeSummary.json as Record<string, unknown>).data as Record<string, unknown>;
  assert(rangeData?.totalIncome === 0, `Filtered totalIncome is 0 (got ${rangeData?.totalIncome})`);
  assert(rangeData?.transactionCount === 2, `Filtered count is 2 (got ${rangeData?.transactionCount})`);

  // 9. Delete
  console.log('\n9. Delete');
  if (txns[0]) {
    const del = await request('DELETE', `${API}/transactions/${txns[0].id}`, { token });
    assert(del.status === 200, 'DELETE /transactions/:id returns 200', `got ${del.status}`);

    // Verify it's gone
    const gone = await request('GET', `${API}/transactions/${txns[0].id}`, { token });
    assert(gone.status === 404, 'Deleted transaction returns 404', `got ${gone.status}`);
  }

  // 10. Cleanup — delete remaining transactions
  console.log('\n10. Cleanup');
  for (const txn of txns.slice(1)) {
    await request('DELETE', `${API}/transactions/${txn.id}`, { token });
  }
  const afterCleanup = await request('GET', `${API}/transactions`, { token });
  const remaining = ((afterCleanup.json as Record<string, unknown>).data as unknown[])?.length ?? -1;
  assert(remaining === 0, `All test transactions cleaned up (remaining: ${remaining})`);

  // ── Report ─────────────────────────────────────────────────────────────────

  console.log('\n────────────────────────────────');
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('────────────────────────────────\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Unexpected error running tests:', err);
  process.exit(1);
});
