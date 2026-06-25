const fs = require('fs');
const path = require('path');

const transPath = path.join(__dirname, '../lib/translation.ts');
let content = fs.readFileSync(transPath, 'utf8');

const keysToAdd = {
  welcomeBack: 'string;',
  whatsHappening: 'string;',
  totalSpentHome: 'string;',
  acrossAllInvoices: 'string;',
  totalInvoicesHome: 'string;',
  processedByAI: 'string;',
  avgInvoiceValueHome: 'string;',
  avgSpendingPerInvoice: 'string;',
  topVendorHome: 'string;',
  invoicesScannedCount: 'string;',
  recentScansHome: 'string;',
  viewAllHome: 'string;',
  noInvoicesScanned: 'string;',
  quickActionsHome: 'string;',
  scanNewDocumentHome: 'string;',
  viewHistoryHome: 'string;',
};

// Add to TranslationKeys interface
const interfaceEndIdx = content.indexOf('}');
if (!content.includes('welcomeBack:')) {
  let interfaceInject = '';
  for (const [key, type] of Object.entries(keysToAdd)) {
    interfaceInject += `  ${key}: ${type}\n`;
  }
  content = content.slice(0, interfaceEndIdx) + interfaceInject + content.slice(interfaceEndIdx);
}

const translations = {
  en: {
    welcomeBack: "Welcome back,",
    whatsHappening: "Here's what's happening with your invoices today.",
    totalSpentHome: "Total Spent",
    acrossAllInvoices: "Across all scanned invoices",
    totalInvoicesHome: "Total Invoices",
    processedByAI: "Processed by AI",
    avgInvoiceValueHome: "Avg. Invoice Value",
    avgSpendingPerInvoice: "Average spending per invoice",
    topVendorHome: "Top Vendor",
    invoicesScannedCount: "{count} invoices scanned",
    recentScansHome: "Recent Scans",
    viewAllHome: "View All",
    noInvoicesScanned: "No invoices scanned yet.",
    quickActionsHome: "Quick Actions",
    scanNewDocumentHome: "Scan new document",
    viewHistoryHome: "View history"
  },
  id: {
    welcomeBack: "Selamat datang kembali,",
    whatsHappening: "Inilah ringkasan faktur Anda hari ini.",
    totalSpentHome: "Total Pengeluaran",
    acrossAllInvoices: "Dari semua faktur yang dipindai",
    totalInvoicesHome: "Total Faktur",
    processedByAI: "Diproses oleh AI",
    avgInvoiceValueHome: "Rata-rata Faktur",
    avgSpendingPerInvoice: "Rata-rata pengeluaran per faktur",
    topVendorHome: "Vendor Teratas",
    invoicesScannedCount: "{count} faktur dipindai",
    recentScansHome: "Pemindaian Terbaru",
    viewAllHome: "Lihat Semua",
    noInvoicesScanned: "Belum ada faktur yang dipindai.",
    quickActionsHome: "Aksi Cepat",
    scanNewDocumentHome: "Pindai dokumen baru",
    viewHistoryHome: "Lihat riwayat"
  },
  es: {
    welcomeBack: "Bienvenido de nuevo,",
    whatsHappening: "Esto es lo que sucede con sus facturas hoy.",
    totalSpentHome: "Total Gastado",
    acrossAllInvoices: "En todas las facturas escaneadas",
    totalInvoicesHome: "Total de Facturas",
    processedByAI: "Procesado por IA",
    avgInvoiceValueHome: "Valor Promedio",
    avgSpendingPerInvoice: "Gasto promedio por factura",
    topVendorHome: "Proveedor Principal",
    invoicesScannedCount: "{count} facturas escaneadas",
    recentScansHome: "Escaneos Recientes",
    viewAllHome: "Ver Todo",
    noInvoicesScanned: "Aún no se han escaneado facturas.",
    quickActionsHome: "Acciones Rápidas",
    scanNewDocumentHome: "Escanear nuevo documento",
    viewHistoryHome: "Ver historial"
  },
  pt: {
    welcomeBack: "Bem-vindo de volta,",
    whatsHappening: "Aqui está o que está acontecendo com suas faturas hoje.",
    totalSpentHome: "Total Gasto",
    acrossAllInvoices: "Em todas as faturas",
    totalInvoicesHome: "Total de Faturas",
    processedByAI: "Processado por IA",
    avgInvoiceValueHome: "Valor Médio",
    avgSpendingPerInvoice: "Gasto médio por fatura",
    topVendorHome: "Principal Fornecedor",
    invoicesScannedCount: "{count} faturas digitalizadas",
    recentScansHome: "Verificações Recentes",
    viewAllHome: "Ver Tudo",
    noInvoicesScanned: "Nenhuma fatura digitalizada ainda.",
    quickActionsHome: "Ações Rápidas",
    scanNewDocumentHome: "Digitalizar novo documento",
    viewHistoryHome: "Ver histórico"
  },
  zh: {
    welcomeBack: "欢迎回来,",
    whatsHappening: "这是您今天发票的情况。",
    totalSpentHome: "总支出",
    acrossAllInvoices: "在所有扫描的发票中",
    totalInvoicesHome: "发票总数",
    processedByAI: "AI 处理",
    avgInvoiceValueHome: "平均发票价值",
    avgSpendingPerInvoice: "平均每张发票支出",
    topVendorHome: "顶级供应商",
    invoicesScannedCount: "扫描了 {count} 张发票",
    recentScansHome: "最近扫描",
    viewAllHome: "查看全部",
    noInvoicesScanned: "尚未扫描发票。",
    quickActionsHome: "快速操作",
    scanNewDocumentHome: "扫描新文档",
    viewHistoryHome: "查看历史记录"
  },
  ru: {
    welcomeBack: "С возвращением,",
    whatsHappening: "Вот что происходит с вашими счетами сегодня.",
    totalSpentHome: "Всего потрачено",
    acrossAllInvoices: "По всем отсканированным счетам",
    totalInvoicesHome: "Всего счетов",
    processedByAI: "Обработано ИИ",
    avgInvoiceValueHome: "Средняя стоимость",
    avgSpendingPerInvoice: "Средние расходы на счет",
    topVendorHome: "Лучший поставщик",
    invoicesScannedCount: "{count} счетов отсканировано",
    recentScansHome: "Последние сканирования",
    viewAllHome: "Смотреть все",
    noInvoicesScanned: "Счета еще не отсканированы.",
    quickActionsHome: "Быстрые действия",
    scanNewDocumentHome: "Сканировать новый документ",
    viewHistoryHome: "Посмотреть историю"
  },
  ar: {
    welcomeBack: "مرحبًا بعودتك,",
    whatsHappening: "إليك ما يحدث مع فواتيرك اليوم.",
    totalSpentHome: "إجمالي المنفق",
    acrossAllInvoices: "عبر جميع الفواتير الممسوحة",
    totalInvoicesHome: "إجمالي الفواتير",
    processedByAI: "تمت المعالجة بواسطة الذكاء الاصطناعي",
    avgInvoiceValueHome: "متوسط قيمة الفاتورة",
    avgSpendingPerInvoice: "متوسط الإنفاق لكل فاتورة",
    topVendorHome: "أفضل مورد",
    invoicesScannedCount: "{count} فواتير ممسوحة",
    recentScansHome: "عمليات المسح الأخيرة",
    viewAllHome: "عرض الكل",
    noInvoicesScanned: "لم يتم مسح أي فواتير بعد.",
    quickActionsHome: "إجراءات سريعة",
    scanNewDocumentHome: "مسح مستند جديد",
    viewHistoryHome: "عرض السجل"
  },
  de: {
    welcomeBack: "Willkommen zurück,",
    whatsHappening: "Hier ist, was heute mit Ihren Rechnungen passiert.",
    totalSpentHome: "Insgesamt ausgegeben",
    acrossAllInvoices: "Über alle gescannten Rechnungen",
    totalInvoicesHome: "Rechnungen insgesamt",
    processedByAI: "Verarbeitet von KI",
    avgInvoiceValueHome: "Durchschn. Rechnungswert",
    avgSpendingPerInvoice: "Durchschnittliche Ausgaben pro Rechnung",
    topVendorHome: "Top-Anbieter",
    invoicesScannedCount: "{count} Rechnungen gescannt",
    recentScansHome: "Letzte Scans",
    viewAllHome: "Alle ansehen",
    noInvoicesScanned: "Noch keine Rechnungen gescannt.",
    quickActionsHome: "Schnelle Aktionen",
    scanNewDocumentHome: "Neues Dokument scannen",
    viewHistoryHome: "Verlauf ansehen"
  }
};

