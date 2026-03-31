/**
 * deploy.js — One-time script to compile AnchorRegistry.sol and deploy it to Polygon Amoy.
 *
 * Run ONCE:
 *   node Backend/scripts/deploy.js
 *
 * Then copy the printed contract address into Backend/.env → ANCHOR_CONTRACT_ADDRESS=0x...
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 1. Read the Solidity source ────────────────────────────────────────────────
const contractPath = path.resolve(__dirname, '../contracts/AnchorRegistry.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// ── 2. Compile using solc ──────────────────────────────────────────────────────
console.log('⚙️  Compiling AnchorRegistry.sol ...');
const solc = require('solc');

const input = {
  language: 'Solidity',
  sources: { 'AnchorRegistry.sol': { content: source } },
  settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const errors = output.errors.filter((e) => e.severity === 'error');
  if (errors.length > 0) {
    console.error('❌ Compilation errors:', errors.map((e) => e.message).join('\n'));
    process.exit(1);
  }
}

const contract      = output.contracts['AnchorRegistry.sol']['AnchorRegistry'];
const abi           = contract.abi;
const bytecode      = contract.evm.bytecode.object;

console.log('✅ Compilation successful.');

// ── 3. Save ABI for anchorService.js to import ────────────────────────────────
const abiPath = path.resolve(__dirname, '../contracts/AnchorRegistry.abi.json');
fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
console.log(`💾 ABI saved to ${abiPath}`);

// ── 4. Deploy to Polygon Amoy ──────────────────────────────────────────────────
const { POLYGON_RPC_URL, ANCHOR_WALLET_PRIVATE_KEY } = process.env;

if (!POLYGON_RPC_URL || !ANCHOR_WALLET_PRIVATE_KEY) {
  console.error('❌ Missing POLYGON_RPC_URL or ANCHOR_WALLET_PRIVATE_KEY in .env');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
const wallet   = new ethers.Wallet(ANCHOR_WALLET_PRIVATE_KEY, provider);

console.log(`🔑 Deploying from wallet: ${wallet.address}`);

const network = await provider.getNetwork();
console.log(`🌐 Network: ${network.name} (chainId ${network.chainId})`);

const balance = await provider.getBalance(wallet.address);
console.log(`💰 Balance: ${ethers.formatEther(balance)} MATIC`);

if (balance === 0n) {
  console.error('❌ Wallet has 0 MATIC. Get free test MATIC from https://faucet.polygon.technology/ then retry.');
  process.exit(1);
}

const factory   = new ethers.ContractFactory(abi, bytecode, wallet);
console.log('🚀 Deploying contract...');
const deployed  = await factory.deploy();
console.log(`⏳ Tx sent: ${deployed.deploymentTransaction().hash}`);
await deployed.waitForDeployment();

const address = await deployed.getAddress();
console.log('\n' + '═'.repeat(60));
console.log(`✅ CONTRACT DEPLOYED SUCCESSFULLY`);
console.log(`   Address : ${address}`);
console.log(`   Network : Polygon Amoy`);
console.log(`   Explorer: https://amoy.polygonscan.com/address/${address}`);
console.log('═'.repeat(60));
console.log('\n👉 Copy this into your Backend/.env:');
console.log(`   ANCHOR_CONTRACT_ADDRESS=${address}\n`);
