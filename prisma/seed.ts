import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const INITIAL_CATEGORIES = [
  "Modular Kitchen",
  "Wardrobe",
  "Beds",
  "TV Units",
  "Bar Counter – Residential",
  "Temple Space",
  "Temple Stand",
  "Crockery Unit",
  "POP",
  "Paints",
  "Carpenter",
  "Fabrication",
  "Plumbing",
  "Electricals",
  "Tiles / Granite / Marble",
  "Residential Landscape",
  "Terrace Design"
];

async function main() {
  console.log("Starting database seeding for Capsule Company on Supabase...");

  // 1. Seed Company Settings
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {
      companyName: "Capsule Company",
      tagline: "YOUR SPACE MAKER",
      logoUrl: "/capsule-logo.png",
      address: "N.17/3, 1st & 2nd Floor, SLV Complex, Hebbal Kempapura, Amanikere, Outer Ring Road, Bengaluru, Karnataka – 560024",
      phone: "9187924723, 9187924523, 9187924623",
      email: "workscapsule@gmail.com",
      website: "",
      gstin: "29ABCDE1234F1Z5",
      bankName: "IDFC FIRST",
      accountName: "Mr. Poornesh Bakila Babu",
      accountNumber: "10177698837",
      ifscCode: "IDFB0081101",
      swiftCode: "IDFBINBBMUM",
      branch: "BANGALORE-BASAVESHWARA NAGAR BRANCH",
      upiId: "poornesh43-3@oksbi",
      quotationPrefix: "CAP-QTN-",
      invoicePrefix: "CAP-INV-",
      receiptPrefix: "CAP-REC-",
      defaultTerms: `1. Payment due as per agreed schedule. Late payments may attract interest.\n2. Goods remain property of Capsule Company until fully settled.`,
      defaultQuotationTerms: `1. 50% Advance payment at the time of confirmation.
2. 20% After completion of all pipe installation.
3. 20% After fixing all plumbing fittings.
4. 10% Before final handover of the project.
5. Payments shall be made according to the above-mentioned stages of work. The final 10% payment must be cleared before project handover.
6. Quotation valid for 7 days from the date of issue.`,
      defaultInvoiceTerms: `1. Payment due as per agreed schedule. Late payments may attract interest.
2. Goods remain property of Capsule Company until fully settled.`,
      authorizedSignatory: "Kishmat Sah Thakuri"
    },
    create: {
      id: "default",
      companyName: "Capsule Company",
      tagline: "YOUR SPACE MAKER",
      logoUrl: "/capsule-logo.png",
      address: "N.17/3, 1st & 2nd Floor, SLV Complex, Hebbal Kempapura, Amanikere, Outer Ring Road, Bengaluru, Karnataka – 560024",
      phone: "9187924723, 9187924523, 9187924623",
      email: "workscapsule@gmail.com",
      website: "",
      gstin: "29ABCDE1234F1Z5",
      bankName: "IDFC FIRST",
      accountName: "Mr. Poornesh Bakila Babu",
      accountNumber: "10177698837",
      ifscCode: "IDFB0081101",
      swiftCode: "IDFBINBBMUM",
      branch: "BANGALORE-BASAVESHWARA NAGAR BRANCH",
      upiId: "poornesh43-3@oksbi",
      quotationPrefix: "CAP-QTN-",
      invoicePrefix: "CAP-INV-",
      receiptPrefix: "CAP-REC-",
      defaultTerms: `1. Payment due as per agreed schedule. Late payments may attract interest.\n2. Goods remain property of Capsule Company until fully settled.`,
      defaultQuotationTerms: `1. 50% Advance payment at the time of confirmation.
2. 20% After completion of all pipe installation.
3. 20% After fixing all plumbing fittings.
4. 10% Before final handover of the project.
5. Payments shall be made according to the above-mentioned stages of work. The final 10% payment must be cleared before project handover.
6. Quotation valid for 7 days from the date of issue.`,
      defaultInvoiceTerms: `1. Payment due as per agreed schedule. Late payments may attract interest.
2. Goods remain property of Capsule Company until fully settled.`,
      authorizedSignatory: "Kishmat Sah Thakuri"
    }
  });

  // 2. Seed Default Admin Users
  const officePassword = await bcrypt.hash("capsulework1519", 10);

  await prisma.user.upsert({
    where: { email: "capsuleoffice@gmail.com" },
    update: {
      passwordHash: officePassword,
      role: "ADMIN"
    },
    create: {
      name: "Capsule Office",
      email: "capsuleoffice@gmail.com",
      passwordHash: officePassword,
      role: "ADMIN",
      phone: "9187924723"
    }
  });

  await prisma.user.upsert({
    where: { email: "workscapsule@gmail.com" },
    update: {
      passwordHash: officePassword,
      role: "ADMIN"
    },
    create: {
      name: "Works Capsule Admin",
      email: "workscapsule@gmail.com",
      passwordHash: officePassword,
      role: "ADMIN",
      phone: "9187924723"
    }
  });

  // 3. Seed Initial Categories
  for (let i = 0; i < INITIAL_CATEGORIES.length; i++) {
    const catName = INITIAL_CATEGORIES[i];
    await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: {
        name: catName,
        description: `Custom interior design & execution for ${catName}`,
        sortOrder: i + 1,
        isActive: true
      }
    });
  }

  console.log("Supabase database successfully initialized with clean data (0 fake records)!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
