import { Transaction } from '../../src/types';

export interface PrivacyResult {
  sanitizedTransactions: Transaction[];
  piiCount: number;
}

export function runPrivacyAgent(transactions: Transaction[]): PrivacyResult {
  let piiCount = 0;

  // Masking Rules Regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const upiRegex = /[a-zA-Z0-9._%+-]+@upi/gi;
  const phoneRegex = /\b(?:\+?\d{1,3}[- ]?)?\d{10}\b/g;
  const longDigitsRegex = /\b\d{8,}\b/g;

  const sanitized = transactions.map((t) => {
    let desc = t.description;
    let original = desc;

    // Redact Emails
    const emails = desc.match(emailRegex);
    if (emails) {
      piiCount += emails.length;
      desc = desc.replace(emailRegex, '[REDACTED_EMAIL]');
    }

    // Redact UPI
    const upis = desc.match(upiRegex);
    if (upis) {
      piiCount += upis.length;
      desc = desc.replace(upiRegex, '[REDACTED_UPI]');
    }

    // Redact Phones
    const phones = desc.match(phoneRegex);
    if (phones) {
      piiCount += phones.length;
      desc = desc.replace(phoneRegex, '[REDACTED_PHONE]');
    }

    // Redact long digits (IDs, Account numbers, etc.)
    // Note: Do not redact the date, only the description.
    const numericIDs = desc.match(longDigitsRegex);
    if (numericIDs) {
      // Filter out formatted dates patterns (e.g. 2026-05-18 would be split, but regex \b\d{8,}\b only checks 8+ continuous digits without separators)
      piiCount += numericIDs.length;
      desc = desc.replace(longDigitsRegex, '[REDACTED_ID]');
    }

    return {
      ...t,
      description: desc,
      rawDescription: original, // Store original safely for comparison UI
    };
  });

  return {
    sanitizedTransactions: sanitized,
    piiCount,
  };
}
