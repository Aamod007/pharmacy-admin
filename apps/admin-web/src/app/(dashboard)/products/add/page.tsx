"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "../../../../components/shell/Topbar";
import { Stepper } from "../../../../components/common/Stepper";
import { SectionCard } from "../../../../components/common/SectionCard";
import { TagMultiSelect } from "../../../../components/common/TagMultiSelect";
import { apiRequest } from "../../../../lib/api-client";
import { formatCurrency } from "../../../../lib/utils";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  UploadCloud,
  AlertCircle,
  Pill,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Info,
} from "lucide-react";

const STANDARD_PACK_SIZES = [
  "Strip of 10 Tablets",
  "Strip of 15 Tablets",
  "Strip of 6 Tablets",
  "Box of 10 Strips (100 Tablets)",
  "Bottle of 60ml Syrup",
  "Bottle of 100ml Syrup",
  "Bottle of 200ml Syrup",
  "Pack of 10 Capsules",
  "Pack of 30 Capsules",
  "Bottle of 60 Capsules",
  "Tube of 15g Gel/Ointment",
  "Tube of 30g Gel/Ointment",
  "Vial of 2ml Injection",
  "Ampoule of 1ml Injection",
  "Dropper Bottle 5ml Drops",
  "Dropper Bottle 10ml Drops",
  "Pack of 5 Respules (2ml each)",
  "Sachet of 5g Powder (Box of 10)",
  "Custom Pack Size",
];

const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Oral Syrup / Liquid Suspension",
  "Injectable (Vial / Ampoule)",
  "Topical Ointment / Gel / Cream",
  "Ophthalmic / Ear Drops",
  "Inhaler / Respule / Rotacap",
  "Oral Powder / Sachet",
  "Topical Lotion / Solution",
  "Suppository / Enema",
];

const STORAGE_CONDITIONS = [
  "Store below 25°C in a dry place. Protect from direct moisture & sunlight.",
  "Cold Chain: 2°C to 8°C (Do Not Freeze) - Refrigerator Storage.",
  "Protect from direct light and moisture.",
  "Store at room temperature (15°C to 30°C).",
  "Store below 30°C in a dry place. Keep out of reach of children.",
];

const PHARMA_TAGS = [
  "Antibiotics",
  "Pain Relief",
  "Cardiac Care",
  "Diabetic Care",
  "Respiratory",
  "Gastrointestinal",
  "Dermatology",
  "Vitamins & Minerals",
  "Pediatric Safe",
  "Cold Chain (2-8°C)",
  "First Aid",
  "Schedule H Rx",
  "Schedule H1",
  "OTC Medicine",
  "Ayurvedic",
];

