/**
 * Parse CCCD QR Code data
 * 
 * QR Format: 001234567890|123456789012|Nguyễn Văn A|15011990|Nam|...
 * Fields:
 * 0: CCCD number
 * 1: Old CMND number
 * 2: Full name
 * 3: Date of birth (DDMMYYYY)
 * 4: Gender
 * 5: Address
 * 6: Issue date
 */

export interface CCCDData {
  idNumber: string;
  oldIdNumber?: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD format
  gender?: string;
  address?: string;
  issueDate?: string;
}

/**
 * Parse date from CCCD format (DDMMYYYY) to ISO format (YYYY-MM-DD)
 */
function parseCCCDDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) {
    throw new Error('Invalid date format');
  }

  const day = dateStr.substring(0, 2);
  const month = dateStr.substring(2, 4);
  const year = dateStr.substring(4, 8);

  return `${year}-${month}-${day}`;
}

/**
 * Parse QR code text from CCCD
 */
export function parseCCCDQR(qrText: string): CCCDData {
  const parts = qrText.split('|');

  if (parts.length < 5) {
    throw new Error('Invalid CCCD QR code format');
  }

  const data: CCCDData = {
    idNumber: parts[0]?.trim() || '',
    oldIdNumber: parts[1]?.trim() || undefined,
    fullName: parts[2]?.trim() || '',
    dateOfBirth: parseCCCDDate(parts[3]?.trim() || ''),
    gender: parts[4]?.trim() || undefined,
    address: parts[5]?.trim() || undefined,
    issueDate: parts[6] ? parseCCCDDate(parts[6].trim()) : undefined,
  };

  // Validate required fields
  if (!data.idNumber || data.idNumber.length < 9) {
    throw new Error('Invalid ID number');
  }

  if (!data.fullName) {
    throw new Error('Missing full name');
  }

  if (!data.dateOfBirth) {
    throw new Error('Missing date of birth');
  }

  return data;
}

/**
 * Validate CCCD number format (9-12 digits)
 */
export function isValidCCCDNumber(idNumber: string): boolean {
  return /^\d{9,12}$/.test(idNumber);
}
