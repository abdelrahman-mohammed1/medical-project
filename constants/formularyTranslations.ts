export type FormularyTranslation = {
  brandAr?: string;
  genericAr?: string;
  doseAr?: string;
  clsAr?: string;
  formAr?: string;
};

const FORMULARY_TRANSLATIONS: Record<string, FormularyTranslation> = {
  // Hypertension - أدوية ضغط الدم
  Norvasc: {
    brandAr: "نورفاسك",
    genericAr: "أملوديبين",
    doseAr: "٥–١٠ مج يوميًا",
    clsAr: "حاصر قنوات الكالسيوم",
    formAr: "قرص",
  },
  Zestril: {
    brandAr: "زيسترِل",
    genericAr: "ليزينوبريل",
    doseAr: "١٠–٤٠ مج يوميًا",
    clsAr: "مثبط الإنزيم المحول للأنجيوتنسين",
    formAr: "قرص",
  },
  Vasotec: {
    brandAr: "فازوتيك",
    genericAr: "إنالابريل",
    doseAr: "٥–٢٠ مج يوميًا",
    clsAr: "مثبط الإنزيم المحول للأنجيوتنسين",
    formAr: "قرص",
  },
  Cozaar: {
    brandAr: "كوزار",
    genericAr: "لوسارتان",
    doseAr: "٥٠–١٠٠ مج يوميًا",
    clsAr: "حاصر مستقبلات الأنجيوتنسين",
    formAr: "قرص",
  },
  Micardis: {
    brandAr: "ميكارديس",
    genericAr: "تلميسارتان",
    doseAr: "٢٠–٨٠ مج يوميًا",
    clsAr: "حاصر مستقبلات الأنجيوتنسين",
    formAr: "قرص",
  },
  Tenormin: {
    brandAr: "تينورمين",
    genericAr: "أتينولول",
    doseAr: "٥٠–١٠٠ مج يوميًا",
    clsAr: "حاصر بيتا",
    formAr: "قرص",
  },
  Lopressor: {
    brandAr: "لوبريسور",
    genericAr: "ميتوبرولول",
    doseAr: "٢٥–١٠٠ مج يوميًا",
    clsAr: "حاصر بيتا",
    formAr: "قرص",
  },
  Altace: {
    brandAr: "ألتيس",
    genericAr: "راميبريل",
    doseAr: "٢.٥–١٠ مج يوميًا",
    clsAr: "مثبط الإنزيم المحول للأنجيوتنسين",
    formAr: "كبسولة",
  },
  Natrilix: {
    brandAr: "ناتريليكس",
    genericAr: "إندابامايد",
    doseAr: "١.٥–٢.٥ مج يوميًا",
    clsAr: "مدر بول",
    formAr: "قرص",
  },
  Hygroton: {
    brandAr: "هايجروتون",
    genericAr: "كلورثاليدون",
    doseAr: "١٢.٥–٢٥ مج يوميًا",
    clsAr: "مدر بول",
    formAr: "قرص",
  },

  // Diabetes - أدوية السكري
  Glucophage: {
    brandAr: "جلوكوفاج",
    genericAr: "ميتفورمين",
    doseAr: "٥٠٠–٢٠٠٠ مج/اليوم",
    clsAr: "بيجوانيد",
    formAr: "قرص",
  },
  Amaryl: {
    brandAr: "أماريل",
    genericAr: "جليمبيريد",
    doseAr: "١–٤ مج يوميًا",
    clsAr: "سلفونيل يوريا",
    formAr: "قرص",
  },
  Diamicron: {
    brandAr: "ديامكرون",
    genericAr: "جليكلازيد",
    doseAr: "٣٠–١٢٠ مج يوميًا",
    clsAr: "سلفونيل يوريا",
    formAr: "قرص",
  },
  Januvia: {
    brandAr: "جانوفيا",
    genericAr: "سيتاجليبتين",
    doseAr: "١٠٠ مج يوميًا",
    clsAr: "مثبط DPP-4",
    formAr: "قرص",
  },
  Jardiance: {
    brandAr: "جاردينس",
    genericAr: "إمباجليفلوزين",
    doseAr: "١٠–٢٥ مج يوميًا",
    clsAr: "مثبط SGLT2",
    formAr: "قرص",
  },
  Forxiga: {
    brandAr: "فوركسيجا",
    genericAr: "داباجليفلوزين",
    doseAr: "١٠ مج يوميًا",
    clsAr: "مثبط SGLT2",
    formAr: "قرص",
  },
  Lantus: {
    brandAr: "لانتوس",
    genericAr: "إنسولين جلارجين",
    doseAr: "حسب الحاجة",
    clsAr: "إنسولين طويل المفعول",
    formAr: "حقن",
  },
  Humalog: {
    brandAr: "هيومالوج",
    genericAr: "إنسولين ليسبرو",
    doseAr: "حسب الحاجة",
    clsAr: "إنسولين سريع المفعول",
    formAr: "حقن",
  },
  Actos: {
    brandAr: "أكتوس",
    genericAr: "بيوجليتازون",
    doseAr: "١٥–٤٥ مج يوميًا",
    clsAr: "ثيازوليدين ديون",
    formAr: "قرص",
  },
  Victoza: {
    brandAr: "فيكتوزا",
    genericAr: "ليراجلوتايد",
    doseAr: "٠.٦–١.٨ مج يوميًا",
    clsAr: "منبه مستقبلات GLP-1",
    formAr: "حقن",
  },

  // Cardiovascular - أدوية القلب والأوعية الدموية
  "Aspirin Protect": {
    brandAr: "أسبرين بروتكت",
    genericAr: "أسبرين",
    doseAr: "٧٥–١٠٠ مج يوميًا",
    clsAr: "مضاد صفائح دموية",
    formAr: "قرص",
  },
  Plavix: {
    brandAr: "بلافكس",
    genericAr: "كلوبيدوجريل",
    doseAr: "٧٥ مج يوميًا",
    clsAr: "مضاد صفائح دموية",
    formAr: "قرص",
  },
  Lipitor: {
    brandAr: "ليبيتور",
    genericAr: "أتورفاستاتين",
    doseAr: "١٠–٨٠ مج يوميًا",
    clsAr: "ستاتين",
    formAr: "قرص",
  },
  Crestor: {
    brandAr: "كريستور",
    genericAr: "روسوفاستاتين",
    doseAr: "٥–٤٠ مج يوميًا",
    clsAr: "ستاتين",
    formAr: "قرص",
  },
  Nitrostat: {
    brandAr: "نيتروستات",
    genericAr: "نيتروجليسرين",
    doseAr: "٠.٣–٠.٦ مج عند الحاجة",
    clsAr: "نترات",
    formAr: "تحت اللسان",
  },
  Imdur: {
    brandAr: "إمدور",
    genericAr: "إيزوسوربايد مونونيترات",
    doseAr: "٢٠–٦٠ مج يوميًا",
    clsAr: "نترات",
    formAr: "قرص",
  },
  Lanoxin: {
    brandAr: "لانوكسين",
    genericAr: "ديجوكسين",
    doseAr: "٠.١٢٥–٠.٢٥ مج يوميًا",
    clsAr: "جليكوسيد قلبي",
    formAr: "قرص",
  },
  Coreg: {
    brandAr: "كوريج",
    genericAr: "كارفيديلول",
    doseAr: "٣.١٢٥–٢٥ مج مرتين يوميًا",
    clsAr: "حاصر بيتا",
    formAr: "قرص",
  },
  Lasix: {
    brandAr: "لازيكس",
    genericAr: "فوروسيمايد",
    doseAr: "٢٠–٨٠ مج يوميًا",
    clsAr: "مدر بول عروي",
    formAr: "قرص/حقن",
  },
  Aldactone: {
    brandAr: "ألداكتون",
    genericAr: "سبيرونولاكتون",
    doseAr: "٢٥–٥٠ مج يوميًا",
    clsAr: "مدر بول حافظ للبوتاسيوم",
    formAr: "قرص",
  },

  // Alzheimer's - أدوية الزهايمر
  Aricept: {
    brandAr: "أريسبت",
    genericAr: "دونيبيزيل",
    doseAr: "٥–١٠ مج يوميًا",
    clsAr: "مثبط الكولين إستيراز",
    formAr: "قرص",
  },
  Exelon: {
    brandAr: "إكسيلون",
    genericAr: "ريفاستيجمين",
    doseAr: "٣–٦ مج مرتين يوميًا",
    clsAr: "مثبط الكولين إستيراز",
    formAr: "كبسولة/لصقة",
  },
  Razadyne: {
    brandAr: "رازادين",
    genericAr: "جالانتامين",
    doseAr: "٨–٢٤ مج يوميًا",
    clsAr: "مثبط الكولين إستيراز",
    formAr: "قرص",
  },
  Namenda: {
    brandAr: "ناميندا",
    genericAr: "ميمانتين",
    doseAr: "١٠–٢٠ مج يوميًا",
    clsAr: "مضاد مستقبلات NMDA",
    formAr: "قرص",
  },
  Namzaric: {
    brandAr: "نامزاريك",
    genericAr: "ميمانتين + دونيبيزيل",
    doseAr: "حسب الوصفة",
    clsAr: "دواء مركب",
    formAr: "كبسولة",
  },
  Aduhelm: {
    brandAr: "أدوهيلم",
    genericAr: "أدوكانوماب",
    doseAr: "حقن شهرية وريدية",
    clsAr: "جسم مضاد وحيد النسيلة",
    formAr: "حقن",
  },
  Leqembi: {
    brandAr: "ليكيمبي",
    genericAr: "ليكانيماب",
    doseAr: "تسريب وريدي",
    clsAr: "جسم مضاد وحيد النسيلة",
    formAr: "حقن",
  },
  Cognex: {
    brandAr: "كوجنيكس",
    genericAr: "تاكرين",
    doseAr: "١٠–٤٠ مج يوميًا",
    clsAr: "مثبط الكولين إستيراز",
    formAr: "كبسولة",
  },
  "Vitamin E": {
    brandAr: "فيتامين هـ",
    genericAr: "توكوفيرول",
    doseAr: "٤٠٠–٨٠٠ وحدة دولية",
    clsAr: "مضاد أكسدة",
    formAr: "كبسولة",
  },
  Eldepryl: {
    brandAr: "إلديبريل",
    genericAr: "سيليجيلين",
    doseAr: "٥–١٠ مج يوميًا",
    clsAr: "مثبط MAO",
    formAr: "قرص",
  },
};

export const getFormularyTranslation = (
  brandName?: string | null,
): FormularyTranslation | null => {
  if (!brandName) return null;
  return FORMULARY_TRANSLATIONS[brandName] ?? null;
};

export const getLocalizedMedication = (
  medication: any,
  language: "en" | "ar"
) => {
  if (language === "en") {
    return {
      brand: medication.brand,
      generic: medication.generic,
      cls: medication.cls,
      dose: medication.dose,
      form: medication.form,
      image: medication.image,
    };
  }

  const translation = getFormularyTranslation(medication.brand);
  return {
    brand: translation?.brandAr || medication.brand,
    generic: translation?.genericAr || medication.generic,
    cls: translation?.clsAr || medication.cls,
    dose: translation?.doseAr || medication.dose,
    form: translation?.formAr || medication.form,
    image: medication.image,
  };
};

