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
  console.log("Starting database seeding for Capsule Company...");

  // 1. Seed Company Settings
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {
      companyName: "Capsule Company",
      tagline: "YOUR SPACE MAKER",
      logoUrl: "/capsule-logo.png",
      address: "N.173, 1st & 2nd Flr, SLV Complex, Hebbal Kempapura, Amruthahalli, Outer Ring Road, Kariyanna Layout, Bengaluru (Urban), Karnataka – 560024",
      phone: "+91 96321 24422",
      email: "Workscapsule@gmail.com",
      website: ""
    },
    create: {
      id: "default",
      companyName: "Capsule Company",
      tagline: "YOUR SPACE MAKER",
      logoUrl: "/capsule-logo.png",
      address: "N.173, 1st & 2nd Flr, SLV Complex, Hebbal Kempapura, Amruthahalli, Outer Ring Road, Kariyanna Layout, Bengaluru (Urban), Karnataka – 560024",
      phone: "+91 96321 24422",
      email: "Workscapsule@gmail.com",
      website: "",
      gstin: "29ABCDE1234F1Z5",
      bankName: "HDFC Bank",
      accountName: "CAPSULE COMPANY",
      accountNumber: "50200034981276",
      ifscCode: "HDFC0001245",
      branch: "Indiranagar Branch, Bengaluru",
      upiId: "capsulecompany@hdfcbank",
      quotationPrefix: "CAP-QTN-",
      invoicePrefix: "CAP-INV-",
      defaultTerms: `1. 50% Advance on quotation approval to commence design and procurement.
2. 40% on material delivery and inspection at site.
3. 10% on completion and final handover.
4. Any additional work or scope change beyond this document will be charged extra.
5. All wood work warranty is 10 years against manufacturing defects; hardware warranty as per manufacturer.
6. Quotation valid for 30 days from the date of issue.`,
      authorizedSignatory: "For CAPSULE COMPANY (Authorized Signatory)"
    }
  });

  // 2. Seed Default User (Capsule Office Admin)
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
      phone: "+91 96321 24422"
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

  // 4. Seed Sample Customers
  const customer1 = await prisma.customer.upsert({
    where: { customerId: "CUST-001" },
    update: {},
    create: {
      customerId: "CUST-001",
      name: "Rajesh Sharma",
      phone: "+91 98860 12345",
      altPhone: "+91 80250 99887",
      email: "rajesh.sharma@example.com",
      address: "Flat 402, Prestige Palms, Whitefield",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      gstin: "29AABCS1429B1ZB",
      notes: "Preferred style: Modern Minimalist with Rose Gold hardware."
    }
  });

  const customer2 = await prisma.customer.upsert({
    where: { customerId: "CUST-002" },
    update: {},
    create: {
      customerId: "CUST-002",
      name: "Ananya Deshmukh",
      phone: "+91 97410 54321",
      email: "ananya.d@example.com",
      address: "Villa 12, Sobha Lifestyle Legacy, Devanahalli",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "562110",
      notes: "Full luxury 4BHK Villa interiors."
    }
  });

  // 5. Seed Projects for Customers (showing 1 customer can have multiple projects)
  const project1 = await prisma.project.upsert({
    where: { projectId: "PRJ-001" },
    update: {},
    create: {
      projectId: "PRJ-001",
      customerId: customer1.id,
      name: "Prestige Palms - 3BHK Renovation",
      location: "Whitefield, Bengaluru",
      projectType: "Residential Apartment",
      status: "IN_PROGRESS",
      startDate: new Date("2026-08-01"),
      expectedCompletionDate: new Date("2026-10-30"),
      notes: "Complete interior overhaul including modular kitchen, master wardrobe, and POP ceiling."
    }
  });

  const project2 = await prisma.project.upsert({
    where: { projectId: "PRJ-002" },
    update: {},
    create: {
      projectId: "PRJ-002",
      customerId: customer1.id,
      name: "Sharma Commercial Studio",
      location: "Indiranagar, Bengaluru",
      projectType: "Commercial Office",
      status: "NEW",
      startDate: new Date("2026-10-01"),
      expectedCompletionDate: new Date("2026-12-15"),
      notes: "Second project for same customer. Creative design studio layout."
    }
  });

  const project3 = await prisma.project.upsert({
    where: { projectId: "PRJ-003" },
    update: {},
    create: {
      projectId: "PRJ-003",
      customerId: customer2.id,
      name: "Sobha Villa Luxury Living",
      location: "Devanahalli, Bengaluru",
      projectType: "Luxury Villa",
      status: "IN_PROGRESS",
      startDate: new Date("2026-07-15"),
      expectedCompletionDate: new Date("2026-11-20"),
      notes: "High-end bespoke carpentry, terrace garden, and home bar."
    }
  });

  // 6. Seed Sample Quotation
  const sampleQuote = await prisma.quotation.upsert({
    where: { quotationNumber: "CAP-QTN-0001" },
    update: {},
    create: {
      quotationNumber: "CAP-QTN-0001",
      quotationDate: new Date("2026-08-05"),
      validUntil: new Date("2026-09-05"),
      customerId: customer1.id,
      projectId: project1.id,
      projectLocation: project1.location,
      customerPhone: customer1.phone,
      customerEmail: customer1.email,
      customerAddress: customer1.address,
      customerGstin: customer1.gstin,
      taxMode: "CGST_SGST",
      discountType: "FIXED",
      discountValue: 10000,
      gstRate: 18,
      subtotal: 410000,
      discountAmount: 10000,
      taxableAmount: 400000,
      cgstAmount: 36000,
      sgstAmount: 36000,
      igstAmount: 0,
      otherChargesAmount: 5000,
      grandTotal: 477000,
      roundedGrandTotal: 477000,
      status: "APPROVED",
      notes: "Acrylic anti-scratch shutter finish. Quartz countertop included in client scope.",
      termsAndConditions: `1. 50% advance payment required to mobilize procurement.\n2. Work execution schedule: 45 working days.\n3. Hardware used: Blum / Hettich soft-close with 10-yr warranty.`
    }
  });

  // Clear existing items if re-seeding
  await prisma.quotationItem.deleteMany({ where: { quotationId: sampleQuote.id } });
  await prisma.quotationItem.createMany({
    data: [
      {
        quotationId: sampleQuote.id,
        categoryName: "Modular Kitchen",
        type: "Acrylic Finish with Blum Tandembox",
        description: "BWR Grade marine ply carcass, soft-close Blum hinges, cutlery organizer, tandem drawers",
        quantity: 120,
        unit: "Sq.ft",
        rate: 1800,
        amount: 216000,
        sortOrder: 1
      },
      {
        quotationId: sampleQuote.id,
        categoryName: "Wardrobe",
        type: "Floor to Ceiling Sliding Shutter Wardrobe",
        description: "Lacquer glass with rose-gold aluminum profile, internal LED sensor lighting, locker drawer",
        quantity: 80,
        unit: "Sq.ft",
        rate: 1500,
        amount: 120000,
        sortOrder: 2
      },
      {
        quotationId: sampleQuote.id,
        categoryName: "Electricals",
        type: "Concealed Warm Lighting & Profile Strips",
        description: "Cove lighting points, automated sensor channels, Schneider modular switches wiring",
        quantity: 20,
        unit: "Nos",
        rate: 1500,
        amount: 30000,
        sortOrder: 3
      },
      {
        quotationId: sampleQuote.id,
        categoryName: "Paints",
        type: "Royal Luxury Matte Emulsion",
        description: "Asian Paints Royale Luxury Emulsion with 2 coats acrylic putty and primer finish",
        quantity: 1100,
        unit: "Sq.ft",
        rate: 40,
        amount: 44000,
        sortOrder: 4
      }
    ]
  });

  await prisma.additionalCharge.deleteMany({ where: { quotationId: sampleQuote.id } });
  await prisma.additionalCharge.create({
    data: {
      quotationId: sampleQuote.id,
      description: "Freight, Site Handling & Transportation",
      amount: 5000
    }
  });

  // 7. Seed Sample Converted Invoice
  const sampleInvoice = await prisma.invoice.upsert({
    where: { invoiceNumber: "CAP-INV-0001" },
    update: {},
    create: {
      invoiceNumber: "CAP-INV-0001",
      quotationId: sampleQuote.id,
      invoiceDate: new Date("2026-08-10"),
      dueDate: new Date("2026-08-25"),
      customerId: customer1.id,
      projectId: project1.id,
      projectLocation: project1.location,
      customerPhone: customer1.phone,
      customerEmail: customer1.email,
      customerAddress: customer1.address,
      customerGstin: customer1.gstin,
      taxMode: "CGST_SGST",
      discountType: "FIXED",
      discountValue: 10000,
      gstRate: 18,
      subtotal: 410000,
      discountAmount: 10000,
      taxableAmount: 400000,
      cgstAmount: 36000,
      sgstAmount: 36000,
      igstAmount: 0,
      otherChargesAmount: 5000,
      grandTotal: 477000,
      roundedGrandTotal: 477000,
      totalPaid: 250000,
      balanceDue: 227000,
      paymentStatus: "PARTIALLY_PAID",
      notes: "Invoice generated upon quotation approval for Phase 1 execution.",
      termsAndConditions: sampleQuote.termsAndConditions
    }
  });

  await prisma.invoiceItem.deleteMany({ where: { invoiceId: sampleInvoice.id } });
  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: sampleInvoice.id,
        categoryName: "Modular Kitchen",
        type: "Acrylic Finish with Blum Tandembox",
        description: "BWR Grade marine ply carcass, soft-close Blum hinges, cutlery organizer, tandem drawers",
        quantity: 120,
        unit: "Sq.ft",
        rate: 1800,
        amount: 216000,
        sortOrder: 1
      },
      {
        invoiceId: sampleInvoice.id,
        categoryName: "Wardrobe",
        type: "Floor to Ceiling Sliding Shutter Wardrobe",
        description: "Lacquer glass with rose-gold aluminum profile, internal LED sensor lighting, locker drawer",
        quantity: 80,
        unit: "Sq.ft",
        rate: 1500,
        amount: 120000,
        sortOrder: 2
      },
      {
        invoiceId: sampleInvoice.id,
        categoryName: "Electricals",
        type: "Concealed Warm Lighting & Profile Strips",
        description: "Cove lighting points, automated sensor channels, Schneider modular switches wiring",
        quantity: 20,
        unit: "Nos",
        rate: 1500,
        amount: 30000,
        sortOrder: 3
      },
      {
        invoiceId: sampleInvoice.id,
        categoryName: "Paints",
        type: "Royal Luxury Matte Emulsion",
        description: "Asian Paints Royale Luxury Emulsion with 2 coats acrylic putty and primer finish",
        quantity: 1100,
        unit: "Sq.ft",
        rate: 40,
        amount: 44000,
        sortOrder: 4
      }
    ]
  });

  await prisma.additionalCharge.deleteMany({ where: { invoiceId: sampleInvoice.id } });
  await prisma.additionalCharge.create({
    data: {
      invoiceId: sampleInvoice.id,
      description: "Freight, Site Handling & Transportation",
      amount: 5000
    }
  });

  // Seed sample payments (Advance + Phase 1)
  await prisma.payment.deleteMany({ where: { invoiceId: sampleInvoice.id } });
  await prisma.payment.createMany({
    data: [
      {
        paymentId: "PAY-0001",
        invoiceId: sampleInvoice.id,
        customerId: customer1.id,
        projectId: project1.id,
        paymentDate: new Date("2026-08-10"),
        amountPaid: 150000,
        paymentMethod: "BANK_TRANSFER",
        referenceNumber: "NEFT-HDFC-9938472",
        notes: "Initial advance on agreement signing",
        recordedBy: "Admin Director"
      },
      {
        paymentId: "PAY-0002",
        invoiceId: sampleInvoice.id,
        customerId: customer1.id,
        projectId: project1.id,
        paymentDate: new Date("2026-08-20"),
        amountPaid: 100000,
        paymentMethod: "UPI",
        referenceNumber: "UPI-4293810293",
        notes: "Phase 1 material procurement tranche",
        recordedBy: "Admin Director"
      }
    ]
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
