/** 南華大學校務資訊公開專區 — 資料服務（Google Apps Script）
 *  作用：網站唯一資料入口。試算表本身保持「限制」私有，外界無法開啟或下載原始檔。
 *  部署：擴充功能 → Apps Script → 貼上本檔 → 部署 → 新增部署作業 → 網頁應用程式
 *       執行身分：我／具有存取權的使用者：任何人 → 複製網址貼入 index.html 的 GAS_URL
 *  更新程式後需「管理部署作業 → 編輯 → 新版本」才會生效。
 */
const SPREADSHEET_ID = '1Gz5NCBJhDkDgtwZJlbhytnVFy7EgQlyVZY6ZyRY6Fvo';

/** 公開分頁白名單：只有列在這裡的分頁會被送出；草稿分頁不列即不外流 */
const PUBLIC_SHEETS = [
  '沿革','組織架構','學生人數','教職員人數','生師比','學生使用空間','資源概況','招生就學','新生人數','境外生','SWOT','特色主題',
  '評鑑結果','畢業生流向','KPI','董事會財務','董事會收支',
  '收支總覽','收入','支出',
  '收費與成本','支出估算','助學措施','助學統計',
  '報告清單','採購處分連結','採購案件','處分資產','資產報廢','設備效益','其他連結',
  '文件清單','稽核清單','意見回應','文字說明'
];

function doGet(e){
  const p = (e && e.parameter) || {};
  if(p.csv){ return csvOut(String(p.csv)); }   // ?csv=分頁名稱 → 下載該表 CSV（僅限白名單）
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const out = {};
  PUBLIC_SHEETS.forEach(function(name){
    const sh = ss.getSheetByName(name);
    if(!sh) return;
    const vals = sh.getDataRange().getValues();
    // 去除全空列、將 Date 轉字串
    out[name] = vals
      .filter(function(r){ return r.some(function(c){ return c !== '' && c !== null; }); })
      .map(function(r){ return r.map(function(c){
        return (c instanceof Date) ? Utilities.formatDate(c,'Asia/Taipei','yyyy-MM-dd') : c; }); });
  });
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 定稿分頁之 CSV 下載（教育部「得統計運用之檔案格式」遵循點）。
 *  僅白名單分頁可下載；草稿分頁不在名單內，一律拒絕。 */
function csvOut(name){
  if(PUBLIC_SHEETS.indexOf(name) === -1){
    return ContentService.createTextOutput('此資料表不提供下載').setMimeType(ContentService.MimeType.TEXT);
  }
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if(!sh){
    return ContentService.createTextOutput('查無資料表').setMimeType(ContentService.MimeType.TEXT);
  }
  const rows = sh.getDataRange().getValues()
    .filter(function(r){ return r.some(function(c){ return c !== '' && c !== null; }); });
  const csv = rows.map(function(r){
    return r.map(function(c){
      var v = (c instanceof Date) ? Utilities.formatDate(c,'Asia/Taipei','yyyy-MM-dd') : String(c == null ? '' : c);
      if(/[",\n]/.test(v)) v = '"' + v.replace(/"/g,'""') + '"';
      return v;
    }).join(',');
  }).join('\r\n');
  return ContentService.createTextOutput('\uFEFF' + csv)   // BOM：Excel 直開不亂碼
    .setMimeType(ContentService.MimeType.CSV)
    .downloadAsFile(name + '.csv');
}
