// apps/web/app/lib/pennyDrop.ts

export type PennyDropInput = {
  accountNumber: string;
  ifsc: string;
  accountHolderName: string;
};

export type PennyDropResult = {
  ok: boolean;
  error?: string;
};

/**
 * Phase-1: Simulated penny-drop verification.
 *
 * For now, as long as the input looks non-empty, we treat the account
 * as "verified". This lets us demo the full flow without a real bank API.
 */
export async function simulatePennyDrop(
  input: PennyDropInput
): Promise<PennyDropResult> {
  const { accountNumber, ifsc, accountHolderName } = input;

  if (!accountNumber || !ifsc || !accountHolderName) {
    return {
      ok: false,
      error: "Missing account details (simulation). Please fill all fields.",
    };
  }

  // ✅ Always succeed in Phase-1 if fields are present
  return { ok: true };
}
