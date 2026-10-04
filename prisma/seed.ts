// Seeds the database with demo data: cities, categories, a starter set of
// stores + products, demo users (one per role, with properly hashed
// passwords), reminders and a group gift. Run with: npm run db:seed

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CITIES = [
  { id: "hyd", name: "Hyderabad" },
  { id: "blr", name: "Bengaluru" },
  { id: "mum", name: "Mumbai" },
  { id: "che", name: "Chennai" },
  { id: "del", name: "Delhi" },
];

const CATEGORIES = [
  { id: "flowers", name: "Flowers", icon: "🌸" },
  { id: "cakes", name: "Cakes", icon: "🎂" },
  { id: "hampers", name: "Hampers", icon: "🎁" },
  { id: "plants", name: "Plants", icon: "🌿" },
  { id: "personalized", name: "Personalized", icon: "✨" },
];

const STORES = [
  { id: "petals", name: "Petals & Co.", category: "Flowers", icon: "🌸", cityId: "hyd", open: true, owner: "Priya Nair" },
  { id: "bloomavenue", name: "Bloom Avenue", category: "Flowers", icon: "🌸", cityId: "hyd", open: true, owner: "Kavita Rao" },
  { id: "cakecraft", name: "CakeCraft", category: "Cakes", icon: "🎂", cityId: "hyd", open: true, owner: "Arjun Kumar" },
  { id: "giftstudio", name: "The Gift Studio", category: "Hampers", icon: "🎁", cityId: "hyd", open: true, owner: "Sana Sheikh" },
  { id: "bloom", name: "Bloom & Co.", category: "Plants", icon: "🌿", cityId: "hyd", open: true, owner: "Vikram Shetty" },
  { id: "customcreations", name: "Custom Creations", category: "Personalized", icon: "✨", cityId: "hyd", open: true, owner: "Farhan Ali" },
  { id: "cakecraft-blr", name: "CakeCraft", category: "Cakes", icon: "🎂", cityId: "blr", open: true, owner: "Divya Iyer" },
  { id: "petals-blr", name: "Petals Bengaluru", category: "Flowers", icon: "🌸", cityId: "blr", open: true, owner: "Shreya Hegde" },
].map((s) => ({ openTime: "09:00", closeTime: "21:00", ...s }));

const CATEGORY_TEMPLATES: Record<string, [string, number, string][]> = {
  Flowers: [
    ["Rose Bouquet", 1299, "A hand-tied bunch of fresh roses wrapped in premium paper."],
    ["Tulip Bunch", 1199, "Bright, cheerful tulips to brighten anyone's day."],
    ["Orchid Elegance", 1799, "An elegant potted orchid, perfect for a lasting gift."],
    ["Sunflower Basket", 999, "A sunny basket arrangement that never fails to bring a smile."],
    ["Carnation Mix", 899, "A colourful mix of carnations in a rustic wrap."],
  ],
  Cakes: [
    ["Chocolate Truffle Cake", 899, "Rich, moist chocolate sponge layered with Belgian ganache."],
    ["Red Velvet Cake", 1099, "Classic red velvet with cream cheese frosting."],
    ["Black Forest Cake", 949, "Chocolate sponge, whipped cream, and cherries."],
    ["Butterscotch Cake", 949, "Crunchy butterscotch praline on soft sponge."],
    ["Pineapple Cake", 799, "Light vanilla sponge with fresh pineapple and cream."],
  ],
  Hampers: [
    ["Gourmet Gift Hamper", 2499, "A curated hamper of chocolates, candles, and treats."],
    ["Chocolate Lover's Box", 1599, "An indulgent assortment of premium chocolates."],
    ["Dry Fruits Hamper", 1899, "A healthy hamper of premium dry fruits and nuts."],
    ["Spa & Relax Hamper", 2199, "Bath salts, candles and a soft robe for a relaxing day."],
    ["Tea & Treats Basket", 1499, "A fragrant tea selection paired with sweet treats."],
  ],
  Personalized: [
    ["Personalized Mug", 599, "A custom-printed mug with a name or message of your choice."],
    ["Custom Photo Frame", 799, "A keepsake frame personalized with a favourite photo."],
    ["Engraved Keychain", 399, "A metal keychain engraved with initials or a short message."],
    ["Monogram Cushion", 699, "A soft cushion embroidered with their initials."],
    ["Custom Name Necklace", 1299, "A delicate necklace with a name pendant."],
  ],
  Plants: [
    ["Money Plant", 699, "A low-maintenance indoor plant in a decorative pot."],
    ["Succulent Trio", 549, "Three charming succulents, perfect for any desk or windowsill."],
    ["Bonsai Plant", 1299, "A carefully shaped bonsai, a gift that grows for years."],
    ["Areca Palm", 999, "A lush areca palm that purifies indoor air."],
    ["Snake Plant", 749, "A hardy, stylish plant that thrives almost anywhere."],
  ],
};