for (const lang in translations) {
  const langMarker = `  ${lang}: {`;
  const langIdx = content.indexOf(langMarker);
  if (langIdx !== -1) {
    const insertIdx = langIdx + langMarker.length;
    let injectStr = '\n';
    for (const [k, v] of Object.entries(translations[lang])) {
      injectStr += `    ${k}: "${v}",\n`;
    }
    content = content.slice(0, insertIdx) + injectStr + content.slice(insertIdx);
  }
}

fs.writeFileSync(transPath, content, 'utf8');

// Now update app/home/page.tsx
const homePath = path.join(__dirname, '../app/home/page.tsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

// Replacements
homeContent = homeContent
  .replace(/Welcome back, /g, "{t.welcomeBack} ")
  .replace(/Here's what's happening with your invoices today\./g, "{t.whatsHappening}")
  .replace(/title="Total Spent"/g, "title={t.totalSpentHome}")
  .replace(/sub="Across all scanned invoices"/g, "sub={t.acrossAllInvoices}")
  .replace(/title="Total Invoices"/g, "title={t.totalInvoicesHome}")
  .replace(/sub="Processed by AI"/g, "sub={t.processedByAI}")
  .replace(/title="Avg\. Invoice Value"/g, "title={t.avgInvoiceValueHome}")
  .replace(/sub="Average spending per invoice"/g, "sub={t.avgSpendingPerInvoice}")
  .replace(/title="Top Vendor"/g, "title={t.topVendorHome}")
  .replace(/sub={\`\$\{maxCount\} invoices scanned\`}/g, "sub={t.invoicesScannedCount.replace('{count}', maxCount.toString())}")
  .replace(/Recent Scans<\/h2>/g, "{t.recentScansHome}</h2>")
  .replace(/View All <ArrowRight/g, "{t.viewAllHome} <ArrowRight")
  .replace(/No invoices scanned yet\./g, "{t.noInvoicesScanned}")
  .replace(/Quick Actions<\/h2>/g, "{t.quickActionsHome}</h2>")
  .replace(/Scan new document<\/span>/g, "{t.scanNewDocumentHome}</span>")
  .replace(/View history<\/span>/g, "{t.viewHistoryHome}</span>")
  .replace(/Unknown Vendor/g, "\"{t.unknownVendor}\"");

fs.writeFileSync(homePath, homeContent, 'utf8');
console.log('Translations applied successfully!');
