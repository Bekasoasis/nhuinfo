/**
 * 南華大學校務資訊公開專區 — 資料服務（Google Apps Script）
 * 部署後，網站以單次請求取回所有公開分頁；試算表本身可設為「限制」不對外共用。
 * 用法：
 *   GET  .../exec              → 全部公開分頁 JSON {分頁名: [[標題列],[資料列]...]}
 *   GET  .../exec?csv=分頁名    → 下載該分頁 CSV
 */
const PUBLIC_SHEETS = [
  '沿革','組織架構','學生人數','教職員人數','生師比','學生使用空間','資源概況','招生就學','新生人數','境外生',
  'SWOT','特色主題','特色主題內容','特色具體內容','特色主題對照','評鑑結果','畢業生流向','畢業生流向文件','就業追蹤系所','就業追蹤統計','KPI','董事會財務','董事會收支',
  '收支總覽','收入','支出',
  '收費標準','教學成本','學雜費占成本','收費與成本','支出估算','助學措施','助學統計',
  '報告清單','採購處分連結','採購案件','處分資產','資產報廢','設備效益','其他連結',
  '文件清單','稽核清單','意見回應','文字說明'
];

function readSheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) return null;
  const v = sh.getDataRange().getValues();
  return v.filter(r => r.some(c => c !== '' && c !== null))
          .map(r => r.map(c => c instanceof Date ? Utilities.formatDate(c, 'Asia/Taipei', 'yyyy-MM-dd') : c));
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const csv = e && e.parameter && e.parameter.csv;
  if (csv) {
    if (PUBLIC_SHEETS.indexOf(csv) < 0) return ContentService.createTextOutput('not found');
    const rows = readSheet_(ss, csv) || [];
    const text = '\uFEFF' + rows.map(r => r.map(c => {
      const s = String(c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
    return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.CSV)
      .downloadAsFile(csv + '.csv');
  }
  const cache = CacheService.getScriptCache();
  const hit = cache.get('all');
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  const out = {};
  PUBLIC_SHEETS.forEach(n => { const t = readSheet_(ss, n); if (t) out[n] = t; });
  const json = JSON.stringify(out);
  if (json.length < 90000) cache.put('all', json, 60); // 快取 60 秒
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/** 試算表編輯時清除快取，讓網站 1 分鐘內反映（需在觸發條件中設定「編輯時」執行 onEdit） */
function onEdit() { CacheService.getScriptCache().remove('all'); }
