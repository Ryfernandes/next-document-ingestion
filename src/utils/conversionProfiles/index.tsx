// src/utils/conversionProfiles/index.tsx

export type conversionProfile = {
  editable: boolean;
  alias: string;
  image_export_mode: "embedded" | "placeholder" | "referenced";
  pipeline: "standard" | "vlm";
  ocr_engine: "easyocr" | "tesseract_cli" | "tesseract" | "rapidocr" | "ocrmac";
  pdf_backend: "pypdfium2" | "dlparse_v1" | "dlparse_v2" | "dlparse_v4";
  table_mode: "fast" | "accurate";
  do_ocr: boolean;
  force_ocr: boolean;
  do_code_enrichment: boolean;
  do_formula_enrichment: boolean;
  do_picture_classification: boolean;
  do_picture_description: boolean;
  do_table_structure: boolean;
  md_page_break_placeholder: string;
  settings?: string | null;
  id: number;
}

export type conversionProfileDisplay = {
  alias: string;
  image_export_mode: string;
  vlm: string;
  ocr_engine: string;
  pdf_backend: string;
  table_mode: string;
  ocr: string;
  force_ocr: string;
  enrichment: string;
  picture_options: string;
  do_tables: string;
  page_breaks: string;
  permanent?: boolean;
  settings?: string | null;
}

export const getConversionProfileDisplay = (profile: conversionProfile): conversionProfileDisplay => {
  const ocrEngineTranslations: { [key: string]: string } = {
    easyocr: "EasyOCR",
    tesseract_cli: "Tesseract CLI",
    tesseract: "Tesseract",
    rapidocr: "RapidOCR",
    ocrmac: "OCRMac"
  };

  return {
    alias: profile.alias,
    image_export_mode: profile.image_export_mode.charAt(0).toUpperCase() + profile.image_export_mode.slice(1),
    vlm: profile.pipeline === "vlm" ? "ON" : "OFF",
    ocr_engine: ocrEngineTranslations[profile.ocr_engine] || profile.ocr_engine,
    pdf_backend: profile.pdf_backend,
    table_mode: profile.table_mode.charAt(0).toUpperCase() + profile.table_mode.slice(1),
    ocr: profile.do_ocr ? "ON" : "OFF",
    force_ocr: profile.force_ocr ? "ON" : "OFF",
    enrichment: profile.do_code_enrichment ? (profile.do_formula_enrichment ? "Code & Formulas" : "Code") : (profile.do_formula_enrichment ? "Formulas" : "None"),
    picture_options: profile.do_picture_classification ? (profile.do_picture_description ? "Classify & Describe" : "Classify") : (profile.do_picture_description ? "Describe" : "None"),
    do_tables: profile.do_table_structure ? "ON" : "OFF",
    page_breaks: profile.md_page_break_placeholder.length > 0 ? "Placeholder" : "None"
  }
}

export const creationDefault: conversionProfile = {
  editable: true,
  alias: "",
  image_export_mode: "embedded",
  pipeline: "standard",
  ocr_engine: "easyocr",
  pdf_backend: "dlparse_v4",
  table_mode: "fast",
  do_ocr: true,
  force_ocr: false,
  do_code_enrichment: false,
  do_formula_enrichment: false,
  do_picture_classification: false,
  do_picture_description: false,
  do_table_structure: true,
  md_page_break_placeholder: "",
  id: -1
}

export const defaultConversionProfiles: conversionProfile[] = [
  {
    editable: false,
    alias: "Default",
    image_export_mode: "embedded",
    pipeline: "standard",
    ocr_engine: "easyocr",
    pdf_backend: "dlparse_v4",
    table_mode: "accurate",
    do_ocr: true,
    force_ocr: false,
    do_code_enrichment: false,
    do_formula_enrichment: false,
    do_picture_classification: false,
    do_picture_description: false,
    do_table_structure: true,
    md_page_break_placeholder: "",
    id: 0
  },
  {
    editable: false,
    alias: "Force OCR",
    image_export_mode: "embedded",
    pipeline: "standard",
    ocr_engine: "easyocr",
    pdf_backend: "dlparse_v4",
    table_mode: "accurate",
    do_ocr: true,
    force_ocr: true,
    do_code_enrichment: false,
    do_formula_enrichment: false,
    do_picture_classification: false,
    do_picture_description: false,
    do_table_structure: true,
    md_page_break_placeholder: "",
    id: 1,
  },
  {
    editable: false,
    alias: "Code and Formulas",
    image_export_mode: "embedded",
    pipeline: "standard",
    ocr_engine: "easyocr",
    pdf_backend: "dlparse_v4",
    table_mode: "accurate",
    do_ocr: true,
    force_ocr: false,
    do_code_enrichment: true,
    do_formula_enrichment: true,
    do_picture_classification: false,
    do_picture_description: false,
    do_table_structure: true,
    md_page_break_placeholder: "",
    id: 2
  },
  {
    editable: false,
    alias: "Image-Heavy",
    image_export_mode: "embedded",
    pipeline: "standard",
    ocr_engine: "easyocr",
    pdf_backend: "dlparse_v4",
    table_mode: "accurate",
    do_ocr: true,
    force_ocr: false,
    do_code_enrichment: false,
    do_formula_enrichment: false,
    do_picture_classification: true,
    do_picture_description: true,
    do_table_structure: true,
    md_page_break_placeholder: "",
    id: 3
  },
  {
    editable: false,
    alias: "VLM",
    image_export_mode: "embedded",
    pipeline: "vlm",
    ocr_engine: "easyocr",
    pdf_backend: "dlparse_v4",
    table_mode: "accurate",
    do_ocr: true,
    force_ocr: false,
    do_code_enrichment: false,
    do_formula_enrichment: false,
    do_picture_classification: false,
    do_picture_description: false,
    do_table_structure: true,
    md_page_break_placeholder: "",
    id: 4
  }
]

export const equivalentConversionProfiles = (a: conversionProfile, b: conversionProfile): boolean => {
  return (
    a.alias === b.alias &&
    a.image_export_mode === b.image_export_mode &&
    a.pipeline === b.pipeline &&
    a.ocr_engine === b.ocr_engine &&
    a.pdf_backend === b.pdf_backend &&
    a.table_mode === b.table_mode &&
    a.do_ocr === b.do_ocr &&
    a.force_ocr === b.force_ocr &&
    a.do_code_enrichment === b.do_code_enrichment &&
    a.do_formula_enrichment === b.do_formula_enrichment &&
    a.do_picture_classification === b.do_picture_classification &&
    a.do_picture_description === b.do_picture_description &&
    a.do_table_structure === b.do_table_structure &&
    a.md_page_break_placeholder === b.md_page_break_placeholder
  )
}