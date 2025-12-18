// apps/web/app/lib/panVerify.ts

export type PanVerifyInput = {
  panNumber: string;
  fullName: string;
  dob: string; // YYYY-MM-DD (for future use)
};

export type PanVerifyResult = {
  ok: boolean;
  panMasked?: string;
  canonicalName?: string;
  error?: string;
};

/**
 * Phase-1: Simulated PAN verification.
 *
 * - Checks basic PAN format (AAAAA9999A)
 * - Uses a dummy rule to "approve" some PANs so we can test UI flow.
 * - Later we will plug in a real PAN API behind the same function signature.
 */
export async function simulatePanVerify(
  input: PanVerifyInput
): Promise<PanVerifyResult> {
  const { panNumber, fullName } = input;

  const cleanPan = panNumber.trim().toUpperCase();

  // Very basic PAN format validation
  const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  if (!pattern.test(cleanPan)) {
    return {
      ok: false,
      error: "PAN format is invalid (simulation). Please check and try again.",
    };
  }

  // Dummy rule: if 4th digit is even => pass, else fail
  const digitChar = cleanPan[5]; // 6th char (index 5), first numeric
  const digit = parseInt(digitChar, 10);

  if (!Number.isNaN(digit) && digit % 2 === 0) {
    const panMasked =
      cleanPan.slice(0, 3) + "XX" + cleanPan.slice(5, 9) + "X";

    return {
      ok: true,
      panMasked,
      canonicalName: fullName.trim(),
    };
  }

  return {
    ok: false,
    error: "PAN failed simulated verification. Try a different test PAN.",
  };
}