const DEMO_PASSWORD = "Demo@1234";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("Seeding cities…");
  for (const c of CITIES) {
    await prisma.city.upsert({ where: { id: c.id }, update: c, create: c });
  }

  console.log("Seeding categories…");
  for (const c of CATEGORIES) {
    await prisma.category.upsert({ where: { id: c.id }, update: c, create: c });
  }

  console.log("Seeding stores…");
  for (const s of STORES) {
    await prisma.store.upsert({ where: { id: s.id }, update: s, create: s });
  }

  console.log("Seeding products…");
  for (const store of STORES) {
    const templates = CATEGORY_TEMPLATES[store.category] ?? CATEGORY_TEMPLATES.Hampers;
    for (let i = 0; i < templates.length; i++) {
      const [name, price, description] = templates[i];
      const id = `${store.id}-${i + 1}`;
      await prisma.product.upsert({
        where: { id },
        update: {},
        create: { id, storeId: store.id, name, price, icon: store.icon, featured: i < 2, isAvailable: true, description },
      });
    }
  }

  console.log("Seeding demo users (hashed passwords)…");
  const hashedDemoPassword = await hashPassword(DEMO_PASSWORD);
  // These exactly match the original prototype's DEMO_USERS object so the
  // app behaves identically to the design spec for anyone trying the demo
  // credentials shown there.
  const demoUsers = [
    { id: "demo-customer", name: "Ananya Rao", email: "ananya.rao@giftly.app", phone: "9876543210", password: hashedDemoPassword, role: "CUSTOMER" as const, storeId: null as string | null },
    { id: "demo-store-owner", name: "Priya Nair", email: "priya.nair@giftly.app", phone: "9123456780", password: hashedDemoPassword, role: "STORE_OWNER" as const, storeId: "petals" },
    { id: "demo-admin", name: "Giftly Admin", email: "admin@giftly.app", phone: "9988776655", password: hashedDemoPassword, role: "ADMIN" as const, storeId: null },
  ];
  for (const u of demoUsers) {
    await prisma.user.upsert({ where: { id: u.id }, update: u, create: u });
  }

  console.log("Seeding reminders…");
  const reminders = [
    { id: "r1", occasionName: "Mom's Birthday", recipientName: "Mom", occasionType: "Birthday", date: daysFromNow(3), repeatYearly: true, remindMe: "1 week before", giftCategory: "Flowers", note: "", giftPlanned: false },
    { id: "r2", occasionName: "Priya's Birthday", recipientName: "Priya", occasionType: "Birthday", date: daysFromNow(4), repeatYearly: true, remindMe: "3 days before", giftCategory: "Cakes", note: "Loves chocolate cake.", giftPlanned: true },
    { id: "r3", occasionName: "Rahul & Neha's Anniversary", recipientName: "Rahul & Neha", occasionType: "Anniversary", date: daysFromNow(12), repeatYearly: true, remindMe: "1 week before", giftCategory: "Hampers", note: "", giftPlanned: false },
  ];
  for (const r of reminders) {
    await prisma.reminder.upsert({ where: { id: r.id }, update: { ...r, userId: "demo-customer" }, create: { ...r, userId: "demo-customer" } });
  }

  console.log("Seeding a group gift…");
  const gg = await prisma.groupGift.upsert({
    where: { id: "gg1" },
    update: {},
    create: {
      id: "gg1",
      title: "Mom's Birthday",
      occasionType: "Birthday",
      recipientName: "Mom",
      deliveryCityId: "hyd",
      deliveryDate: daysFromNow(8),
      goalAmount: 4000,
      splitType: "equal",
      message: "Let's make her birthday extra special!",
      productIds: ["petals-1"],
    },
  });
  const contributors = [
    { name: "You (Rahul)", amount: 800, paid: true },
    { name: "Priya", amount: 800, paid: true },
    { name: "Aarav", amount: 800, paid: true },
    { name: "Neha", amount: 800, paid: true },
    { name: "Karan", amount: 800, paid: false },
  ];
  for (const c of contributors) {
    const existing = await prisma.groupGiftContributor.findFirst({ where: { groupGiftId: gg.id, name: c.name } });
    if (!existing) {
      await prisma.groupGiftContributor.create({ data: { ...c, groupGiftId: gg.id } });
    }
  }

  console.log("Seed complete. Demo accounts (all use password Demo@1234):");
  console.log("  ananya.rao@giftly.app / priya.nair@giftly.app / admin@giftly.app");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
