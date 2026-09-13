import { getCompanyHeaderHtml, getCompanyStampHtml, loadAssetBase64Images } from '../utils/stampAssets';

export const generatePickupHtml = async (data) => {
  let assets = { leftLogo: '', rightLogo: '', sign: '' };
  try {
    assets = await loadAssetBase64Images();
  } catch (e) {
    console.warn('Asset loading fallback:', e);
  }

  const carsList = Array.isArray(data.cars) && data.cars.length > 0
    ? data.cars
    : Array.isArray(data.vehicles) && data.vehicles.length > 0
    ? data.vehicles
    : [{
        carName: data.carName || '-',
        carNumber: data.carNumber || data.carNo || '-',
        partyName: data.partyName || '-',
        partyNumber: data.partyNumber || data.partyNo || '-',
        carValue: data.carValue || data.value || '0',
        fromLocation: data.fromLocation || 'NAGPUR',
        toLocation: data.toLocation || '-',
        packerName: data.packerName || 'Harihar Cargo'
      }];

  // Dynamic row padding based on batch count so large fonts fit perfectly on 1 page
  const cellPadding = carsList.length > 4 ? '5px 4px' : '8px 6px';
  const fontSize = carsList.length > 4 ? '11px' : '12px';

  const tableRowsHtml = carsList.map((car, idx) => {
    const rawPhone = car.partyNumber || car.partyNo || '';
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
    
    // Explicit HTML tel: link for 1-tap dialer execution
    const phoneHtml = cleanPhone
      ? `<a href="tel:${cleanPhone}" style="color: #0284c7; text-decoration: underline; font-weight: 800; font-size: ${fontSize};">${rawPhone}</a>`
      : '-';

    return `
      <tr style="text-align: center;">
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; font-weight: 900; width: 4%; vertical-align: middle;">${idx + 1}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; font-weight: 900; text-align: left; width: 20%; word-break: break-word; vertical-align: middle; color: #0f172a; font-size: ${fontSize};">${car.carName || '-'}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; font-weight: 900; width: 14%; word-break: break-all; vertical-align: middle; color: #dc2626; font-size: ${fontSize};">${car.carNumber || car.carNo || '-'}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; font-weight: 800; text-align: left; width: 18%; word-break: break-word; vertical-align: middle; color: #0f172a; font-size: ${fontSize};">${car.partyName || '-'}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; width: 12%; word-break: break-all; vertical-align: middle;">${phoneHtml}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; font-weight: 900; text-align: right; width: 10%; vertical-align: middle; color: #16a34a; font-size: ${fontSize};">₹${car.carValue || car.value || '0'}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; width: 8%; word-break: break-word; vertical-align: middle; font-weight: 800; font-size: ${fontSize};">${car.fromLocation || 'NAGPUR'}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; width: 8%; word-break: break-word; vertical-align: middle; font-weight: 800; font-size: ${fontSize};">${car.toLocation || '-'}</td>
        <td style="border: 1.5px solid #334155; padding: ${cellPadding}; width: 6%; word-break: break-word; vertical-align: middle; font-weight: 800; font-size: ${fontSize};">${car.packerName || 'Harihar Cargo'}</td>
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
          * { 
            box-sizing: border-box;
            -webkit-user-select: text !important;
            user-select: text !important;
          }
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
          .pickup-no { color: #dc2626; font-size: 14px; font-weight: 900; }
          
          table.manifest-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 2px;
            table-layout: fixed;
          }
          table.manifest-table th { 
            border: 1.5px solid #334155;
            padding: 7px 4px;
            font-size: 11.5px;
            background-color: #0f172a !important; 
            font-weight: 900; 
            text-align: center; 
            color: #ffffff !important;
            letter-spacing: 0.5px;
          }

          .content-body { flex: 1; }
          
          .stamp-container {
            margin-top: auto;
            width: 100%;
            display: flex;
            justify-content: flex-end;
          }
        </style>
      </head>
      <body>
        <div class="outer-border">
          
          <div class="content-body">
            ${getCompanyHeaderHtml(assets)}

            <div class="meta-bar">
              <div>PICKUP ID: <span class="pickup-no">${data.pickupId || data.pickupNo || 'HCC-PickUp-01'}</span></div>
              <div>DATE: ${data.pickupDate || data.date || '-'}</div>
              <div>TOTAL CARS = ${carsList.length}</div>
              <div>WHO PICKED: <span style="text-transform: uppercase; color: #0284c7;">${data.whoPicked || '-'}</span></div>
            </div>

            <table class="manifest-table">
              <thead>
                <tr>
                  <th style="width: 4%;">SR</th>
                  <th style="width: 20%;">CAR NAME</th>
                  <th style="width: 14%;">CAR NO.</th>
                  <th style="width: 18%;">PARTY NAME</th>
                  <th style="width: 12%;">PARTY NO.</th>
                  <th style="width: 10%;">VALUE (₹)</th>
                  <th style="width: 8%;">FROM</th>
                  <th style="width: 8%;">TO</th>
                  <th style="width: 6%;">PACKER</th>
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