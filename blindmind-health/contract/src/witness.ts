import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from '../managed/main/contract/index.js';

export type BlindMindPrivateState = {
  readonly walletId: Uint8Array;
  readonly wellnessScore: number;
};

export const createBlindMindPrivateState = (
  walletId: Uint8Array,
  wellnessScore: number
): BlindMindPrivateState => {
  if (walletId.length !== 32) {
    throw new Error('walletId must be exactly 32 bytes');
  }
  if (!Number.isInteger(wellnessScore) || wellnessScore < 0 || wellnessScore > 100) {
    throw new Error('wellnessScore must be an integer between 0 and 100');
  }
  return { walletId, wellnessScore };
};

export const witnesses = {
  localWalletId(
    context: WitnessContext<Ledger, BlindMindPrivateState>
  ): [BlindMindPrivateState, Uint8Array] {
    return [context.privateState, context.privateState.walletId];
  },

  localWellnessScore(
    context: WitnessContext<Ledger, BlindMindPrivateState>
  ): [BlindMindPrivateState, bigint] {
    return [context.privateState, BigInt(context.privateState.wellnessScore)];
  }
};