import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  ShadingType,
  BorderStyle,
} from 'docx';
import { DistrictData, SimulationResult, ValidationMetrics } from '../types';
import { Language, translations, Translations } from '../i18n/translations';

type T = Translations;

const PAGE = { w: 210, h: 297, ml: 14, mr: 14, mt: 12, mb: 18 };
const CONTENT_W = PAGE.w - PAGE.ml - PAGE.mr;

const PRIMARY: [number, number, number] = [15, 76, 129];
const ACCENT: [number, number, number] = [13, 148, 136];
const SLATE: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [71, 85, 105];

/**
 * Rounds any number to at most 4 decimal places without trailing floating-point noise.
 */
export const roundMax4 = (n: number | string | undefined | null): number => {
  if (n === undefined || n === null || n === '') return 0;
  const num = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 10000) / 10000;
};

/**
 * Formats a number to at most 4 decimal places using clean locale representation.
 */
export const fmt = (n: number | string | undefined | null, fallback = '—'): string => {
  if (n === undefined || n === null || n === '') return fallback;
  const num = typeof n === 'number' ? n : Number(n);
  if (isNaN(num)) return String(n);
  if (!Number.isFinite(num)) return String(num);
  const rounded = roundMax4(num);
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

const hasValidation = (v: ValidationMetrics | undefined | null): boolean => {
  if (!v) return false;
  return Boolean(
    v.kolmogorovSmirnov ||
    v.wilcoxonSignedRank ||
    v.sobolSensitivity ||
    v.externalValidation ||
    v.bootstrap
  );
};

const localeDate = (language: Language): string => {
  const loc = language === 'es' ? 'es-ES' : 'en-US';
  return new Date().toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' });
};

interface PdfEngine {
  doc: jsPDF;
  y: number;
  ensure: (h: number) => void;
  pageBreak: () => void;
  sectionBar: (title: string) => void;
  paragraph: (text: string, opts?: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; lineHeight?: number }) => void;
  bullets: (items: string[], opts?: { size?: number }) => void;
  addFooters: (label: string) => void;
}

const createEngine = (doc: jsPDF): PdfEngine => {
  const engine: PdfEngine = {
    doc,
    y: PAGE.mt,
    ensure(h: number) {
      if (engine.y + h > PAGE.h - PAGE.mb) {
        engine.pageBreak();
      }
    },
    pageBreak() {
      doc.addPage();
      engine.y = PAGE.mt;
    },
    sectionBar(title: string) {
      engine.ensure(14);
      engine.y += 4;
      doc.setFillColor(...PRIMARY);
      doc.rect(PAGE.ml, engine.y, CONTENT_W, 7.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(title, PAGE.ml + 3, engine.y + 5.2);
      engine.y += 11;
    },
    paragraph(text, opts = {}) {
      const size = opts.size ?? 8.5;
      const bold = opts.bold ?? false;
      const color = opts.color ?? [30, 41, 59] as [number, number, number];
      const indent = opts.indent ?? 0;
      const lineHeight = opts.lineHeight ?? (size * 0.42);
      const maxW = CONTENT_W - indent;
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxW) as string[];
      for (const line of lines) {
        engine.ensure(lineHeight + 1);
        doc.text(line, PAGE.ml + indent, engine.y + lineHeight);
        engine.y += lineHeight;
      }
      engine.y += 1.5;
    },
    bullets(items, opts = {}) {
      const size = opts.size ?? 8;
      for (const item of items) {
        const bulletText = `• ${item}`;
        engine.paragraph(bulletText, { size, color: MUTED, indent: 2, lineHeight: size * 0.45 });
      }
    },
    addFooters(label: string) {
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.line(PAGE.ml, PAGE.h - 10, PAGE.w - PAGE.mr, PAGE.h - 10);
        doc.text(`${label} · Integración RK4 (Δt = 0.05 meses)`, PAGE.ml, PAGE.h - 6);
        doc.text(`${i} / ${pages}`, PAGE.w - PAGE.mr, PAGE.h - 6, { align: 'right' });
      }
    },
  };
  return engine;
};

