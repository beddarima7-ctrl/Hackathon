import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
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

// @Saiem: Call this from your React frontend when the user clicks the initial button to spin up a completely new instance on the blockchain network.
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

  if (!walletIdArg || walletIdArg.length !== 64) {
    throw new Error('MN_WALLET_ID_HEX env var must be a 64-char hex string (32 bytes)');
  }

  console.log(`Deploying against RPC: ${DEVNODE_RPC_URL}`);
  console.log(`Indexer: ${INDEXER_URL}`);
}

if (import.meta.url === `file://${process.argv}`) {
  main().catch((err) => {
    console.error('Deployment failed:', err);
    process.exit(1);
  });
}
