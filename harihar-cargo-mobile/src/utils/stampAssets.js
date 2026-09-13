import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

let cachedAssets = null;

export const loadAssetBase64Images = async () => {
  if (cachedAssets) return cachedAssets;

  try {
    const leftModule = require('../../assets/logo-left.png');
    const rightModule = require('../../assets/right-logo.png');
    const signModule = require('../../assets/sign.png');

    const assets = await Asset.loadAsync([leftModule, rightModule, signModule]);

    const getBase64 = async (assetObj) => {
      try {
        const uri = assetObj.localUri || assetObj.uri;
        if (!uri) return '';
        
        return await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType ? FileSystem.EncodingType.Base64 : 'base64',
        });
      } catch (e) {
        console.warn('Failed reading asset:', e);
        return '';
      }
    };

    const [leftB64, rightB64, signB64] = await Promise.all([
      getBase64(assets[0]),
      getBase64(assets[1]),
      getBase64(assets[2]),
    ]);

    cachedAssets = {
      leftLogo: leftB64 ? `data:image/png;base64,${leftB64}` : '',
      rightLogo: rightB64 ? `data:image/png;base64,${rightB64}` : '',
      sign: signB64 ? `data:image/png;base64,${signB64}` : '',
    };

    return cachedAssets;
  } catch (err) {
    console.warn('Asset loading failed:', err);
    return { leftLogo: '', rightLogo: '', sign: '' };
  }
};

export const getCompanyHeaderHtml = (assets = {}) => {
  const leftImg = assets.leftLogo
    ? `<img src="${assets.leftLogo}" style="height: 178px; width: auto; object-fit: contain;" />`
    : '';
  const rightImg = assets.rightLogo
    ? `<img src="${assets.rightLogo}" style="width: 160px; height: 130px; display: block;" />`
    : '';

  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 2px; border: none; table-layout: fixed;">
      <tr>
        <td style="width: 125px; text-align: left; vertical-align: middle; border: none; padding: 0;">
          ${leftImg}
        </td>

        <td style="text-align: center; vertical-align: middle; border: none; padding: 0 4px;">
          <div style="font-size: 12.5px; font-weight: 900; color: #dc2626; letter-spacing: 0.5px; margin-left: 42px;">SUBJECT TO NAGPUR JURISDICTION ONLY</div>
          <div style="font-size: 36px; font-weight: 900; color: #ff0000; letter-spacing: 0.8px; margin: 1px 0; font-family: Arial, sans-serif; margin-left: 50px;">
            HARIHAR CARGO CARRIERS
          </div>
          <div style="font-size: 17px; font-weight: 900; color: #dc2626; letter-spacing: 0.5px; margin-left: 45px;">FLEET OWNER & TRANSPORT CONTRACTOR</div>
          <div style="font-size: 15px; color: #4e6b93; margin-top: 2px; font-weight: 700; margin-left: 44px;">
            Plot No.19, Shivshakti Nagar, Opp Wadi Police Station, Amravati Rd Nagpur 440023
          </div>
          <div style="font-size: 15px; color: #0f172a; font-weight: 800; margin-top: 1px; margin-left: 42px;">
            Mob: <a href="tel:9372693389" style="color: #1d3a7e; text-decoration: underline;">9372693389</a>, <a href="tel:7972409656" style="color: #1e3c83; text-decoration: underline;">7972409656</a>
          </div>
          
          <div style="font-size: 15px; border: 1px solid black; width: 35%; color: #ff0000; margin-top: 10px; font-weight: 700; margin-left: 225px;">
            GST No: 27AWOPR8730N2ZI
          </div>
        </td>

        <td style="width: 160px; text-align: right; vertical-align: middle; border: none; padding: 0;">
          ${rightImg}
        </td>
      </tr>
    </table>
    <div style="border-bottom: 2.5px solid #dc2626; width: 100%; margin-bottom: 4px;"></div>
  `;
};

export const getCompanyStampHtml = (assets = {}) => {
  const signImg = assets.sign
    ? `<img src="${assets.sign}" style="position: absolute; top: 0px; left: 50%; transform: translateX(-50%); height: 58px; width: auto; opacity: 1; z-index: 1; pointer-events: none;" />`
    : '';

  return `
    <div style="float: right; width: 290px; position: relative; margin-top: 4px; font-family: Arial, sans-serif;">
      
      <div style="font-size: 13px; font-weight: 900; color: #b91c1c; text-align: center; margin-bottom: 4px;">
        FOR HARIHAR CARGO CARRIERS
      </div>

      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70px;">
        <div style="border: 2.5px solid #1d4ed8; border-radius: 6px; transform: rotate(-3deg); padding: 6px 18px; background-color: #ffffff; text-align: center; min-width: 190px; opacity: 0.7; z-index: 999;">
          <div style="font-size: 14px; font-weight: 900; color: #1d4ed8; letter-spacing: 0.5px;">HARIHAR CARGO</div>
          <div style="font-size: 13px; font-weight: 900; color: #1d4ed8; letter-spacing: 0.5px;">CARRIERS</div>
          <div style="font-size: 10px; font-weight: 900; color: #1d4ed8; margin-top: 1px;">★ ALL INDIA ★</div>
          <div style="border-top: 2px dashed #1d4ed8; margin-top: 4px; width: 100%;"></div>
        </div>

        ${signImg}
      </div>

      <div style="position: relative; margin-top: 4px;">
        <div style="position: absolute; top: 8px; left: 0; right: 0; height: 1.5px; background-color: #000000; z-index: 1;"></div>
        <div style="position: relative; z-index: 2; text-align: center;">
          <span style="background: #ffffff; padding: 0 8px; font-size: 12px; font-weight: 900; color: #000000;">Authorized Signatory</span>
        </div>
      </div>

    </div>
    <div style="clear: both;"></div>
  `;
};