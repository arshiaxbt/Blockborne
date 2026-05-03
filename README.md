# FastEVM Fighters

FastEVM Fighters is an educational Next.js game that compares EVM chain design tradeoffs through simulated battles. Results are contextual and are not financial advice or a universal chain ranking.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Privy Setup

Create a Privy app in the Privy dashboard and add the app ID to:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=
```

The app uses Privy embedded wallets with email and wallet login. No private keys are stored in the frontend, and there is no custodial server wallet.

## Deploy Contracts

Set local deploy variables in `.env.local` or your shell. Do not add deployer keys to Vercel.

```bash
DEPLOYER_PRIVATE_KEY=0x...
MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz
MEGAETH_TESTNET_RPC=
```

`DEPLOYER_PRIVATE_KEY` must include the `0x` prefix and must be the private key
for a funded testnet deployer wallet.

Deploy to Monad Testnet:

```bash
npm run deploy:monad
```

Deploy to MegaETH Testnet:

```bash
npm run deploy:megaeth
```

Copy the printed contract addresses into the public app env vars.

## Vercel Environment Variables

Set these in Vercel:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_MEGAETH_RPC=
NEXT_PUBLIC_MONAD_BATTLE_CONTRACT=
NEXT_PUBLIC_MEGAETH_BATTLE_CONTRACT=
```

Do not set these in Vercel:

```bash
DEPLOYER_PRIVATE_KEY=
MONAD_TESTNET_RPC=
MEGAETH_TESTNET_RPC=
```

Those are only for local or VPS deployment scripts.

## Onchain Recording

After a battle, logged-in users can record that specific simulated result on Monad Testnet, MegaETH Testnet, or both. The frontend uses the user's Privy embedded wallet to submit the transaction directly.

The contract stores:

- player address
- arena ID
- MegaETH loadout
- Monad loadout
- winner
- scores
- battle hash
- timestamp

The battle hash commits to the arena, loadouts, winner, scores, and seed hash. Recording a battle only proves that a user submitted that simulated result; it does not prove one chain is globally better.

## Environment Safety

Never commit `.env.local` or any file containing `DEPLOYER_PRIVATE_KEY`. Use `.env.example` as the template for required variables.

## Checks

```bash
npm run lint
npm run build
npm run hardhat:compile
```