export default function AddProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories & Brands list
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Step 1: Medicine Identification
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [composition, setComposition] = useState("");
  const [dosageForm, setDosageForm] = useState("Tablet");
  const [strength, setStrength] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Clinical Details & Regulatory
  const [uses, setUses] = useState("");
  const [dosage, setDosage] = useState("");
  const [storageInstructions, setStorageInstructions] = useState(STORAGE_CONDITIONS[0]);
  const [scheduleType, setScheduleType] = useState("Schedule H");
  const [prescriptionRequired, setPrescriptionRequired] = useState(true);

  // Step 3: Packaging & Pricing
  const [packSizeOption, setPackSizeOption] = useState(STANDARD_PACK_SIZES[0]);
  const [customPackSize, setCustomPackSize] = useState("");
  const [weightGrams, setWeightGrams] = useState("100");
  const [mrp, setMrp] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [gstRate, setGstRate] = useState("12");
  const [hsnCode, setHsnCode] = useState("300490");

  // Step 4: Inventory, Rack & Initial FEFO Batch
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [rackLocation, setRackLocation] = useState("Rack A-01");
  const [shelfLocation, setShelfLocation] = useState("Shelf 2");
  const [minStockLevel, setMinStockLevel] = useState("15");
  const [maxStockLevel, setMaxStockLevel] = useState("150");
  const [batchNumber, setBatchNumber] = useState("");
  const [mfgDate, setMfgDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [initialQuantity, setInitialQuantity] = useState("50");

  // Media & Tags
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
  ]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Invalid File Type", { description: `${file.name} is not an image file.` });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setImages((prev) => {
            const updated = [...prev, result];
            setSelectedImageIdx(updated.length - 1);
            return updated;
          });
          toast.success("Image Imported", { description: `${file.name} imported from your files.` });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Invalid File Type", { description: `${file.name} is not an image.` });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setImages((prev) => {
            const updated = [...prev, result];
            setSelectedImageIdx(updated.length - 1);
            return updated;
          });
          toast.success("Image Imported", { description: `${file.name} imported.` });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (idxToRemove: number) => {
    if (images.length <= 1) {
      toast.info("At least one image is required.");
      return;
    }
    setImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== idxToRemove);
      if (selectedImageIdx >= updated.length) {
        setSelectedImageIdx(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const [selectedTags, setSelectedTags] = useState<string[]>(["Antibiotics", "Schedule H Rx"]);

  const packSize = packSizeOption === "Custom Pack Size" ? customPackSize : packSizeOption;

  // Auto-generate SKU when name, form, or packSize changes
  useEffect(() => {
    if (name && !sku) {
      const prefix = name
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 4)
        .toUpperCase();
      const formCode = dosageForm.slice(0, 3).toUpperCase();
      const rnd = Math.floor(100 + Math.random() * 900);
      setSku(`${prefix}-${formCode}-${rnd}`);
    }
  }, [name, dosageForm]);

  // Auto-generate batch number if empty
  useEffect(() => {
    if (!batchNumber) {
      const year = new Date().getFullYear();
      const num = Math.floor(1000 + Math.random() * 9000);
      setBatchNumber(`BT-${year}-${num}`);
    }
  }, []);

  // Set default mfg & expiry dates
  useEffect(() => {
    const today = new Date();
    const twoYearsLater = new Date();
    twoYearsLater.setFullYear(today.getFullYear() + 2);

    if (!mfgDate) setMfgDate(today.toISOString().split("T")[0]);
    if (!expiryDate) setExpiryDate(twoYearsLater.toISOString().split("T")[0]);
  }, []);

  // Auto-update prescription required based on schedule
  useEffect(() => {
    if (scheduleType === "Schedule H" || scheduleType === "Schedule H1" || scheduleType === "Schedule X") {
      setPrescriptionRequired(true);
    } else if (scheduleType === "OTC") {
      setPrescriptionRequired(false);
    }
  }, [scheduleType]);

  // Auto-calculate discount percentage when MRP & basePrice change
  useEffect(() => {
    const mrpNum = parseFloat(mrp);
    const priceNum = parseFloat(basePrice);
    if (mrpNum > 0 && priceNum > 0 && mrpNum >= priceNum) {
      const calculatedDiscount = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
      setDiscountPercent(calculatedDiscount.toString());
    }
  }, [mrp, basePrice]);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [cRes, bRes] = await Promise.all([
          apiRequest("/categories"),
          apiRequest("/brands"),
        ]);
        setCategories(cRes.data || []);
        setBrands(bRes.data || []);
        if (cRes.data?.[0]) setCategoryId(cRes.data[0].id);
        if (bRes.data?.[0]) setBrandId(bRes.data[0].id);
      } catch (err) {
        console.error(err);
      }
    }
    fetchMetadata();
  }, []);

  const steps = [
    { id: 1, name: "Medicine Overview" },
    { id: 2, name: "Clinical & Storage" },
    { id: 3, name: "Packaging & Pricing" },
    { id: 4, name: "Inventory & Batches" },
    { id: 5, name: "Review & Publish" },
  ];

  const handleSave = async (status: "PUBLISHED" | "DRAFT") => {
    if (!name.trim()) {
      toast.error("Please enter a medicine name");
      setCurrentStep(1);
      return;
    }
    if (!composition.trim()) {
      toast.error("Please enter active salt / chemical composition");
      setCurrentStep(1);
      return;
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      toast.error("Please enter a valid retail selling price");
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const effectiveSku = sku || `${name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const effectivePackSize = packSize || "Strip of 10 Tablets";

      const payload = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: description.trim() || `${name} formulated as ${dosageForm} (${effectivePackSize}).`,
        composition: composition.trim(),
        uses: uses.trim() || "As indicated by consulting physician.",
        dosage: dosage.trim() || "As directed by physician.",
        storageInstructions,
        manufacturer: manufacturer.trim() || "Standard Pharmaceutical Laboratories",
        countryOfOrigin: "India",
        prescriptionRequired,
        scheduleType,
        brandId: brandId || brands[0]?.id,
        categoryId: categoryId || categories[0]?.id,
        images: images.filter((img) => img && img.trim().length > 0),
        tags: selectedTags,
        gstRate: Number(gstRate),
        hsnCode: hsnCode || "300490",
        variants: [
          {
            name: `${name} (${effectivePackSize})`,
            packSize: effectivePackSize,
            sku: effectiveSku,
            mrp: Number(mrp) || Number(basePrice),
            price: Number(basePrice),
            discountPercent: Number(discountPercent) || 0,
            gstRate: Number(gstRate),
            hsnCode: hsnCode || "300490",
            weightGrams: Number(weightGrams) || 100,
            isDefault: true,
          },
        ],
        initialBatches: {
          [effectiveSku]: [
            {
              batchNumber: batchNumber || `BCH-${Date.now().toString().slice(-5)}`,
              mfgDate: mfgDate ? new Date(`${mfgDate}T00:00:00.000Z`).toISOString() : new Date().toISOString(),
              expiryDate: expiryDate
                ? new Date(`${expiryDate}T00:00:00.000Z`).toISOString()
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              quantity: Number(initialQuantity) || 0,
              costPrice: Number(costPrice) || Number(basePrice) * 0.7,
            },
          ],
        },
        status,
      };

      await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(status === "PUBLISHED" ? "Medicine Added to Inventory & Store!" : "Medicine Draft Saved", {
        description: "FEFO batch ledger and retail catalog updated successfully.",
      });
      router.push("/products");
    } catch (err: any) {
      toast.error("Failed to save medicine", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 pb-16">
      {/* Topbar */}
      <Topbar
        breadcrumb="Inventory & Catalog"
        title="Add Medicine"
        secondaryAction={{ label: "Save as Draft", onClick: () => handleSave("DRAFT"), disabled: isSubmitting }}
        primaryAction={{
          label: isSubmitting ? "Saving..." : "Add Medicine +",
          onClick: () => handleSave("PUBLISHED"),
          disabled: isSubmitting,
        }}
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Stepper Wizard */}
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={(id) => setCurrentStep(id)}
        />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Active Step Content */}
          <div className="col-span-8 space-y-6">
            {/* STEP 1: Medicine Overview */}
            {currentStep === 1 && (
              <SectionCard title="Medicine Identification & Clinical Classification">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                      Medicine Trade Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                      }}
                      className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[hsl(var(--primary))]"
                      placeholder="e.g. Augmentin 625 Duo Tablet, Pan-D Capsule, Azithral 500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Active Salt / Chemical Composition <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={composition}
                        onChange={(e) => setComposition(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[hsl(var(--primary))]"
                        placeholder="e.g. Amoxicillin (500mg) + Clavulanic Acid (125mg)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Strength / Potency
                      </label>
                      <input
                        type="text"
                        value={strength}
                        onChange={(e) => setStrength(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[hsl(var(--primary))]"
                        placeholder="e.g. 625 mg, 500 mg, 10 mg/5ml, 1000 IU"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Pharmaceutical Dosage Form
                      </label>
                      <select
                        value={dosageForm}
                        onChange={(e) => setDosageForm(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] focus:outline-none"
                      >
                        {DOSAGE_FORMS.map((form) => (
                          <option key={form} value={form}>
                            {form}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Manufacturer / Pharma Company
                      </label>
                      <input
                        type="text"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[hsl(var(--primary))]"
                        placeholder="e.g. GlaxoSmithKline Pharmaceuticals, Cipla Ltd, Alkem"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">Brand Entity</label>
                      <select
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] focus:outline-none"
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">URL Slug</label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-mono text-[#5B6B65] focus:outline-none"
                        placeholder="auto-generated-slug"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-[#5B6B65]">Product & Medical Overview</label>
                      <span className="text-xs text-[#5B6B65]">{description.length} / 1000</span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3.5 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none leading-relaxed"
                      placeholder="Provide comprehensive details on indication, therapeutic action, and patient counseling notes..."
                    />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* STEP 2: Clinical Details & Regulatory */}
            {currentStep === 2 && (
              <SectionCard title="Clinical Details, Regulatory Schedule & Storage Condition">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                      Therapeutic Uses & Medical Indications
                    </label>
                    <input
                      type="text"
                      value={uses}
                      onChange={(e) => setUses(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[hsl(var(--primary))]"
                      placeholder="e.g. Bacterial infections of lungs, ears, sinuses, urinary tract, and soft tissue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                      Dosage & Administration Instructions
                    </label>
                    <input
                      type="text"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[hsl(var(--primary))]"
                      placeholder="e.g. 1 tablet twice daily after meals for 5 days or as prescribed by physician"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                      Storage & Temperature Requirement
                    </label>
                    <select
                      value={storageInstructions}
                      onChange={(e) => setStorageInstructions(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] focus:outline-none mb-2"
                    >
                      {STORAGE_CONDITIONS.map((cond) => (
                        <option key={cond} value={cond}>
                          {cond}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E4E7E9]">
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Drug Regulatory Schedule
                      </label>
                      <select
                        value={scheduleType}
                        onChange={(e) => setScheduleType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] focus:outline-none"
                      >
                        <option value="Schedule H">Schedule H (Prescription Required)</option>
                        <option value="Schedule H1">Schedule H1 (Controlled Antibiotic / Habit-Forming)</option>
                        <option value="OTC">OTC (Over The Counter - General Sale)</option>
                        <option value="Schedule X">Schedule X (Strict Narcotic / Psychotropic)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="rxToggle"
                        checked={prescriptionRequired}
                        onChange={(e) => setPrescriptionRequired(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0B4A3A] focus:ring-[#0B4A3A]"
                      />
                      <label htmlFor="rxToggle" className="text-xs font-bold text-[#0F2A22] cursor-pointer">
                        Prescription Required (Doctor Rx Mandatory)
                      </label>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* STEP 3: Packaging & Pricing */}
            {currentStep === 3 && (
              <SectionCard title="Packaging Specifications & Commercial Pricing">
                <div className="space-y-4">
                  {/* Pack size selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Dispensing Packaging & Pack Size <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={packSizeOption}
                        onChange={(e) => setPackSizeOption(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] focus:outline-none"
                      >
                        {STANDARD_PACK_SIZES.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                    {packSizeOption === "Custom Pack Size" ? (
                      <div>
                        <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                          Enter Custom Pack Description
                        </label>
                        <input
                          type="text"
                          value={customPackSize}
                          onChange={(e) => setCustomPackSize(e.target.value)}
                          placeholder="e.g. Box of 5 Ampoules (5ml)"
                          className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                          Gross Shipping Weight (Grams)
                        </label>
                        <input
                          type="number"
                          value={weightGrams}
                          onChange={(e) => setWeightGrams(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Pricing Fields */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Printed MRP (Maximum Retail Price)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-[#5B6B65]">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={mrp}
                          onChange={(e) => setMrp(e.target.value)}
                          placeholder="200.00"
                          className="w-full pl-7 pr-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Purchase Cost (PTR - Price to Retailer)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-[#5B6B65]">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={costPrice}
                          onChange={(e) => setCostPrice(e.target.value)}
                          placeholder="140.00"
                          className="w-full pl-7 pr-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Retail Selling Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-[#5B6B65]">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={basePrice}
                          onChange={(e) => setBasePrice(e.target.value)}
                          placeholder="175.00"
                          className="w-full pl-7 pr-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">Discount (%)</label>
                      <input
                        type="number"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">GST Rate Slab</label>
                      <select
                        value={gstRate}
                        onChange={(e) => setGstRate(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold focus:outline-none"
                      >
                        <option value="0">0% (Exempt Essential Goods)</option>
                        <option value="5">5% (Life-Saving Medicines & Vaccines)</option>
                        <option value="12">12% (Standard Formulated Medicines)</option>
                        <option value="18">18% (Devices & Disinfectants)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">HSN Code</label>
                      <input
                        type="text"
                        value={hsnCode}
                        onChange={(e) => setHsnCode(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* STEP 4: Inventory, Rack & Initial FEFO Batch */}
            {currentStep === 4 && (
              <SectionCard title="Pharmacy Inventory, Physical Rack Location & Initial FEFO Batch">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Inventory SKU Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Barcode / EAN (Scan Ready)
                      </label>
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="e.g. 8901030739182"
                        className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Pharmacy Rack / Cabinet Location
                      </label>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#5B6B65]" />
                        <input
                          type="text"
                          value={rackLocation}
                          onChange={(e) => setRackLocation(e.target.value)}
                          placeholder="e.g. Rack A-02, Fridge #1"
                          className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Shelf / Drawer / Bin
                      </label>
                      <input
                        type="text"
                        value={shelfLocation}
                        onChange={(e) => setShelfLocation(e.target.value)}
                        placeholder="e.g. Shelf 3, Drawer B"
                        className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Min. Stock Alert Threshold (Packs)
                      </label>
                      <input
                        type="number"
                        value={minStockLevel}
                        onChange={(e) => setMinStockLevel(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                        Max. Storage Capacity (Packs)
                      </label>
                      <input
                        type="number"
                        value={maxStockLevel}
                        onChange={(e) => setMaxStockLevel(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Initial FEFO Batch Card */}
                  <div className="p-4 bg-[#F8F9FA] border border-[#E4E7E9] rounded-xl space-y-3 mt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#0B4A3A]" />
                        <span className="text-xs font-bold text-[#0F2A22]">
                          Initial Batch Intake (FEFO Enabled)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A]">
                        First Expiry, First Out
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <span className="text-[11px] text-[#5B6B65] font-semibold">Batch Number</span>
                        <input
                          type="text"
                          value={batchNumber}
                          onChange={(e) => setBatchNumber(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white rounded-lg text-xs font-mono font-bold mt-1 border border-[#E4E7E9]"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-[#5B6B65] font-semibold">Mfg Date</span>
                        <input
                          type="date"
                          value={mfgDate}
                          onChange={(e) => setMfgDate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white rounded-lg text-xs mt-1 border border-[#E4E7E9]"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-[#5B6B65] font-semibold">Expiry Date</span>
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white rounded-lg text-xs font-bold mt-1 border border-[#E4E7E9]"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-[#5B6B65] font-semibold">Initial Quantity</span>
                        <input
                          type="number"
                          value={initialQuantity}
                          onChange={(e) => setInitialQuantity(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white rounded-lg text-xs font-bold mt-1 border border-[#E4E7E9]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* STEP 5: Review & Publish */}
            {currentStep === 5 && (
              <SectionCard title="Review Medicine Catalog & Inventory Verification">
                <div className="space-y-4">
                  <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E4E7E9] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-[#0F2A22]">{name || "Untitled Medicine"}</h3>
                        <p className="text-xs text-[#5B6B65] mt-0.5">{composition || "Composition pending"}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF3EA] text-[#0B4A3A]">
                        {scheduleType}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[#E4E7E9] text-xs">
                      <div>
                        <span className="text-[#5B6B65] block">Packaging & Form</span>
                        <span className="font-bold text-[#0F2A22]">
                          {dosageForm} &bull; {packSize}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#5B6B65] block">Storage Location</span>
                        <span className="font-bold text-[#0F2A22]">
                          {rackLocation} ({shelfLocation})
                        </span>
                      </div>
                      <div>
                        <span className="text-[#5B6B65] block">Commercials</span>
                        <span className="font-bold text-[#0F2A22]">
                          MRP: ₹{mrp || "0"} | Sale: ₹{basePrice || "0"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2 text-xs">
                      <div>
                        <span className="text-[#5B6B65] block">Initial Batch</span>
                        <span className="font-mono font-bold text-[#0F2A22]">
                          {batchNumber} ({initialQuantity} units)
                        </span>
                      </div>
                      <div>
                        <span className="text-[#5B6B65] block">Batch Expiry</span>
                        <span className="font-bold text-[#16A34A]">{expiryDate || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[#5B6B65] block">Prescription Req.</span>
                        <span className="font-bold text-[#0F2A22]">
                          {prescriptionRequired ? "Yes (Rx Required)" : "No (OTC)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSave("DRAFT")}
                      className="flex-1 py-3 bg-[#F1F3F4] text-[#0F2A22] rounded-xl text-xs font-bold hover:bg-[#E4E7E9] transition"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSave("PUBLISHED")}
                      className="flex-1 py-3 bg-[#0B4A3A] text-white rounded-xl text-xs font-bold hover:bg-[#07362a] transition shadow-sm"
                    >
                      {isSubmitting ? "Publishing..." : "Confirm & Publish Medicine +"}
                    </button>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="px-5 py-2.5 bg-white border border-[#E4E7E9] text-[#0F2A22] rounded-xl text-xs font-bold hover:bg-[#F1F3F4] transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  className="px-6 py-2.5 bg-[#0B4A3A] text-white rounded-xl text-xs font-bold hover:bg-[#07362a] transition flex items-center gap-2 shadow-sm"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Medicine Media & Taxonomy Card (4 cols) */}
          <div className="col-span-4 sticky top-24 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#E4E7E9] shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0F2A22]">Medicine Media</h3>
                <span className="text-xs text-[#5B6B65]">Primary</span>
              </div>

              {/* Hidden File Explorer Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Large Image Preview with Click-to-Upload & Drag-and-Drop */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                title="Click to open File Explorer or drag and drop images"
                className={`w-full aspect-square rounded-2xl border-2 flex items-center justify-center p-4 overflow-hidden relative group cursor-pointer transition ${
                  isDragging
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] scale-[1.01]"
                    : "border-[#E4E7E9] bg-[#F5F6F7] hover:border-[hsl(var(--primary))]"
                }`}
              >
                <img
                  src={images[selectedImageIdx] || images[0]}
                  alt="Medicine Preview"
                  className="max-h-full max-w-full object-contain transition duration-200 group-hover:opacity-85"
                />

                {/* Hover Overlay indicating File Explorer Upload */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
                    <UploadCloud className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold">Choose from File Explorer</span>
                  <span className="text-[10px] text-white/80">Click or drag & drop</span>
                </div>

                {/* Delete Current Image Button (if more than 1 image) */}
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(selectedImageIdx);
                    }}
                    title="Remove this image"
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 text-[#DC2626] hover:bg-white shadow-xs opacity-0 group-hover:opacity-100 transition z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Thumbnail Strip with File Explorer Add Button */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group/thumb flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedImageIdx(idx)}
                        className={`w-14 h-14 rounded-xl border-2 overflow-hidden p-1 transition ${
                          selectedImageIdx === idx ? "border-[hsl(var(--primary))]" : "border-[#E4E7E9]"
                        }`}
                      >
                        <img src={img} alt="Thumb" className="w-full h-full object-cover rounded-lg" />
                      </button>
                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          title="Remove image"
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#DC2626] text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition shadow-xs text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add Image Button -> Opens Native File Explorer */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Import Image from File Explorer"
                    className="w-14 h-14 rounded-xl border-2 border-dashed border-[#E4E7E9] flex flex-col items-center justify-center text-[#5B6B65] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.03)] transition flex-shrink-0 cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[8px] font-bold mt-0.5">ADD</span>
                  </button>
                </div>

                {/* Primary Button to Trigger File Explorer */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-[#F4F6F5] hover:bg-[#E9ECEB] text-[#0B4A3A] border border-[#D7DEDB] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-[#0B4A3A]" />
                  <span>Import Images from Computer</span>
                </button>
              </div>

              {/* Medicine Category Selector */}
              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                  Medicine Inventory Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Packaging & Unit Form Preview Badge */}
              <div className="p-3 bg-[#FAF3EA] rounded-xl border border-[#F3E5D4] space-y-1">
                <p className="text-[11px] font-bold text-[#0B4A3A] uppercase tracking-wider">
                  Dispensing Unit Summary
                </p>
                <p className="text-xs font-extrabold text-[#0F2A22]">
                  {dosageForm} &bull; {packSize}
                </p>
                <p className="text-[11px] text-[#5B6B65]">
                  Location: {rackLocation}, {shelfLocation}
                </p>
              </div>

              {/* Pharmaceutical Classification Tags */}
              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                  Pharmaceutical Tags
                </label>
                <TagMultiSelect
                  tags={PHARMA_TAGS}
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
