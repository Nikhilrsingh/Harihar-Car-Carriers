import { getCompanyHeaderHtml, getCompanyStampHtml, loadAssetBase64Images } from '../utils/stampAssets';

export const generateLoadingHtml = async (data) => {
  let assets = { leftLogo: '', rightLogo: '', sign: '' };
  try {
    assets = await loadAssetBase64Images();
  } catch (e) {
    console.warn('Asset loading fallback:', e);
  }

  const carsList = Array.isArray(data.cars) && data.cars.length > 0 ? data.cars : [data];
  const cellPadding = carsList.length > 4 ? '4px 3px' : '6px 4px';
  const fontSize = carsList.length > 4 ? '10px' : '11px';

  const tableRowsHtml = carsList.map((item, idx) => {
    const rawPhone = item.partyNumber || item.partyNo || '';
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
    const phoneHtml = cleanPhone
      ? `<a href="tel:${cleanPhone}" style="color: #1d3a7e; text-decoration: underline; font-weight: 800;">${rawPhone}</a>`
      : '-';

    return `
      <tr style="text-align: center; font-size: ${fontSize};">
        <td style="border: 1px solid #000000; padding: ${cellPadding}; font-weight: 900; width: 4%; vertical-align: middle;">#${idx + 1}</td>
        <td style="border: 1px solid #000000; padding: ${cellPadding}; font-weight: 900; text-align: left; width: 20%; word-break: break-word; vertical-align: middle;">${item.carName || '-'}</td>
        <td style="border: 1px solid #000000; padding: ${cellPadding}; font-weight: 900; width: 12%; word-break: break-all; vertical-align: middle;">${item.carNumber || item.carNo || '-'}</td>
        <td style="border: 1px solid #000000; padding: ${cellPadding}; font-weight: 800; text-align: left; width: 16%; word-break: break-word; vertical-align: middle;">${item.partyName || '-'}</td>
        <td style="border: 1px solid #000000; padding: ${cellPadding}; width: 12%; word-break: break-all; vertical-align: middle;">${phoneHtml}</td>
        <td style="border: 1px solid #000000; padding: ${cellPadding}; width: 10%; font-weight: 800; vertical-align: middle;">₹${item.carValue || '0'}</td>
        <td style="border: 1px solid #000000; padding: ${cellPadding}; width: 9%; font-weight: 800; vertical-align: middle;">${item.fromLocation || 'NAGPUR'}</td>
        <td style="border: 1px solid #000000; padding: ${cellPadding}; width: 9%; font-weight: 800; vertical-align: middle;">${item.toLocation || '-'}</td>
        <td style="border: 1px solid #000000; padding: ${cellPadding}; width: 8%; font-weight: 800; vertical-align: middle;">${item.packerName || '-'}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 landscape; margin: 0; }
          * { box-sizing: border-box; -webkit-user-select: text !important; user-select: text !important; }
          html, body {
            margin: 0;
            padding: 3mm;
            width: 100vw;
            height: 100vh;
            background: #ffffff;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.2;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
          }
          .outer-border {
            border: 2px solid #000000;
            height: calc(100vh - 6mm);
            padding: 6px 10px;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          .meta-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1.5px solid #000000;
            padding: 4px 8px;
            margin-top: 2px;
            margin-bottom: 6px;
            font-size: 11px;
            font-weight: 900;
          }
          table.manifest-table { width: 100%; border-collapse: collapse; margin-top: 2px; table-layout: fixed; }
          table.manifest-table th { 
            border: 1px solid #000000;
            padding: 5px 2px;
            font-size: 10.5px;
            font-weight: 900; 
            text-align: center; 
            color: #000000;
            background-color: #ffffff;
          }
          .content-body { flex: 1; }
          .stamp-container { margin-top: auto; width: 100%; display: flex; justify-content: flex-end; }
        </style>
      </head>
      <body>
        <div class="outer-border">
          <div class="content-body">
            ${getCompanyHeaderHtml(assets)}

            <div class="meta-bar">
              <div>LOADING ID: <span style="color: #dc2626;">${data.loadingNo || data.docId || 'HCC-Loading-01'}</span></div>
              <div>DATE: ${data.loadingDate || data.date || '-'}</div>
              <div>TRAILER NO.: ${data.truckNo || data.trailerNo || '-'}</div>
              <div>TRANSPORTER: ${data.transporter || '-'}</div>
              <div>DRIVER NO.: ${data.driverNo || data.driverMobile || '-'}</div>
            </div>

            <table class="manifest-table">
              <thead>
                <tr>
                  <th style="width: 4%;">SR</th>
                  <th style="width: 20%;">CAR NAME</th>
                  <th style="width: 12%;">CAR NO.</th>
                  <th style="width: 16%;">PARTY NAME</th>
                  <th style="width: 12%;">PARTY NO.</th>
                  <th style="width: 10%;">VALUE (₹)</th>
                  <th style="width: 9%;">FROM</th>
                  <th style="width: 9%;">TO</th>
                  <th style="width: 8%;">PACKER NAME</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>

          <div class="stamp-container">
            ${getCompanyStampHtml(assets)}
          </div>
        </div>
      </body>
    </html>
  `;
};