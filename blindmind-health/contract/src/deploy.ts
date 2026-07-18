import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
// PLS READ THE COMMENTS
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { witnesses, createBlindMindPrivateState } from './witness.js';

// Import our compiled contract artifact configurations directly
import * as contractArtifacts from '../managed/main/contract/index.js';

const DEVNODE_RPC_URL = process.env.MN_DEVNODE_RPC ?? 'http://localhost:9944';
const INDEXER_URL = process.env.MN_INDEXER_URL ?? 'http://localhost:8088/api/v1/graphql';
const PROOF_SERVER_URL = process.env.MN_PROOF_SERVER_URL ?? 'http://localhost:6300';

type BlindMindContractProviders = MidnightProviders<'evaluate_health_score' | 'registerHealthAnchor'>;

export type DeployResult = {
  contractAddress: string;
  txHash: string;
};

function hexToBytes32(hex: string): Uint8Array {
  if (hex.length !== 64) {
    throw new Error(`expected 64 hex chars (32 bytes), got ${hex.length}`);
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Saiem call this from your react frontend when the user clicks the initial button to spin up a completely new instance on the blockchain network.
// You need to pass the provider object (wallet connection context), the user's wallet public key buffer, and the score array from Rima's AI.
export async function deployBlindMindContract(
  providers: BlindMindContractProviders,
  walletId: Uint8Array,
  initialWellnessScore: number
): Promise<DeployResult> {
  const initialPrivateState = createBlindMindPrivateState(walletId, initialWellnessScore);

  // Match the strict v4 deploy specification structure
  const deployed = await deployContract(providers as any, {
    contractArtifacts,
    witnesses,
    initialPrivateState,
    privateStateId: 'blindMindHealthPrivateState'
  } as any);

  const contractAddress = (deployed as any).deployTxData.public.contractAddress;
  const txHash = (deployed as any).deployTxData.public.txId;

  console.log('BlindMind Health contract deployed successfully.');
  console.log(`Contract address: ${contractAddress}`);
  console.log(`Deployment tx hash: ${txHash}`);
  console.log(`Devnode RPC: ${DEVNODE_RPC_URL}`);
  console.log(`Proof server: ${PROOF_SERVER_URL}`);

  return { contractAddress, txHash };
}

// saiem use this endpoint if you are rendering an existing screen where the app is already tracking a live deployed contract,
// and you just want to tie a returning user's local workspace state back into the active interface view.
export async function joinBlindMindContract(
  providers: BlindMindContractProviders,
  contractAddress: string,
  walletId: Uint8Array,
  wellnessScore: number
) {
  const initialPrivateState = createBlindMindPrivateState(walletId, wellnessScore);

  const joined = await findDeployedContract(providers as any, {
    contractAddress,
    contractArtifacts,
    witnesses,
    privateStateId: 'blindMindHealthPrivateState',
    initialPrivateState
  } as any);

  console.log(`Joined existing BlindMind Health contract at ${contractAddress}`);
  return joined;
}

async function main() {
  const walletIdArg = process.env.MN_WALLET_ID_HEX;
  const scoreArg = process.env.MN_INITIAL_SCORE;
  const modeArg = process.env.MN_MODE ?? 'deploy'; // 'deploy' or 'join'
  const contractAddressArg = process.env.MN_CONTRACT_ADDRESS;

  if (!walletIdArg || walletIdArg.length !== 64) {
    throw new Error('MN_WALLET_ID_HEX env var must be a 64-char hex string (32 bytes)');
  }

  const walletId = hexToBytes32(walletIdArg);
  const initialScore = scoreArg ? parseInt(scoreArg, 10) : 0;

  console.log(`Deploying against RPC: ${DEVNODE_RPC_URL}`);
  console.log(`Indexer: ${INDEXER_URL}`);
  console.log(`Proof server: ${PROOF_SERVER_URL}`);

  // NOTE: providers must be constructed via your environment's provider
  // factory (wallet, proof, indexer, node) before this will run for real.
  // This throws intentionally until that wiring lands — replace the line
  // below once the provider factory exists.
  throw new Error(
    'providers factory not wired yet — construct wallet/proof/indexer/node providers before calling deployBlindMindContract'
  );

  // Once providers exist, uncomment:
  // if (modeArg === 'join' && contractAddressArg) {
  //   await joinBlindMindContract(providers, contractAddressArg, walletId, initialScore);
  // } else {
  //   await deployBlindMindContract(providers, walletId, initialScore);
  // }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Deployment failed:', err);
    process.exit(1);
  });
}
