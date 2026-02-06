# 1. Generate the Client (Updates node_modules)
pnpm prisma generate

# 2. Run Migration (Creates tables in DB)
pnpm prisma migrate dev --name init

# 3. Run Seed (Populates data)
pnpm prisma db seed

# 4. Verify (Opens GUI)
pnpm prisma studio