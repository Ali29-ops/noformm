export const governorates = [
  { id: "cairo", en: "Cairo", ar: "القاهرة" },
  { id: "giza", en: "Giza", ar: "الجيزة" },
  { id: "alexandria", en: "Alexandria", ar: "الإسكندرية" },
  { id: "qalyubia", en: "Qalyubia", ar: "القليوبية" },
  { id: "sharqia", en: "Sharqia", ar: "الشرقية" },
  { id: "dakahlia", en: "Dakahlia", ar: "الدقهلية" },
  { id: "beheira", en: "Beheira", ar: "البحيرة" },
  { id: "gharbia", en: "Gharbia", ar: "الغربية" },
  { id: "monufia", en: "Monufia", ar: "المنوفية" },
  { id: "kafr-el-sheikh", en: "Kafr El Sheikh", ar: "كفر الشيخ" },
  { id: "damietta", en: "Damietta", ar: "دمياط" },
  { id: "port-said", en: "Port Said", ar: "بورسعيد" },
  { id: "ismailia", en: "Ismailia", ar: "الإسماعيلية" },
  { id: "suez", en: "Suez", ar: "السويس" },
  { id: "north-sinai", en: "North Sinai", ar: "شمال سيناء" },
  { id: "south-sinai", en: "South Sinai", ar: "جنوب سيناء" },
  { id: "matrouh", en: "Matrouh", ar: "مطروح" },
  { id: "faiyum", en: "Faiyum", ar: "الفيوم" },
  { id: "beni-suef", en: "Beni Suef", ar: "بني سويف" },
  { id: "minya", en: "Minya", ar: "المنيا" },
  { id: "asyut", en: "Asyut", ar: "أسيوط" },
  { id: "sohag", en: "Sohag", ar: "سوهاج" },
  { id: "qena", en: "Qena", ar: "قنا" },
  { id: "luxor", en: "Luxor", ar: "الأقصر" },
  { id: "aswan", en: "Aswan", ar: "أسوان" },
  { id: "red-sea", en: "Red Sea", ar: "البحر الأحمر" },
  { id: "new-valley", en: "New Valley", ar: "الوادي الجديد" },
] as const;

export type GovernorateId = (typeof governorates)[number]["id"];

export const governorateIds = governorates.map((g) => g.id) as GovernorateId[];

export function governorateName(id: string, locale: string) {
  const match = governorates.find((g) => g.id === id);
  if (!match) return id;
  return locale === "ar" ? match.ar : match.en;
}
