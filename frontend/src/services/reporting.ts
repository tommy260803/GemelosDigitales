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

const fmt = (n: number | string | undefined | null, fallback = 'N/A'): string => {
  if (n === undefined || n === null || n === '') return fallback;
  return String(n);
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
      doc.rect(PAGE.ml, engine.y, CONTENT_W, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(title, PAGE.ml + 3, engine.y + 5.5);
      engine.y += 12;
    },
    paragraph(text, opts = {}) {
      const size = opts.size ?? 9;
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
      const size = opts.size ?? 8.5;
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
        doc.text(label, PAGE.ml, PAGE.h - 8);
        doc.text(`${i} / ${pages}`, PAGE.w - PAGE.mr, PAGE.h - 8, { align: 'right' });
      }
    },
  };
  return engine;
};

const drawHeaderBanner = (doc: jsPDF, district: DistrictData, t: T, language: Language) => {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PAGE.w, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(t.docBannerTitle, PAGE.ml, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${t.docDistrictLabel} ${district.name} (${district.country}) | ${t.docEngineSub}`,
    PAGE.ml,
    22
  );
  doc.text(`${t.docGeneratedLabel} ${localeDate(language)}`, PAGE.ml, 28);
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
  engine.y += 4;
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

    engine.sectionBar(t.docSection1);
    const left = [
      `${t.docTotalPop} ${district.population.toLocaleString()}`,
      `${t.docAnnualBirths} ${district.annualBirths.toLocaleString()}`,
      `${t.docBaselineMMRLine} ${district.baselineMMR} ${t.docPer100kBirths}`,
    ];
    const right = [
      `${t.docAnc4} ${district.anc4Coverage}%`,
      `${t.docInstDelivery} ${district.institutionalDeliveryRate}%`,
      `${t.docAvgDistance} ${district.avgDistanceToEmONC} km (${district.avgTravelTimeHours}h ${t.docHoursTransit})`,
    ];
    const half = CONTENT_W / 2 - 2;
    left.forEach((line) => {
      engine.ensure(5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(doc.splitTextToSize(`• ${line}`, half)[0], PAGE.ml + 1, engine.y + 4);
      engine.y += 5.5;
    });
    const yRight = engine.y - left.length * 5.5;
    right.forEach((line, i) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(doc.splitTextToSize(`• ${line}`, half)[0], PAGE.ml + CONTENT_W / 2 + 1, yRight + 4 + i * 5.5);
    });
    engine.y = Math.max(engine.y, yRight + right.length * 5.5) + 2;

    engine.sectionBar(t.docSection2);
    const headers = [
      t.docColScenario,
      t.docColLivesSaved,
      t.docColFinalMMR,
      t.docColRedPct,
      t.docColCostLife,
      t.docColIcer,
    ];
    const colW = [58, 40, 24, 22, 24, 14];
    const rows = scenarioRows(t, simResults).map(({ label, res }) => [
      label,
      `${res.summary.livesSaved} [${res.summary.livesSavedCI95[0]}-${res.summary.livesSavedCI95[1]}]`,
      String(res.summary.mmrFinal),
      `-${res.summary.mmrReductionPercent}%`,
      res.summary.costPerLifeSavedUSD > 0 ? `$${res.summary.costPerLifeSavedUSD.toLocaleString()}` : '$0',
      res.summary.icerPerDALY > 0 ? `$${res.summary.icerPerDALY}` : '$0',
    ]);
    drawTable(engine, headers, rows, colW, { highlightLast: true });

    engine.sectionBar(t.docSection3);
    const icer = simResults.scenario_d?.summary.icerPerDALY || 42;
    engine.paragraph(t.docSynergy, { size: 8.5, color: MUTED });
    engine.paragraph(t.docCostThreshold.replace('{icer}', String(icer)), { size: 8.5, color: MUTED });
    engine.paragraph(t.docEquityFocus, { size: 8.5, color: MUTED });

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
      engine.bullets(items, { size: 8 });
    }

    engine.addFooters(t.docBannerTitle);
    doc.save(`Maternal_Health_SD_Digital_Twin_${district.id}_${t.docPdfFilename}.pdf`);
  }

  public static generateExcelReport(
    district: DistrictData,
    simResults: Record<string, SimulationResult>,
    validation: ValidationMetrics,
    language: Language = 'es'
  ): void {
    const t = translations[language] as T;
    const wb = XLSX.utils.book_new();
    const na = t.docNA;

    const summaryData: (string | number)[][] = [
      [t.docExcelSummaryTitle],
      [t.docExcelDistrictName, district.name],
      [t.docExcelCountry, district.country],
      [t.docExcelRegion, district.region],
      [t.docExcelPopulation, district.population],
      [t.docExcelAnnualBirths, district.annualBirths],
      [t.docExcelBaselineMMR, district.baselineMMR],
      [t.docExcelAnc4, district.anc4Coverage],
      [t.docExcelInstRate, district.institutionalDeliveryRate],
      [t.docExcelTravelTime, district.avgTravelTimeHours],
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
        r.summary.livesSaved,
        r.summary.livesSavedCI95[0],
        r.summary.livesSavedCI95[1],
        r.summary.mmrFinal,
        r.summary.mmrReductionPercent,
        r.summary.totalCostUSD,
        r.summary.costPerLifeSavedUSD,
        r.summary.icerPerDALY,
      ]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 22 }, { wch: 34 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
      { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
    ];
    for (let r = 13; r < summaryData.length; r++) {
      for (let c = 2; c < 10; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (wsSummary[ref]) (wsSummary[ref] as XLSX.CellObject).z = '#,##0.00';
      }
    }
    XLSX.utils.book_append_sheet(wb, wsSummary, t.docExcelSummarySheet.slice(0, 31));

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
        tr.pregnantWomen,
        tr.inANC,
        tr.inFacilityDelivery,
        tr.inPostpartum,
        tr.withComplications,
        tr.monthlyBirths,
        tr.monthlyMaternalDeaths,
        tr.monthlyLivesSaved,
        tr.calculatedMMR,
        tr.ancCoveragePercent,
        tr.facilityDeliveryPercent,
        tr.systemTrustLevel,
        tr.facilityCongestionIndex,
      ]);
    });

    const wsTrajectories = XLSX.utils.aoa_to_sheet(trajectoryData);
    wsTrajectories['!cols'] = Array.from({ length: 14 }, () => ({ wch: 16 }));
    if (comboRes?.trajectories?.length) {
      const range = XLSX.utils.decode_range(wsTrajectories['!ref'] || 'A1');
      for (let r = 1; r <= range.e.r; r++) {
        for (let c = 1; c <= 13; c++) {
          const ref = XLSX.utils.encode_cell({ r, c });
          if (wsTrajectories[ref]) (wsTrajectories[ref] as XLSX.CellObject).z = '#,##0.00';
        }
      }
    }
    XLSX.utils.book_append_sheet(wb, wsTrajectories, t.docExcelTrajSheet.slice(0, 31));

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
      ],
    ];

    comboRes?.equityDisaggregation?.forEach((eq) => {
      equityData.push([
        eq.quintile,
        eq.label,
        eq.populationShare,
        eq.baselineMMR,
        eq.simulatedMMR,
        eq.livesSaved,
        eq.relativeReduction,
        eq.absoluteReduction,
      ]);
    });

    const wsEquity = XLSX.utils.aoa_to_sheet(equityData);
    wsEquity['!cols'] = Array.from({ length: 8 }, (_, i) => ({ wch: i < 2 ? 22 : 14 }));
    for (let r = 1; r < equityData.length; r++) {
      for (let c = 2; c < 8; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (wsEquity[ref]) (wsEquity[ref] as XLSX.CellObject).z = '#,##0.00';
      }
    }
    XLSX.utils.book_append_sheet(wb, wsEquity, t.docExcelEquitySheet.slice(0, 31));

    if (hasValidation(validation)) {
      const validationData: (string | number)[][] = [
        [t.docExcelValTitle],
        [],
        [t.docExcelKsTitle],
        [t.docExcelStatD, validation.kolmogorovSmirnov?.statisticD ?? na],
        [t.docExcelPValue, validation.kolmogorovSmirnov?.pValue ?? na],
        [
          t.docExcelEquiv,
          validation.kolmogorovSmirnov?.isStatisticallyEquivalent ? t.docExcelYes : t.docExcelNo,
        ],
        [],
        [t.docExcelWilcoxonTitle],
        [t.docExcelStatW, validation.wilcoxonSignedRank?.statisticW ?? na],
        [t.docExcelZScore, validation.wilcoxonSignedRank?.zScore ?? na],
        [t.docExcelPValue, validation.wilcoxonSignedRank?.pValue ?? na],
        [],
        [t.docExcelGofTitle],
        [t.docExcelRSq, validation.externalValidation?.rSquared ?? na],
        [t.docExcelRmse, validation.externalValidation?.rmse ?? na],
        [t.docExcelMae, validation.externalValidation?.meanAbsoluteError ?? na],
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
          validation.sobolSensitivity?.firstOrderIndices?.[i] ?? na,
          validation.sobolSensitivity?.totalOrderIndices?.[i] ?? na,
          validation.sobolSensitivity?.confidenceIntervals?.[i]?.[0] ?? na,
          validation.sobolSensitivity?.confidenceIntervals?.[i]?.[1] ?? na,
        ]);
      });

      const wsValidation = XLSX.utils.aoa_to_sheet(validationData);
      wsValidation['!cols'] = [{ wch: 36 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsValidation, t.docExcelValSheet.slice(0, 31));
    }

    XLSX.writeFile(wb, `Maternal_Health_SD_Digital_Twin_${district.id}_${t.docXlsxFilename}.xlsx`);
  }

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

    const headerCell = (text: string) =>
      new TableCell({
        shading: headerFill,
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })],
          }),
        ],
        width: { size: 16, type: WidthType.PERCENTAGE },
      });

    const bodyCell = (text: string) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
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
        text: `${t.docWordSubtitle} ${district.name.toUpperCase()} (${district.country.toUpperCase()})`,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `${t.docGeneratedLabel} `, bold: true }),
          new TextRun({ text: `${localeDate(language)} | ` }),
          new TextRun({ text: `${t.docModelEngine} `, bold: true }),
          new TextRun({ text: t.docModelEngineVal }),
        ],
        spacing: { after: 300 },
      }),
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
          new TextRun({ text: `${district.baselineMMR} ${t.docPer100kBirths}\n` }),
          new TextRun({ text: `• ${t.docAnc4} `, bold: true }),
          new TextRun({ text: `${district.anc4Coverage}%\n` }),
          new TextRun({ text: `• ${t.docInstDelivery} `, bold: true }),
          new TextRun({ text: `${district.institutionalDeliveryRate}%\n` }),
          new TextRun({ text: `• ${t.docAvgDistance} `, bold: true }),
          new TextRun({ text: `${district.avgDistanceToEmONC} km (${district.avgTravelTimeHours}h)\n` }),
          new TextRun({ text: `• ${t.docBloodBank} `, bold: true }),
          new TextRun({ text: `${district.bloodBankAvailability}%\n` }),
          new TextRun({ text: `• ${t.docPoverty} `, bold: true }),
          new TextRun({ text: `${district.povertyRate}%` }),
        ],
        spacing: { after: 250 },
      }),
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
                bodyCell(label),
                bodyCell(String(res.summary.mmrFinal)),
                bodyCell(`-${res.summary.mmrReductionPercent}%`),
                bodyCell(
                  `${res.summary.livesSaved} [${res.summary.livesSavedCI95[0]}-${res.summary.livesSavedCI95[1]}]`
                ),
                bodyCell(
                  res.summary.costPerLifeSavedUSD > 0
                    ? `$${res.summary.costPerLifeSavedUSD.toLocaleString()}`
                    : '$0'
                ),
                bodyCell(res.summary.icerPerDALY > 0 ? `$${res.summary.icerPerDALY}` : '$0'),
              ],
            })
          ),
        ],
      }),
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
                bodyCell(q.baselineMMR != null ? String(q.baselineMMR) : '—'),
                bodyCell(String(q.simulatedMMR)),
                bodyCell(String(q.livesSaved)),
                bodyCell(q.fiscalCostUSD ? `$${q.fiscalCostUSD.toLocaleString()}` : '—'),
                bodyCell(`-${q.relativeReduction}%`),
              ],
            })
          ),
        ],
      }),
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
