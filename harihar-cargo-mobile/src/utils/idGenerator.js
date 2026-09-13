/**
 * Generates exact Document IDs matching PDF templates
 */
export const generateDocId = (type, count = 1) => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yy = String(today.getFullYear()).slice(-2);
  const dateStr = `${dd}${mm}${yy}`; // e.g. 280726

  const indexStr = String(count).padStart(2, '0');

  switch (type) {
    case 'pickup':
      return `HCC-PickUp-${dateStr}-${indexStr}`; // Matching HCC-PickUp-280726-01
    case 'loading':
      return `HCC-Loading-${dateStr}-${indexStr}`; // Matching HCC-Loading-280726-01
    case 'bilty':
      return `${5000 + count}`; // Matching numeric LR e.g. 5504
    case 'bill':
      return `#${7000 + count}`; // Matching Bill #7896
    default:
      return `${dateStr}-${indexStr}`;
  }
};