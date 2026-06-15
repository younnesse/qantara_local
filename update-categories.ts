import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.QANTARADB_POSTGRES_PRISMA_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const photoMap: Record<string, string> = {
  "Karim Benali":          "/providers/dr-karim-benali.png",
  "Amina Saidi":           "/providers/dr-amina-hadjsaid.png",
  "Yacine Mansouri":       "/providers/dr-yacine-boumediene.png",
  "Dr. Nadia Mebarki":     "/providers/dr-nadia-mebarki.png",
  "Sofiane Haddad":        "/providers/sofiane-haddad.png",
  "Djamila Boualem":       "/providers/djamila-boualem.png",
  "Farid Najar":           "/providers/farid-najar.png",
  "Leila Kaddour":         "/providers/leila-kaddour.png",
  "Meriem Traiteur":       "/providers/meriem-bouzid.png",
  "Tarek Boulahia":        "/providers/tarek-boulahia.png",
}

async function main() {
  const providers = await prisma.provider.findMany()
  console.log(`Updating photos for ${providers.length} providers...`)

  for (const p of providers) {
    const photo = photoMap[p.name || ""]
    if (photo) {
      await prisma.provider.update({
        where: { id: p.id },
        data: { profileImage: photo }
      })
      console.log(`✅ ${p.name} → ${photo}`)
    } else {
      console.log(`⚠️  No photo mapped for: ${p.name}`)
    }
  }

  console.log("Done!")
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
