This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Running Sends from Base to Solana

### Setup:
ensure .env is set correctly:
`PRIVATE_KEY=0x...` //Base PK Hex
`MNEMONIC=` //MNEMONIC used for sol key gen via cbw
`SOLANA_USER_ADDRESS=` //receiving address on solana 
`USER_TOKEN_ACCOUNT=` //the SOLANA_USER_ADDRESS token account for USDC 

- get the base58 decoded solana address value e.g. EpGx7gN1h1RrX4JhugKH5vxTCvNETbmrAMGF4TV7sn5h => https://appdevtools.com/base58-encoder-decoder => 0xc9fa46792e87e0a36a18b6c73108f42ead5e6a926249f67f87be6d52fb8187c6

### Terminal Run

- run: 
 ./node_modules/.bin/ts-node src/send.ts  0xc9fa46792e87e0a36a18b6c73108f42ead5e6a926249f67f87be6d52fb8187c6 Base Solana 69

- update .env `TX_HASH` with the `tx_hash` from above `depositForBurn` tx

- wait for base to finalize ~13min
- run:
 ./node_modules/.bin/ts-node src/solana/receiveMessage.ts

