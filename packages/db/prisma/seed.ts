import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Pharmacy Admin Database Seed...");

  // 4. Seed Super Admin User (configured via environment variables)
  console.log("-> Seeding initial Super Admin user...");
  const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_SEED_EMAIL || "admin@pharmacy.com";
  const defaultPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_SEED_PASSWORD || "Admin@123456";
  const firstName = process.env.ADMIN_FIRST_NAME || "Super";
  const lastName = process.env.ADMIN_LAST_NAME || "Admin";
  const phone = process.env.ADMIN_PHONE || "";
  const avatar = process.env.ADMIN_AVATAR || null;

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  const superAdmin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
      isActive: true,
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(phone ? { phone } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
    },
    create: {
      email: adminEmail,
      passwordHash,
      firstName,
      lastName,
      phone,
      avatar,
      role: "ADMIN",
      isActive: true,
      isTwoFactorEnabled: false,
    },
  });
  console.log(`   Super Admin ready: ${superAdmin.email}`);

  // 5. Seed Standard Email Templates
  console.log("-> Seeding default email templates...");
  const storeName = process.env.STORE_NAME || process.env.NEXT_PUBLIC_APP_NAME || "Medical Care";
  const storeCompanyName = process.env.STORE_COMPANY_NAME || `${storeName} Healthcare`;
  const storeHelpline = process.env.STORE_HELPLINE || "";

  const emailTemplates = [
    {
      name: "Order Confirmation",
      slug: "ORDER_CONFIRMED",
      category: "ORDER",
      subject: `Order Confirmed: #{{orderNumber}} - ${storeName}`,
      variables: ["customerName", "orderNumber", "totalAmount", "estimatedDelivery", "itemsSummary"],
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e7e9; border-radius: 12px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #0B4A3A; margin: 0;">${storeName}</h2>
    <p style="color: #5B6B65; font-size: 14px;">Your order has been placed successfully</p>
  </div>
  <p>Dear <strong>{{customerName}}</strong>,</p>
  <p>Thank you for choosing ${storeName}. We have received your order <strong>#{{orderNumber}}</strong> totaling <strong>₹{{totalAmount}}</strong>.</p>
  <div style="background: #F1F3F4; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; color: #0F2A22;">Order Details</p>
    <p style="margin: 4px 0;"><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
    <p style="margin: 4px 0;">{{itemsSummary}}</p>
  </div>
  <p>Our licensed pharmacists are preparing your shipment with strict temperature-controlled standards.</p>
  <hr style="border: none; border-top: 1px solid #E4E7E9; margin: 24px 0;" />
  <p style="font-size: 12px; color: #5B6B65; text-align: center;">${storeCompanyName}${storeHelpline ? ` &bull; 24/7 Helpline: ${storeHelpline}` : ""}</p>
</div>`,
      textContent: `Dear {{customerName}}, thank you for your order #{{orderNumber}} totaling ₹{{totalAmount}}. Estimated delivery: {{estimatedDelivery}}. ${storeName}.`,
    },
    {
      name: "Order Dispatched",
      slug: "ORDER_DISPATCHED",
      category: "ORDER",
      subject: "Your Medicines are Out for Delivery! (Order #{{orderNumber}})",
      variables: ["customerName", "orderNumber", "courierPartner", "trackingNumber", "trackingUrl"],
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e7e9; border-radius: 12px;">
  <h2 style="color: #0B4A3A;">${storeName} Delivery Update</h2>
  <p>Hello <strong>{{customerName}}</strong>,</p>
  <p>Good news! Your order <strong>#{{orderNumber}}</strong> is dispatched via <strong>{{courierPartner}}</strong>.</p>
  <p>AWB Tracking Number: <strong>{{trackingNumber}}</strong></p>
  <div style="margin: 24px 0;">
    <a href="{{trackingUrl}}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track Your Shipment</a>
  </div>
</div>`,
      textContent: "Hello {{customerName}}, your order #{{orderNumber}} has been dispatched with {{courierPartner}}. Tracking Number: {{trackingNumber}}. Track here: {{trackingUrl}}",
    },
    {
      name: "Prescription Approved",
      slug: "PRESCRIPTION_APPROVED",
      category: "PRESCRIPTION",
      subject: "Prescription Verified & Approved for Order #{{orderNumber}}",
      variables: ["customerName", "orderNumber", "pharmacistName", "validityDate"],
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e7e9; border-radius: 12px;">
  <h2 style="color: #0B4A3A;">Prescription Verification Complete</h2>
  <p>Dear <strong>{{customerName}}</strong>,</p>
  <p>Your uploaded doctor's prescription has been verified and approved by our registered pharmacist <strong>{{pharmacistName}}</strong>.</p>
  <p>Your order <strong>#{{orderNumber}}</strong> is now confirmed and moving to the packaging station.</p>
  <p style="font-size: 13px; color: #5B6B65;">Prescription registered validity: {{validityDate}}</p>
</div>`,
      textContent: "Dear {{customerName}}, your prescription for order #{{orderNumber}} was approved by pharmacist {{pharmacistName}}. Your order is being packed.",
    },
    {
      name: "Prescription Rejected",
      slug: "PRESCRIPTION_REJECTED",
      category: "PRESCRIPTION",
      subject: "Action Required: Prescription Not Approved for Order #{{orderNumber}}",
      variables: ["customerName", "orderNumber", "rejectionReason", "reuploadUrl"],
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #DC2626; border-radius: 12px;">
  <h2 style="color: #DC2626;">Prescription Verification Notice</h2>
  <p>Dear <strong>{{customerName}}</strong>,</p>
  <p>We were unable to approve the prescription submitted for order <strong>#{{orderNumber}}</strong> due to the following reason:</p>
  <blockquote style="background: #FEF2F2; color: #991B1B; padding: 12px 16px; border-left: 4px solid #DC2626; margin: 16px 0;">
    {{rejectionReason}}
  </blockquote>
  <p>Please upload a clear, signed doctor's prescription so we can process your required Schedule H/H1 medicines promptly.</p>
  <div style="margin: 20px 0;">
    <a href="{{reuploadUrl}}" style="background: #0B4A3A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Re-upload Prescription</a>
  </div>
</div>`,
      textContent: "Dear {{customerName}}, your prescription for order #{{orderNumber}} could not be approved: {{rejectionReason}}. Please re-upload at: {{reuploadUrl}}",
    },
    {
      name: "Admin Password Reset",
      slug: "ADMIN_PASSWORD_RESET",
      category: "AUTH",
      subject: `Reset Your ${storeName} Admin Portal Password`,
      variables: ["name", "resetLink", "expiresInMinutes"],
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e7e9; border-radius: 12px;">
  <h2 style="color: #0B4A3A;">Password Reset Request</h2>
  <p>Hello <strong>{{name}}</strong>,</p>
  <p>A request was received to reset your administrator credentials for ${storeName} Admin.</p>
  <p>Click the link below to configure a new secure password. This link expires in {{expiresInMinutes}} minutes.</p>
  <div style="margin: 24px 0;">
    <a href="{{resetLink}}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
  </div>
  <p style="font-size: 12px; color: #5B6B65;">If you did not request this, please notify the Super Administrator immediately.</p>
</div>`,
      textContent: "Hello {{name}}, reset your admin password here: {{resetLink}}. Link expires in {{expiresInMinutes}} minutes.",
    },
    {
      name: "Staff Invitation",
      slug: "STAFF_INVITE",
      category: "AUTH",
      subject: `Invitation to Join ${storeName} Admin Portal as {{roleName}}`,
      variables: ["name", "roleName", "inviteLink", "temporaryPassword"],
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e7e9; border-radius: 12px;">
  <h2 style="color: #0B4A3A;">Welcome to ${storeName} Admin Team</h2>
  <p>Hello <strong>{{name}}</strong>,</p>
  <p>You have been assigned the role of <strong>{{roleName}}</strong> on the ${storeName} Administration Center.</p>
  <p>Temporary credentials:</p>
  <p>Temporary Password: <code style="background: #F1F3F4; padding: 4px 8px; border-radius: 4px;">{{temporaryPassword}}</code></p>
  <div style="margin: 24px 0;">
    <a href="{{inviteLink}}" style="background: #0B4A3A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login & Set Up 2FA</a>
  </div>
</div>`,
      textContent: `Hello {{name}}, you are invited to ${storeName} Admin as {{roleName}}. Temp password: {{temporaryPassword}}. Login: {{inviteLink}}`,
    },
  ];

  for (const t of emailTemplates) {
    await prisma.adminEmailTemplate.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        subject: t.subject,
        htmlContent: t.htmlContent,
        textContent: t.textContent,
        variables: t.variables,
        category: t.category,
      },
      create: {
        name: t.name,
        slug: t.slug,
        subject: t.subject,
        htmlContent: t.htmlContent,
        textContent: t.textContent,
        variables: t.variables,
        category: t.category,
      },
    });
  }
  // 6. Seed Medicine Inventory Categories
  console.log("-> Seeding authentic medicine categories...");
  const medicineCategories = [
    { name: "Antibiotics & Anti-Infectives", slug: "antibiotics-anti-infectives", description: "Oral and injectable antibiotics, antifungals, and antivirals." },
    { name: "Cardiovascular & Anti-Hypertensives", slug: "cardiovascular-hypertension", description: "Heart health, blood pressure, cholesterol, and blood thinners." },
    { name: "Diabetes Care & Insulin", slug: "diabetes-care-insulin", description: "Oral hypoglycemics, insulins, test strips, and glucometers." },
    { name: "Pain Relief, Analgesics & Antipyretics", slug: "pain-relief-analgesics", description: "NSAIDs, paracetamol, antipyretics, and muscle relaxants." },
    { name: "Respiratory, Asthma & Pulmonology", slug: "respiratory-asthma", description: "Inhalers, respules, bronchodilators, and cough syrups." },
    { name: "Gastrointestinal & Acid Reflux", slug: "gastrointestinal-gut", description: "Antacids, PPIs, laxatives, and digestive enzymes." },
    { name: "Dermatology & Skin Formulations", slug: "dermatology-skin", description: "Topical ointments, medicated creams, and antifungal lotions." },
    { name: "Vitamins, Minerals & Supplements", slug: "vitamins-minerals-supplements", description: "Multivitamins, zinc, iron, calcium, and nutritional health." },
    { name: "Pediatric & Infant Medicines", slug: "pediatric-infant-medicines", description: "Pediatric drops, suspensions, and child health formulations." },
    { name: "Ophthalmic & ENT Drops", slug: "ophthalmic-ent-drops", description: "Eye drops, ear drops, nasal sprays, and irrigation solutions." },
    { name: "Cold Chain & Biologics (2-8°C)", slug: "cold-chain-biologics", description: "Vaccines, insulins, serums, and temperature-sensitive biologics." },
    { name: "First Aid & Trauma Care", slug: "first-aid", description: "Bandages, antiseptics, surgical dressings, and emergency care." },
    { name: "Ayurvedic & Herbal Formulations", slug: "ayurvedic-herbal", description: "Classical Ayurvedic herbs, tonics, and natural health products." },
    { name: "Critical Care & Injectables", slug: "critical-care-injectables", description: "IV fluids, emergency ampoules, vials, and specialty injectables." },
    { name: "Neurology & Psychiatric Medicines", slug: "neurology-psychiatry", description: "Neuroprotective, anti-epileptic, and CNS medications." },
    { name: "Orthopedic & Joint Care", slug: "orthopedic-joint-care", description: "Calcium formulations, glucosamine, and pain-relief topical gels." },
    { name: "Surgicals & Medical Consumables", slug: "surgicals-consumables", description: "Syringes, IV sets, sterile gloves, and medical disposables." },
  ];

  for (let i = 0; i < medicineCategories.length; i++) {
    const c = medicineCategories[i];
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: c.name }, { slug: c.slug }] },
    });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { name: c.name, description: c.description, sortOrder: i + 1, isActive: true },
      });
    } else {
      await prisma.category.create({
        data: { name: c.name, slug: c.slug, description: c.description, sortOrder: i + 1, isActive: true },
      });
    }
  }
  // 7. Seed Staff Users
  console.log("-> Seeding standard administrative staff users...");
  const usersToSeed = [
    { email: "admin.ops@pharmacy.com", firstName: "Operations", lastName: "Admin", phone: "+919876543211" },
    { email: "pharmacist@pharmacy.com", firstName: "Rohan", lastName: "Sharma", phone: "+919876543212" },
    { email: "inventory@pharmacy.com", firstName: "Vikram", lastName: "Patel", phone: "+919876543213" },
    { email: "support@pharmacy.com", firstName: "Ananya", lastName: "Iyer", phone: "+919876543214" },
    { email: "marketing@pharmacy.com", firstName: "Pooja", lastName: "Mehta", phone: "+919876543215" },
  ];

  for (const u of usersToSeed) {
    await prisma.adminUser.upsert({
      where: { email: u.email },
      update: { role: "ADMIN", isActive: true, firstName: u.firstName, lastName: u.lastName, phone: u.phone },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        role: "ADMIN",
        isActive: true,
        isTwoFactorEnabled: false,
      },
    });
  }
  console.log(`   Seeded ${usersToSeed.length} standard staff users.`);

  // 8. Seed Suppliers
  console.log("-> Seeding authentic pharmaceutical suppliers...");
  const suppliersToSeed = [
    { name: "Apollo Pharmacy Supply Ltd", code: "SUP-APOLLO", contactPerson: "Rajesh Gupta", email: "rajesh@apollosupply.com", phone: "+919811002233", gstin: "27AAACA1234A1Z5", drugLicenceNo: "MH-WZ-102934", creditDays: 30 },
    { name: "Cipla Distribution Network", code: "SUP-CIPLA", contactPerson: "Suresh Nambiar", email: "orders@cipladist.com", phone: "+919822003344", gstin: "27AAACC5678B1Z2", drugLicenceNo: "MH-WZ-203948", creditDays: 45 },
    { name: "Sun Pharma Healthcare Logistics", code: "SUP-SUNPHARMA", contactPerson: "Deepak Verma", email: "logistics@sunpharma.com", phone: "+919833004455", gstin: "27AAACS9012C1Z9", drugLicenceNo: "MH-WZ-304958", creditDays: 30 },
    { name: "Lupin Bulk Logistics", code: "SUP-LUPIN", contactPerson: "Amit Deshmukh", email: "amit@lupinlogistics.com", phone: "+919844005566", gstin: "27AAACL3456D1Z6", drugLicenceNo: "MH-WZ-405968", creditDays: 60 },
    { name: "Mankind National Pharma Distributors", code: "SUP-MANKIND", contactPerson: "Vikas Kapoor", email: "orders@mankindpharma.com", phone: "+919855006677", gstin: "27AAACM7890E1Z3", drugLicenceNo: "MH-WZ-506978", creditDays: 30 },
  ];

  for (const s of suppliersToSeed) {
    await prisma.adminSupplier.upsert({
      where: { code: s.code },
      update: s,
      create: s,
    });
  }
  console.log(`   Seeded ${suppliersToSeed.length} pharmaceutical suppliers.`);

  // 9. Seed Inventory Testing Scenarios
  console.log("-> Seeding inventory batch testing scenarios...");
  const prods = await prisma.product.findMany({
    include: { variants: { include: { batches: true } } },
    take: 10,
  });
  const now = new Date();
  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

  if (prods.length >= 8) {
    // FEFO multi-batch + Rx
    const p0 = prods[0];
    await prisma.product.update({
      where: { id: p0.id },
      data: { prescriptionRequired: true, name: "Amoxicillin & Potassium Clavulanate 625mg (Augmentin)" },
    });
    const v0 = p0.variants[0];
    if (v0) {
      await prisma.inventoryBatch.deleteMany({ where: { variantId: v0.id } });
      await prisma.inventoryBatch.createMany({
        data: [
          { variantId: v0.id, batchNumber: "AUG-2026-B1", mfgDate: addDays(now, -60), expiryDate: addDays(now, 90), quantity: 20, costPrice: 150.00 },
          { variantId: v0.id, batchNumber: "AUG-2026-B2", mfgDate: addDays(now, -30), expiryDate: addDays(now, 180), quantity: 35, costPrice: 155.00 },
          { variantId: v0.id, batchNumber: "AUG-2026-B3", mfgDate: addDays(now, -10), expiryDate: addDays(now, 365), quantity: 50, costPrice: 160.00 },
        ],
      });
    }

    // Expiring in 10 days
    const v1 = prods[1]?.variants[0];
    if (v1) {
      await prisma.inventoryBatch.create({
        data: { variantId: v1.id, batchNumber: `EXP10-${Date.now().toString().slice(-4)}`, mfgDate: addDays(now, -180), expiryDate: addDays(now, 10), quantity: 25, costPrice: 85.00 },
      });
    }

    // Expiring in 45 days
    const v2 = prods[2]?.variants[0];
    if (v2) {
      await prisma.inventoryBatch.create({
        data: { variantId: v2.id, batchNumber: `EXP45-${Date.now().toString().slice(-4)}`, mfgDate: addDays(now, -180), expiryDate: addDays(now, 45), quantity: 40, costPrice: 95.00 },
      });
    }

    // Expiring in 80 days
    const v3 = prods[3]?.variants[0];
    if (v3) {
      await prisma.inventoryBatch.create({
        data: { variantId: v3.id, batchNumber: `EXP80-${Date.now().toString().slice(-4)}`, mfgDate: addDays(now, -180), expiryDate: addDays(now, 80), quantity: 30, costPrice: 110.00 },
      });
    }

    // Zero stock
    for (const v of prods[4]?.variants || []) {
      await prisma.inventoryBatch.updateMany({ where: { variantId: v.id }, data: { quantity: 0 } });
    }

    // Low stock
    const v5 = prods[5]?.variants[0];
    if (v5) {
      await prisma.inventoryBatch.deleteMany({ where: { variantId: v5.id } });
      await prisma.inventoryBatch.create({
        data: { variantId: v5.id, batchNumber: `LOWSTK-${Date.now().toString().slice(-4)}`, mfgDate: addDays(now, -90), expiryDate: addDays(now, 300), quantity: 3, costPrice: 45.00 },
      });
    }

    // 0 Batches
    for (const v of prods[6]?.variants || []) {
      await prisma.inventoryBatch.deleteMany({ where: { variantId: v.id } });
    }

    // Expired batch
    const v7 = prods[7]?.variants[0];
    if (v7) {
      await prisma.inventoryBatch.create({
        data: { variantId: v7.id, batchNumber: `EXPIRED-${Date.now().toString().slice(-4)}`, mfgDate: addDays(now, -400), expiryDate: addDays(now, -15), quantity: 50, costPrice: 60.00 },
      });
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
