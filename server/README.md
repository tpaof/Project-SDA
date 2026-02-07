# 1. Generate the Client (Updates node_modules)
pnpm prisma generate

# 2. Run Migration (Creates tables in DB)
pnpm prisma migrate dev --name init

# 3. Run Seed (Populates data)
pnpm prisma db seed

# 4. Verify (Opens GUI)
pnpm prisma studio

# to test transaction crud and api, you must run the server first
pnpm dev

# then run
pnpm tsx scripts/test-transactions.ts
pnpm tsx scripts/test-slips.ts
pnpm tsx scripts/test-db-connection.ts
# or
pnpm test:db-connect
pnpm test:slips
pnpm test:transactions

# if it not work, try
pnpm prisma migration reset
pnpm prisma migration dev
# or
pnpm db:migrate

# and run the script again (all cases should be [PASS])