const drawHeaderBanner = (doc: jsPDF, district: DistrictData, t: T, language: Language) => {
  doc.setFillColor(...SLATE);
  doc.rect(0, 0, PAGE.w, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(t.docBannerTitle, PAGE.ml, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${t.docDistrictLabel} ${district.name} (${district.country}, ${district.region}) | ${t.docEngineSub}`,
    PAGE.ml,
    21
  );
  doc.text(`${t.docGeneratedLabel} ${localeDate(language)} | Calibración OMS/MMEIG & Tres Demoras`, PAGE.ml, 28);
};

const drawTable = (
  engine: PdfEngine,
  headers: string[],
  rows: string[][],
  colW: number[],
  opts?: { highlightLast?: boolean; fontSize?: number }
) => {
  const size = opts?.fontSize ?? 7.5;
  const pad = 1.2;
  const lineH = size * 0.45;

  const measureRow = (cells: string[], bold: boolean): number => {
    engine.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    engine.doc.setFontSize(size);
    let maxLines = 1;
    cells.forEach((c, i) => {
      const lines = engine.doc.splitTextToSize(c, colW[i] - pad * 2) as string[];
      maxLines = Math.max(maxLines, lines.length);
    });
    return maxLines * lineH + pad * 2;
  };

  const drawRow = (
    cells: string[],
    y: number,
    h: number,
    style: 'header' | 'body' | 'highlight'
  ) => {
    const { doc } = engine;
    if (style === 'header') {
      doc.setFillColor(226, 232, 240);
      doc.rect(PAGE.ml, y, CONTENT_W, h, 'F');
    } else if (style === 'highlight') {
      doc.setFillColor(240, 253, 250);
      doc.rect(PAGE.ml, y, CONTENT_W, h, 'F');
    }
    doc.setDrawColor(203, 213, 225);
    doc.line(PAGE.ml, y + h, PAGE.ml + CONTENT_W, y + h);

    let x = PAGE.ml;
    cells.forEach((cell, i) => {
      doc.setFont('helvetica', style === 'header' ? 'bold' : style === 'highlight' ? 'bold' : 'normal');
      doc.setFontSize(size);
      if (style === 'header') doc.setTextColor(15, 23, 42);
      else if (style === 'highlight') doc.setTextColor(...ACCENT);
      else doc.setTextColor(51, 65, 85);

      const lines = doc.splitTextToSize(cell, colW[i] - pad * 2) as string[];
      let ly = y + pad + lineH;
      for (const line of lines) {
        doc.text(line, x + pad, ly);
        ly += lineH;
      }
      x += colW[i];
    });
  };

  const headerH = measureRow(headers, true);
  engine.ensure(headerH + 8);
  drawRow(headers, engine.y, headerH, 'header');
  engine.y += headerH;

  rows.forEach((row, idx) => {
    const isLast = opts?.highlightLast && idx === rows.length - 1;
    const h = measureRow(row, Boolean(isLast));
    if (engine.y + h > PAGE.h - PAGE.mb) {
      engine.pageBreak();
      drawRow(headers, engine.y, headerH, 'header');
      engine.y += headerH;
    }
    drawRow(row, engine.y, h, isLast ? 'highlight' : 'body');
    engine.y += h;
  });
  engine.y += 3;
};

const scenarioRows = (t: T, simResults: Record<string, SimulationResult>): { label: string; res: SimulationResult }[] => {
  const map: { id: string; label: string }[] = [
    { id: 'baseline', label: t.docStatusQuo },
    { id: 'scenario_a', label: t.docMotoAmb },
    { id: 'scenario_b', label: t.docFeeElim },
    { id: 'scenario_c', label: t.docTbaAlarm },
    { id: 'scenario_d', label: t.docCombinedPkg },
  ];
  return map
    .map((s) => ({ label: s.label, res: simResults[s.id] }))
    .filter((s): s is { label: string; res: SimulationResult } => Boolean(s.res));
};

export class ReportGenerationService {
  /**
   * PDF Ejecutivo con rigor epidemiológico, diseño profesional y redondeo a máx 4 decimales.
   */
  public static generateExecutivePDF(
    district: DistrictData,
    simResults: Record<string, SimulationResult>,
    validation: ValidationMetrics,
    language: Language = 'es'
  ): void {
    const t = translations[language] as T;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const engine = createEngine(doc);

    drawHeaderBanner(doc, district, t, language);
    engine.y = 42;

    // Sección 1: Perfil Epidemiológico y Sociodemográfico
    engine.sectionBar(t.docSection1);
    const left = [
      `${t.docTotalPop} ${district.population.toLocaleString()}`,
      `${t.docAnnualBirths} ${district.annualBirths.toLocaleString()}`,
      `${t.docBaselineMMRLine} ${fmt(district.baselineMMR)} ${t.docPer100kBirths}`,
      `Cobertura de Seguro: ${fmt(district.insuranceCoverage)}%`,
      `Tasa de Pobreza: ${fmt(district.povertyRate)}%`,
    ];
    const right = [
      `${t.docAnc4} ${fmt(district.anc4Coverage)}%`,
      `${t.docInstDelivery} ${fmt(district.institutionalDeliveryRate)}%`,
      `${t.docAvgDistance} ${fmt(district.avgDistanceToEmONC)} km (${fmt(district.avgTravelTimeHours)}h ${t.docHoursTransit})`,
      `Personal Capacitado: ${fmt(district.skilledStaffRatio)} por 10k hab`,
      `Disponibilidad 24/7 Personal (SPA): ${district.staff247AvailabilityRate != null ? `${fmt(district.staff247AvailabilityRate * 100)}%` : 'N/A'}`,
    ];
    const half = CONTENT_W / 2 - 2;
    const initialY = engine.y;
    left.forEach((line) => {
      engine.ensure(5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(doc.splitTextToSize(`• ${line}`, half)[0], PAGE.ml + 1, engine.y + 3.5);
      engine.y += 4.8;
    });
    const maxLeftY = engine.y;
    right.forEach((line, i) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(doc.splitTextToSize(`• ${line}`, half)[0], PAGE.ml + CONTENT_W / 2 + 1, initialY + 3.5 + i * 4.8);
    });
    engine.y = Math.max(maxLeftY, initialY + right.length * 4.8) + 2;

    // Sección 2: Evaluación Comparativa de Políticas (A, B, C, D)
    engine.sectionBar(t.docSection2);
    const headers = [
      t.docColScenario,
      t.docColLivesSaved,
      t.docColFinalMMR,
      t.docColRedPct,
      t.docColCostLife,
      t.docColIcer,
    ];
    const colW = [56, 42, 24, 22, 24, 14];
    const rows = scenarioRows(t, simResults).map(({ label, res }) => [
      label,
      `${fmt(res.summary.livesSaved)} [${fmt(res.summary.livesSavedCI95[0])}-${fmt(res.summary.livesSavedCI95[1])}]`,
      fmt(res.summary.mmrFinal),
      `-${fmt(res.summary.mmrReductionPercent)}%`,
      res.summary.costPerLifeSavedUSD > 0 ? `$${fmt(res.summary.costPerLifeSavedUSD)}` : '$0',
      res.summary.icerPerDALY > 0 ? `$${fmt(res.summary.icerPerDALY)}` : '$0',
    ]);
    drawTable(engine, headers, rows, colW, { highlightLast: true });

    // Sección 3: Análisis de Equidad por Quintiles de Riqueza
    const comboRes = simResults.scenario_d || simResults.baseline;
    if (comboRes?.equityDisaggregation?.length) {
      engine.sectionBar(language === 'es' ? '3. Distribución del Impacto por Quintiles de Riqueza' : '3. Wealth Quintiles Equity Impact');
      const eqHeaders = language === 'es'
        ? ['Quintil', 'Población', 'MMR Base', 'MMR Sim.', 'Reducción %', 'Vidas Salv.', 'Costo Fiscal USD']
        : ['Quintile', 'Pop Share', 'Base MMR', 'Sim MMR', 'Reduction %', 'Lives Saved', 'Fiscal Cost USD'];
      const eqColW = [38, 22, 22, 22, 24, 24, 30];
      const eqRows = comboRes.equityDisaggregation.map((q) => [
        `${q.quintile} (${q.label})`,
        `${fmt(q.populationShare * 100)}%`,
        fmt(q.baselineMMR),
        fmt(q.simulatedMMR),
        `-${fmt(q.relativeReduction)}%`,
        fmt(q.livesSaved),
        q.fiscalCostUSD ? `$${fmt(q.fiscalCostUSD)}` : '—',
      ]);
      drawTable(engine, eqHeaders, eqRows, eqColW, { highlightLast: false });
    }

    // Sección 4: Especificaciones Técnicas y Marco de Tres Demoras
    engine.sectionBar(language === 'es' ? '4. Especificaciones Técnicas del Gemelo Digital' : '4. Digital Twin Technical Specifications');
    const icer = simResults.scenario_d?.summary.icerPerDALY || 42;
    engine.paragraph(t.docSynergy, { size: 8, color: MUTED });
    engine.paragraph(t.docCostThreshold.replace('{icer}', fmt(icer)), { size: 8, color: MUTED });
    engine.bullets([
      language === 'es'
        ? 'Modelo ODE: 5 compartimentos continuos (Embarazadas, CPN, Parto Institucional, Puerperio, Complicaciones obstétricas).'
        : 'ODE Model: 5 continuous compartments (Pregnant, ANC, Facility Delivery, Postpartum, Obstetric Complications).',
      language === 'es'
        ? 'Integrador Numérico: Runge-Kutta de 4to Orden (RK4) con paso de tiempo continuo Δt = 0.05 meses (1.5 días) y convergencia de Cauchy ε < 0.01%.'
        : 'Numerical Integrator: 4th-Order Runge-Kutta (RK4) with continuous step size Δt = 0.05 months (1.5 days) and Cauchy error ε < 0.01%.',
      language === 'es'
        ? 'Mapeo de Tres Demoras: Fase 1 (confianza comunitaria/TBA), Fase 2 (transporte/red vial y moto-ambulancias), Fase 3 (capacidad EmONC 24/7 y stock uterotónico).'
        : 'Three-Delays Mapping: Phase 1 (community trust/TBA), Phase 2 (road quality/moto-ambulances), Phase 3 (24/7 EmONC capacity and uterotonics).',
    ], { size: 7.5 });

    // Sección 5: Validación Científica (si disponible)
    if (hasValidation(validation)) {
      engine.sectionBar(t.docSection4);
      const na = t.docNA;
      const ks = validation.kolmogorovSmirnov;
      const wx = validation.wilcoxonSignedRank;
      const sob = validation.sobolSensitivity;
      const ext = validation.externalValidation;
      const boot = validation.bootstrap;
      const items: string[] = [];
      if (ks) {
        items.push(
          t.docKsLine
            .replace('{d}', fmt(ks.statisticD, na))
            .replace('{p}', fmt(ks.pValue, na))
        );
      }
      if (wx) {
        items.push(
          t.docWilcoxonLine
            .replace('{w}', fmt(wx.statisticW, na))
            .replace('{p}', fmt(wx.pValue, na))
        );
      }
      if (sob) {
        items.push(
          t.docSobolLine.replace(
            '{top}',
            sob.topVarianceContributors?.join('; ') || t.docNotAvailable
          )
        );
      }
      if (ext) {
        items.push(
          t.docGofLine
            .replace('{r2}', fmt(ext.rSquared, na))
            .replace('{rmse}', fmt(ext.rmse, na))
        );
      }
      if (boot) {
        items.push(
          t.docBootstrapLine
            .replace('{mean}', fmt(boot.meanLivesSaved, na))
            .replace('{lo}', fmt(boot.ci95LivesSaved?.[0], '?'))
            .replace('{hi}', fmt(boot.ci95LivesSaved?.[1], '?'))
        );
      }
      items.push(t.docHypothesisLine);
      engine.bullets(items, { size: 7.5 });
    }

    engine.addFooters(t.docBannerTitle);
    doc.save(`Maternal_Health_SD_Digital_Twin_${district.id}_${t.docPdfFilename}.pdf`);
  }

  /**
   * Reporte Excel estructurado con 5 hojas, números con máx 4 decimales y metadatos del modelo.
   */
  public static generateExcelReport(
    district: DistrictData,
    simResults: Record<string, SimulationResult>,
    validation: ValidationMetrics,
    language: Language = 'es'
  ): void {
    const t = translations[language] as T;
    const wb = XLSX.utils.book_new();
    const na = t.docNA;

    // Hoja 1: Resumen Ejecutivo
    const summaryData: (string | number)[][] = [
      [t.docExcelSummaryTitle],
      [t.docExcelDistrictName, district.name],
      [t.docExcelCountry, district.country],
      [t.docExcelRegion, district.region],
      [t.docExcelPopulation, district.population],
      [t.docExcelAnnualBirths, district.annualBirths],
      [t.docExcelBaselineMMR, roundMax4(district.baselineMMR)],
      [t.docExcelAnc4, roundMax4(district.anc4Coverage)],
      [t.docExcelInstRate, roundMax4(district.institutionalDeliveryRate)],
      [t.docExcelTravelTime, roundMax4(district.avgTravelTimeHours)],
      ['Disponibilidad 24/7 Personal (SPA)', district.staff247AvailabilityRate != null ? roundMax4(district.staff247AvailabilityRate * 100) : na],
      [],
      [t.docExcelScenarioResults],
      [
        t.docExcelColId,
        t.docExcelColName,
        t.docExcelColSaved,
        t.docExcelColCiLow,
        t.docExcelColCiHigh,
        t.docExcelColFinalMMR,
        t.docExcelColRed,
        t.docExcelColCost,
        t.docExcelColCostLife,
        t.docExcelColIcer,
      ],
    ];

    Object.values(simResults).forEach((r) => {
      summaryData.push([
        r.scenarioId,
        r.scenarioName,
        roundMax4(r.summary.livesSaved),
        roundMax4(r.summary.livesSavedCI95[0]),
        roundMax4(r.summary.livesSavedCI95[1]),
        roundMax4(r.summary.mmrFinal),
        roundMax4(r.summary.mmrReductionPercent),
        roundMax4(r.summary.totalCostUSD),
        roundMax4(r.summary.costPerLifeSavedUSD),
        roundMax4(r.summary.icerPerDALY),
      ]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 22 }, { wch: 34 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
      { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, t.docExcelSummarySheet.slice(0, 31));

    // Hoja 2: Trayectorias Temporales (RK4)
    const comboRes = simResults.scenario_d || simResults.baseline;
    const trajectoryData: (string | number)[][] = [
      [
        t.docExcelColMonth,
        t.docExcelColS1,
        t.docExcelColS2,
        t.docExcelColS3,
        t.docExcelColS4,
        t.docExcelColS5,
        t.docExcelColBirths,
        t.docExcelColDeaths,
        t.docExcelColSavedTraj,
        t.docExcelColMmr,
        t.docExcelColAnc,
        t.docExcelColFac,
        t.docExcelColTrust,
        t.docExcelColCongestion,
      ],
    ];

    comboRes?.trajectories?.forEach((tr) => {
      trajectoryData.push([
        tr.timeMonth,
        roundMax4(tr.pregnantWomen),
        roundMax4(tr.inANC),
        roundMax4(tr.inFacilityDelivery),
        roundMax4(tr.inPostpartum),
        roundMax4(tr.withComplications),
        roundMax4(tr.monthlyBirths),
        roundMax4(tr.monthlyMaternalDeaths),
        roundMax4(tr.monthlyLivesSaved),
        roundMax4(tr.calculatedMMR),
        roundMax4(tr.ancCoveragePercent),
        roundMax4(tr.facilityDeliveryPercent),
        roundMax4(tr.systemTrustLevel),
        roundMax4(tr.facilityCongestionIndex),
      ]);
    });

    const wsTrajectories = XLSX.utils.aoa_to_sheet(trajectoryData);
    wsTrajectories['!cols'] = Array.from({ length: 14 }, () => ({ wch: 16 }));
    XLSX.utils.book_append_sheet(wb, wsTrajectories, t.docExcelTrajSheet.slice(0, 31));

    // Hoja 3: Desagregación de Equidad
    const equityData: (string | number)[][] = [
      [
        t.docExcelColQuintile,
        t.docExcelColLabel,
        t.docExcelColShare,
        t.docExcelColBaseMMR,
        t.docExcelColSimMMR,
        t.docExcelColSaved,
        t.docExcelColRelRed,
        t.docExcelColAbsRed,
        'Costo Fiscal USD',
      ],
    ];

    comboRes?.equityDisaggregation?.forEach((eq) => {
      equityData.push([
        eq.quintile,
        eq.label,
        roundMax4(eq.populationShare),
        roundMax4(eq.baselineMMR),
        roundMax4(eq.simulatedMMR),
        roundMax4(eq.livesSaved),
        roundMax4(eq.relativeReduction),
        roundMax4(eq.absoluteReduction),
        roundMax4(eq.fiscalCostUSD ?? 0),
      ]);
    });

    const wsEquity = XLSX.utils.aoa_to_sheet(equityData);
    wsEquity['!cols'] = Array.from({ length: 9 }, (_, i) => ({ wch: i < 2 ? 22 : 15 }));
    XLSX.utils.book_append_sheet(wb, wsEquity, t.docExcelEquitySheet.slice(0, 31));

    // Hoja 4: Validación y Calibración
    if (hasValidation(validation)) {
      const validationData: (string | number)[][] = [
        [t.docExcelValTitle],
        [],
        [t.docExcelKsTitle],
        [t.docExcelStatD, roundMax4(validation.kolmogorovSmirnov?.statisticD ?? 0)],
        [t.docExcelPValue, roundMax4(validation.kolmogorovSmirnov?.pValue ?? 0)],
        [
          t.docExcelEquiv,
          validation.kolmogorovSmirnov?.isStatisticallyEquivalent ? t.docExcelYes : t.docExcelNo,
        ],
        [],
        [t.docExcelWilcoxonTitle],
        [t.docExcelStatW, roundMax4(validation.wilcoxonSignedRank?.statisticW ?? 0)],
        [t.docExcelZScore, roundMax4(validation.wilcoxonSignedRank?.zScore ?? 0)],
        [t.docExcelPValue, roundMax4(validation.wilcoxonSignedRank?.pValue ?? 0)],
        [],
        [t.docExcelGofTitle],
        [t.docExcelRSq, roundMax4(validation.externalValidation?.rSquared ?? 0)],
        [t.docExcelRmse, roundMax4(validation.externalValidation?.rmse ?? 0)],
        [t.docExcelMae, roundMax4(validation.externalValidation?.meanAbsoluteError ?? 0)],
        [],
        [t.docExcelSobolTitle],
        [
          t.docExcelColParam,
          t.docExcelColS1h,
          t.docExcelColSTh,
          t.docExcelColCiLowH,
          t.docExcelColCiHighH,
        ],
      ];

      (validation.sobolSensitivity?.parameters || []).forEach((param, i) => {
        validationData.push([
          param,
          roundMax4(validation.sobolSensitivity?.firstOrderIndices?.[i] ?? 0),
          roundMax4(validation.sobolSensitivity?.totalOrderIndices?.[i] ?? 0),
          roundMax4(validation.sobolSensitivity?.confidenceIntervals?.[i]?.[0] ?? 0),
          roundMax4(validation.sobolSensitivity?.confidenceIntervals?.[i]?.[1] ?? 0),
        ]);
      });

      const wsValidation = XLSX.utils.aoa_to_sheet(validationData);
      wsValidation['!cols'] = [{ wch: 36 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsValidation, t.docExcelValSheet.slice(0, 31));
    }

    // Hoja 5: Parámetros del Modelo y Metadatos SD
    const paramsData: (string | number)[][] = [
      ['METADATOS DEL MODELO DE DINÁMICA DE SISTEMAS'],
      ['Paso de Integración Numérica (dt)', 0.05],
      ['Unidad de dt', 'Meses (1.5 días)'],
      ['Método de Integración', 'Runge-Kutta 4to Orden (RK4)'],
      ['Criterio de Convergencia Cauchy', '< 0.01%'],
      ['Marco Epidemiológico', 'Three-Delays Framework (OMS)'],
      [],
      ['PARÁMETROS CALIBRADOS DEL DISTRITO', district.name],
      ['Distancia Promedio EmONC (km)', roundMax4(district.avgDistanceToEmONC)],
      ['Tiempo de Tránsito (horas)', roundMax4(district.avgTravelTimeHours)],
      ['Índice de Calidad de Carreteras (0-1)', roundMax4(comboRes?.parameters?.roadQualityIndex ?? 0)],
      ['Costo de Transporte (USD)', roundMax4(comboRes?.parameters?.transportCostUSD ?? 0)],
      ['Tarifa Parto Institucional (USD)', roundMax4(comboRes?.parameters?.facilityDeliveryFeeUSD ?? 0)],
      ['Densidad de Personal Capacitado (/10k)', roundMax4(district.skilledStaffRatio)],
      ['Disponibilidad 24/7 Personal (SPA)', district.staff247AvailabilityRate != null ? roundMax4(district.staff247AvailabilityRate) : na],
      ['Disponibilidad Banco de Sangre (%)', roundMax4(district.bloodBankAvailability)],
      ['Disponibilidad Fármacos Esenciales (%)', roundMax4(district.essentialDrugsAvailability)],
      ['Confianza Comunitaria Basal (0-1)', roundMax4(comboRes?.parameters?.communityTrustBaseline ?? 0.72)],
      ['Tasa Basal de Complicaciones (0-1)', roundMax4(comboRes?.parameters?.baselineComplicationRate ?? 0.15)],
    ];
    const wsParams = XLSX.utils.aoa_to_sheet(paramsData);
    wsParams['!cols'] = [{ wch: 38 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, wsParams, (language === 'es' ? 'Parámetros y Metadatos' : 'Model Parameters').slice(0, 31));

    XLSX.writeFile(wb, `Maternal_Health_SD_Digital_Twin_${district.id}_${t.docXlsxFilename}.xlsx`);
  }

  /**
   * Reporte Word (DOCX) ejecutivo completo y formateado con números de máx 4 decimales.
   */
  public static async generateWordReport(
    district: DistrictData,
    simResults: Record<string, SimulationResult>,
    validation: ValidationMetrics,
    language: Language = 'es'
  ): Promise<void> {
    const t = translations[language] as T;
    const comboRes = simResults['scenario_d'] || simResults['baseline'];
    const na = t.docNA;
    const headerFill = { type: ShadingType.CLEAR, color: '0F4C81', fill: '0F4C81' } as const;
    const calloutFill = { type: ShadingType.CLEAR, color: 'F0FDF4', fill: 'F0FDF4' } as const;

    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    };

    const headerCell = (text: string) =>
      new TableCell({
        shading: headerFill,
        borders: cellBorders,
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 17 })],
          }),
        ],
        width: { size: 16, type: WidthType.PERCENTAGE },
      });

    const bodyCell = (text: string, bold = false) =>
      new TableCell({
        borders: cellBorders,
        children: [new Paragraph({ children: [new TextRun({ text, bold, size: 17 })] })],
        width: { size: 16, type: WidthType.PERCENTAGE },
      });

    const validationParagraphs: Paragraph[] = [];
    if (hasValidation(validation)) {
      const ks = validation.kolmogorovSmirnov;
      const wx = validation.wilcoxonSignedRank;
      const ext = validation.externalValidation;
      const runs: TextRun[] = [];
      if (ks) {
        runs.push(
          new TextRun({
            text: `• ${t.ksTestTitle}: D = ${fmt(ks.statisticD, na)}, p = ${fmt(ks.pValue, na)}\n`,
            bold: false,
          })
        );
      }
      if (wx) {
        runs.push(
          new TextRun({
            text: `• ${t.wilcoxonTitle || 'Wilcoxon'}: W = ${fmt(wx.statisticW, na)}, p = ${fmt(wx.pValue, na)}\n`,
          })
        );
      }
      if (ext) {
        runs.push(
          new TextRun({
            text: `• ${t.docExcelGofTitle}: R² = ${fmt(ext.rSquared, na)}, RMSE = ${fmt(ext.rmse, na)}\n`,
          })
        );
      }
      runs.push(new TextRun({ text: `• ${t.docHypothesisLine}` }));
      validationParagraphs.push(
        new Paragraph({
          children: runs,
          spacing: { after: 200 },
        })
      );
    }

    const children: (Paragraph | Table)[] = [
      new Paragraph({
        text: t.docWordTitle,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
      new Paragraph({
        text: `${t.docWordSubtitle} - ${district.name.toUpperCase()} (${district.country.toUpperCase()})`,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `${t.docGeneratedLabel} `, bold: true }),
          new TextRun({ text: `${localeDate(language)} | ` }),
          new TextRun({ text: `${t.docModelEngine} `, bold: true }),
          new TextRun({ text: `${t.docModelEngineVal} (RK4, dt = 0.05 meses)` }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 260 },
      }),

      // Resumen Ejecutivo Destacado
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: calloutFill,
                borders: cellBorders,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'RESUMEN EJECUTIVO DE IMPACTO (PAQUETE COMBINADO ESCENARIO D)\n', bold: true, color: '0D9488', size: 19 }),
                      new TextRun({ text: `• MMR Línea Base OMS: `, bold: true }),
                      new TextRun({ text: `${fmt(district.baselineMMR)} muertes por 100.000 nacidos vivos\n` }),
                      new TextRun({ text: `• MMR Proyectado Escenario D: `, bold: true }),
                      new TextRun({ text: `${fmt(comboRes?.summary.mmrFinal)} muertes/100k (Reducción de -${fmt(comboRes?.summary.mmrReductionPercent)}%)\n` }),
                      new TextRun({ text: `• Vidas Maternas Salvadas en el Horizonte: `, bold: true }),
                      new TextRun({ text: `${fmt(comboRes?.summary.livesSaved)} vidas\n` }),
                      new TextRun({ text: `• Razón Costo-Efectividad Incremental (ICER): `, bold: true }),
                      new TextRun({ text: `$${fmt(comboRes?.summary.costPerLifeSavedUSD)} USD por vida salvada` }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ text: '', spacing: { after: 200 } }),

      // Sección 1: Perfil Epidemiológico
      new Paragraph({
        text: `1. ${t.docSection1.replace('1. ', '')}`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `• ${t.docTotalPop} `, bold: true }),
          new TextRun({ text: `${district.population.toLocaleString()}\n` }),
          new TextRun({ text: `• ${t.docAnnualBirths} `, bold: true }),
          new TextRun({ text: `${district.annualBirths.toLocaleString()}\n` }),
          new TextRun({ text: `• ${t.docBaselineMMRLine} `, bold: true }),
          new TextRun({ text: `${fmt(district.baselineMMR)} ${t.docPer100kBirths}\n` }),
          new TextRun({ text: `• ${t.docAnc4} `, bold: true }),
          new TextRun({ text: `${fmt(district.anc4Coverage)}%\n` }),
          new TextRun({ text: `• ${t.docInstDelivery} `, bold: true }),
          new TextRun({ text: `${fmt(district.institutionalDeliveryRate)}%\n` }),
          new TextRun({ text: `• ${t.docAvgDistance} `, bold: true }),
          new TextRun({ text: `${fmt(district.avgDistanceToEmONC)} km (${fmt(district.avgTravelTimeHours)}h)\n` }),
          new TextRun({ text: `• ${t.docBloodBank} `, bold: true }),
          new TextRun({ text: `${fmt(district.bloodBankAvailability)}%\n` }),
          new TextRun({ text: `• ${t.docPoverty} `, bold: true }),
          new TextRun({ text: `${fmt(district.povertyRate)}%\n` }),
          new TextRun({ text: `• Disponibilidad 24/7 Personal (SPA): `, bold: true }),
          new TextRun({ text: `${district.staff247AvailabilityRate != null ? `${fmt(district.staff247AvailabilityRate * 100)}%` : na}` }),
        ],
        spacing: { after: 250 },
      }),

      // Sección 2: Políticas e Intervenciones
      new Paragraph({
        text: t.docWordSection2,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 120 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              headerCell(t.docColPolicyScenario),
              headerCell(t.docColFinalMMR),
              headerCell(t.docColRedPct),
              headerCell(t.docColLivesSaved),
              headerCell(t.docColCostLife),
              headerCell(t.docColIcer),
            ],
          }),
          ...scenarioRows(t, simResults).map(({ label, res }) =>
            new TableRow({
              children: [
                bodyCell(label, true),
                bodyCell(fmt(res.summary.mmrFinal)),
                bodyCell(`-${fmt(res.summary.mmrReductionPercent)}%`),
                bodyCell(
                  `${fmt(res.summary.livesSaved)} [${fmt(res.summary.livesSavedCI95[0])}-${fmt(res.summary.livesSavedCI95[1])}]`
                ),
                bodyCell(
                  res.summary.costPerLifeSavedUSD > 0
                    ? `$${fmt(res.summary.costPerLifeSavedUSD)}`
                    : '$0'
                ),
                bodyCell(res.summary.icerPerDALY > 0 ? `$${fmt(res.summary.icerPerDALY)}` : '$0'),
              ],
            })
          ),
        ],
      }),

      // Sección 3: Equidad
      new Paragraph({
        text: t.docWordSection3,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 120 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              headerCell(t.docExcelColQuintile),
              headerCell(t.docExcelColBaseMMR),
              headerCell(t.docExcelColSimMMR),
              headerCell(t.docExcelColSaved),
              headerCell(t.docExcelColCost),
              headerCell(t.docExcelColRed),
            ],
          }),
          ...(comboRes?.equityDisaggregation || []).map((q) =>
            new TableRow({
              children: [
                bodyCell(`${q.quintile} (${q.label})`),
                bodyCell(q.baselineMMR != null ? fmt(q.baselineMMR) : '—'),
                bodyCell(fmt(q.simulatedMMR)),
                bodyCell(fmt(q.livesSaved)),
                bodyCell(q.fiscalCostUSD ? `$${fmt(q.fiscalCostUSD)}` : '—'),
                bodyCell(`-${fmt(q.relativeReduction)}%`),
              ],
            })
          ),
        ],
      }),

      // Sección 4: Especificaciones Metodológicas
      new Paragraph({
        text: language === 'es' ? '4. Metodología de Simulación y Marco de Tres Demoras' : '4. Simulation Methodology & Three-Delays Framework',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'El motor de simulación modela la dinámica poblacional y asistencial de la salud materna utilizando ecuaciones diferenciales ordinarias (ODE) resueltas mediante integración numérica continua de Runge-Kutta de 4to Orden (RK4) con un paso temporal Δt = 0.05 meses (equivalente a 1.5 días). Cada paquete de intervención se proyecta sobre las tres fases de demora materna:\n' }),
          new TextRun({ text: '• Fase 1 (Decisión de buscar atención): ', bold: true }),
          new TextRun({ text: 'Influencia de promotores de salud y parteras tradicionales (TBA), confianza basal comunitaria y educación femenina.\n' }),
          new TextRun({ text: '• Fase 2 (Identificación y llegada al centro): ', bold: true }),
          new TextRun({ text: 'Calidad de carreteras, distancia geográfica, tiempos de tránsito y disponibilidad de red de moto-ambulancias.\n' }),
          new TextRun({ text: '• Fase 3 (Recepción de atención obstétrica de emergencia oportuna): ', bold: true }),
          new TextRun({ text: 'Disponibilidad de personal clínico 24/7 (SPA), banco de sangre y stock esencial de uterotónicos (oxitocina/misoprostol).' }),
        ],
        spacing: { after: 200 },
      }),

      // Sección 5: Validación
      new Paragraph({
        text: t.docWordSection4,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 120 },
      }),
      ...validationParagraphs,
      ...(validationParagraphs.length === 0
        ? [new Paragraph({ text: t.docNotAvailable, spacing: { after: 200 } })]
        : []),
      new Paragraph({
        text: t.docCertified,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
    ];

    const doc = new Document({
      creator: t.docWordTitle,
      title: `${t.docWordSubtitle} - ${district.name}`,
      description: t.docWordSubtitle,
      sections: [{ properties: {}, children }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Maternal_Health_SD_Digital_Twin_${district.id}_${t.docDocxFilename}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
