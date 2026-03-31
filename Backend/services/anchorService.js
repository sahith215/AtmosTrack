/**
 * anchorService.js
 *
 * Connects to the deployed AnchorRegistry contract on Polygon Amoy and
 * provides anchorReading(mongoId, dataHash) for server.js to call
 * after every new sensor reading is saved.
 *
 * Failures are swallowed with a warning — the backend never crashes if
 * blockchain is unavailable.
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load ABI ──────────────────────────────────────────────────────────────────
const abiPath = path.resolve(__dirname, '../contracts/AnchorRegistry.abi.json');

let provider  = null;
let wallet    = null;
let contract  = null;
let ready     = false;

function init() {
  const { POLYGON_RPC_URL, ANCHOR_WALLET_PRIVATE_KEY, ANCHOR_CONTRACT_ADDRESS } = process.env;

  if (!POLYGON_RPC_URL || !ANCHOR_WALLET_PRIVATE_KEY || !ANCHOR_CONTRACT_ADDRESS) {
    console.warn('⚠️  [anchorService] Missing env vars — on-chain anchoring DISABLED. Set POLYGON_RPC_URL, ANCHOR_WALLET_PRIVATE_KEY, ANCHOR_CONTRACT_ADDRESS in .env');
    return;
  }

  if (!fs.existsSync(abiPath)) {
    console.warn('⚠️  [anchorService] ABI file not found at', abiPath, '— run: node Backend/scripts/deploy.js');
    return;
  }

  try {
    const abi  = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    provider   = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    wallet     = new ethers.Wallet(ANCHOR_WALLET_PRIVATE_KEY, provider);
    contract   = new ethers.Contract(ANCHOR_CONTRACT_ADDRESS, abi, wallet);
    ready      = true;
    console.log('⛓️  [anchorService] Connected to AnchorRegistry at', ANCHOR_CONTRACT_ADDRESS);
  } catch (err) {
    console.warn('⚠️  [anchorService] Init failed:', err.message);
  }
}

// Run on module load
init();

/**
 * Anchor a reading's SHA-256 hash on Polygon Amoy.
 *
 * @param {string} mongoId  - MongoDB ObjectId string of the Reading document
 * @param {string} dataHash - 64-char hex SHA-256 hash (no 0x prefix)
 * @returns {Promise<{txHash: string}|null>}
 */
export async function anchorReading(mongoId, dataHash) {
  if (!ready) return null;

  try {
    // Convert mongoId string → bytes32 (left-padded)
    const readingIdBytes = ethers.zeroPadBytes(
      ethers.toUtf8Bytes(mongoId.toString()),
      32
    );

    // Convert hex hash string → bytes32
    const dataHashBytes = ethers.zeroPadValue('0x' + dataHash, 32);

    console.log(`⛓️  [anchorService] Anchoring reading ${mongoId}…`);
    const tx  = await contract.anchor(readingIdBytes, dataHashBytes);
    const receipt = await tx.wait(1); // wait for 1 confirmation

    console.log(`✅ [anchorService] ANCHORED — txHash: ${receipt.hash}`);
    return { txHash: receipt.hash };
  } catch (err) {
    // "already anchored" is not an error we want to crash on
    if (err.message?.includes('already anchored')) {
      console.warn(`⚠️  [anchorService] Reading ${mongoId} already anchored on-chain.`);
      return null;
    }
    console.error('❌ [anchorService] Anchor failed:', err.message);
    return null;
  }
}

export const isReady = () => ready;
