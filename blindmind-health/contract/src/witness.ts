// witnesses.ts
// BlindMind Health — private state + witness wiring for health_commitment.compact
// Owner: Rima
//
// Witnesses run LOCALLY in the DApp. Whatever they return never leaves
// the user's machine as plaintext — only the proof and whatever the
// circuit explicitly disclose()s (the commitment hash) does.

import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';

export type HealthPrivateState = {
  readonly mood: number;       // 0-255, matches Uint<8> in the circuit
  readonly anxiety: number;
  readonly resilience: number;
  readonly salt: Uint8Array;   // 32 bytes, matches Bytes<32>
};

export const createHealthPrivateState = (
  mood: number,
  anxiety: number,
  resilience: number,
  salt: Uint8Array,
): HealthPrivateState => ({ mood, anxiety, resilience, salt });

export const witnesses = {
  localMoodScore: (
    { privateState }: WitnessContext<HealthPrivateState>,
  ): [HealthPrivateState, bigint] => [privateState, BigInt(privateState.mood)],

  localAnxietyScore: (
    { privateState }: WitnessContext<HealthPrivateState>,
  ): [HealthPrivateState, bigint] => [privateState, BigInt(privateState.anxiety)],

  localResilienceScore: (
    { privateState }: WitnessContext<HealthPrivateState>,
  ): [HealthPrivateState, bigint] => [privateState, BigInt(privateState.resilience)],

  localSalt: (
    { privateState }: WitnessContext<HealthPrivateState>,
  ): [HealthPrivateState, Uint8Array] => [privateState, privateState.salt],
};