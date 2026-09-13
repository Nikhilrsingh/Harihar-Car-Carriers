import { getCompanyHeaderHtml, getCompanyStampHtml, loadAssetBase64Images } from './stampAssets';

export const generateWebDocumentHtml = async (docType, data) => {
  let assets = { leftLogo: '', rightLogo: '', sign: '' };
  try {
    assets = await loadAssetBase64Images();
  } catch (e) {
    console.warn('Assets fallback:', e);
  }

  const itemsList = Array.isArray(data.cars) && data.cars.length > 0
    ? data.cars
    : Array.isArray(data.vehicles) && data.vehicles.length > 0
    ? data.vehicles
    : [data];

  const cellPadding = itemsList.length > 4 ? '5px 4px' : '8px 6px';
  const fontSize = itemsList.length > 4 ? '11px' : '12px';

  let title = 'DOCUMENT MANIFEST';
  let docNoLabel = 'DOC NO';
  let docNoVal = data.docId || data.lrNo || data.invoiceNo || data.loadingNo || '-';

  if (docType === 'bilty') {
    title = 'BILTY / LORRY RECEIPT';
    docNoLabel = 'LR / BILTY NO';
  } else if (docType === 'loading') {
    title = 'LOADING ADVICE MANIFEST';
    docNoLabel = 'LOADING SHEET NO';
  } else if (docType === 'invoice') {
    title = 'TAX INVOICE';
    docNoLabel = 'INVOICE NO';
  }

  const tableRowsHtml = itemsList.map((item, idx) => {
    const rawPhone = item.partyNumber || item.partyNo || item.consigneePhone || '';
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
    const phoneHtml = cleanPhone
      ? `<a href="tel:${cleanPhone}" style="color: #0284c7; text-decoration: underline; font-weight: 800; font-size: ${fontSize};">${rawPhone}</a>`
      : '-';

    return `
      <tr style="text-align: center;">
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; font-weight: 900; width: 4%; vertical-align: middle;">${idx + 1}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; font-weight: 900; text-align: left; width: 22%; word-break: break-word; vertical-align: middle; color: #0f172a; font-size: ${fontSize};">${item.carName || item.description || '-'}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; font-weight: 900; width: 14%; word-break: break-all; vertical-align: middle; color: #dc2626; font-size: ${fontSize};">${item.carNumber || item.carNo || '-'}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; font-weight: 800; text-align: left; width: 20%; word-break: break-word; vertical-align: middle; color: #0f172a; font-size: ${fontSize};">${item.partyName || item.consignorName || '-'}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; width: 14%; word-break: break-all; vertical-align: middle;">${phoneHtml}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; width: 13%; word-break: break-word; vertical-align: middle; font-weight: 800; font-size: ${fontSize};">${item.fromLocation || 'NAGPUR'} ➔ ${item.toLocation || '-'}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; width: 13%; word-break: break-word; vertical-align: middle; font-weight: 900; color: #16a34a; font-size: ${fontSize};">₹${item.carValue || item.amount || item.freight || '0'}</td>
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
            line-height: 1.25;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
          }
          .outer-border {
            border: 2.5px solid #000000;
            height: calc(100vh - 6mm);
            padding: 8px 12px;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          .meta-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 2.5px solid #dc2626;
            border-bottom: 2.5px solid #dc2626;
            padding: 6px 10px;
            margin-top: 4px;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 900;
            background-color: #fef2f2;
          }
          .doc-id { color: #dc2626; font-size: 14px; font-weight: 900; }
          table.manifest-table { width: 100%; border-collapse: collapse; margin-top: 2px; table-layout: fixed; }
          table.manifest-table th { 
            border: 1.5px solid #334155;
            padding: 7px 4px;
            font-size: 11.5px;
            background-color: #0f172a !important; 
            font-weight: 900; 
            text-align: center; 
            color: #ffffff !important;
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
              <div>${docNoLabel}: <span class="doc-id">${docNoVal}</span></div>
              <div>DATE: ${data.date || data.pickupDate || data.loadingDate || '-'}</div>
              <div>TYPE: ${title}</div>
              <div>DRIVER/PARTY: <span style="text-transform: uppercase; color: #0284c7;">${data.whoPicked || data.driverName || data.partyName || '-'}</span></div>
            </div>

            <table class="manifest-table">
              <thead>
                <tr>
                  <th style="width: 4%;">SR</th>
                  <th style="width: 22%;">CAR / DESCRIPTION</th>
                  <th style="width: 14%;">CAR NO.</th>
                  <th style="width: 20%;">PARTY NAME</th>
                  <th style="width: 14%;">PHONE</th>
                  <th style="width: 13%;">ROUTE</th>
                  <th style="width: 13%;">VALUE / FREIGHT</th>
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