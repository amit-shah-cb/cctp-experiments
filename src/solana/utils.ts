/*
 * Copyright (c) 2024, Circle Internet Financial LTD All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import 'dotenv/config';
import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { hexlify } from 'ethers';
import axios from 'axios';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';

import { MessageTransmitter } from './target/types/message_transmitter';
import { TokenMessengerMinter } from './target/types/token_messenger_minter';
import * as bip39 from "bip39"
import * as ed25519 from "ed25519-hd-key"
import * as MessageTransmitterIDL  from './target/idl/message_transmitter.json';
import * as TokenMessengerMinterIDL  from './target/idl/token_messenger_minter.json';


export const SOLANA_SRC_DOMAIN_ID = 5;
export const SOLANA_USDC_ADDRESS = process.env.SOLANA_USDC_ADDRESS ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export interface FindProgramAddressResponse {
  publicKey: anchor.web3.PublicKey;
  bump: number;
}

// Configure client to use the provider and return it.
// Must set ANCHOR_WALLET (solana keypair path) and ANCHOR_PROVIDER_URL (node URL) env vars
export const getAnchorConnection = async () => {
  const connection = new Connection(process.env.SOLANA_PROVIDER_URL!, 'confirmed');
  const keypair =  await GetSolWalletKeyPairFromMnemonic(process.env.MNEMONIC!);
  // const keypair = Keypair.generate();
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      {
        preflightCommitment:'confirmed'
      },
  );
  console.log("loaded wallet:",wallet.publicKey.toBase58());
  return provider;
    
};

export const getPrograms = (provider: anchor.AnchorProvider) => {
  // Initialize contracts
  
  const messageTransmitterProgram = new anchor.Program(JSON.parse(JSON.stringify(MessageTransmitterIDL)),
  `CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd`,
  provider) as anchor.Program<MessageTransmitter>;
  const tokenMessengerMinterProgram = new anchor.Program(JSON.parse(JSON.stringify(TokenMessengerMinterIDL)),
  `CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3`, 
  provider) as anchor.Program<TokenMessengerMinter>;
  return { messageTransmitterProgram, tokenMessengerMinterProgram };
}

export const getDepositForBurnPdas = (
    {messageTransmitterProgram, tokenMessengerMinterProgram}: ReturnType<typeof getPrograms>,
    usdcAddress: PublicKey,
    destinationDomain: number
) => {
    const messageTransmitterAccount = findProgramAddress("message_transmitter", messageTransmitterProgram.programId);
    const tokenMessengerAccount = findProgramAddress("token_messenger", tokenMessengerMinterProgram.programId);
    const tokenMinterAccount = findProgramAddress("token_minter", tokenMessengerMinterProgram.programId);
    const localToken = findProgramAddress("local_token", tokenMessengerMinterProgram.programId, [usdcAddress]);
    const remoteTokenMessengerKey = findProgramAddress("remote_token_messenger", tokenMessengerMinterProgram.programId, [
        destinationDomain.toString(),
    ]);
    const authorityPda = findProgramAddress("sender_authority", tokenMessengerMinterProgram.programId);

    return {
        messageTransmitterAccount,
        tokenMessengerAccount,
        tokenMinterAccount,
        localToken,
        remoteTokenMessengerKey,
        authorityPda
    }
}

export const getReceiveMessagePdas = async (
    {messageTransmitterProgram, tokenMessengerMinterProgram}: ReturnType<typeof getPrograms>,
    solUsdcAddress: PublicKey,
    remoteUsdcAddressHex: string,
    remoteDomain: string,
    nonce: string
) => {
  const tokenMessengerAccount = findProgramAddress("token_messenger", tokenMessengerMinterProgram.programId);
  const messageTransmitterAccount = findProgramAddress("message_transmitter", messageTransmitterProgram.programId);
  const tokenMinterAccount = findProgramAddress("token_minter", tokenMessengerMinterProgram.programId);
  const localToken = findProgramAddress("local_token", tokenMessengerMinterProgram.programId, [solUsdcAddress]);
  const remoteTokenMessengerKey = findProgramAddress("remote_token_messenger", tokenMessengerMinterProgram.programId, [remoteDomain]);
  const remoteTokenKey = new PublicKey(hexToBytes(remoteUsdcAddressHex));
  const tokenPair = findProgramAddress("token_pair", tokenMessengerMinterProgram.programId, [
      remoteDomain,
      remoteTokenKey,
  ]);
  const custodyTokenAccount = findProgramAddress("custody", tokenMessengerMinterProgram.programId, [
      solUsdcAddress,
  ]);
  const authorityPda = findProgramAddress(
      "message_transmitter_authority",
      messageTransmitterProgram.programId,
      [tokenMessengerMinterProgram.programId]
  ).publicKey;
  const tokenMessengerEventAuthority = findProgramAddress("__event_authority", tokenMessengerMinterProgram.programId);
  console.log("simulating");
  
  const i = await messageTransmitterProgram.methods
  .getNoncePda({
    nonce: new anchor.BN(nonce), 
    sourceDomain: Number(remoteDomain)
  })
  .accounts({
    messageTransmitter: messageTransmitterAccount.publicKey,
  }) 
  .instruction();
  console.log("instructions", i);
  const tx =  new Transaction();
  tx.add(i);
  tx.feePayer= (new PublicKey(process.env.SOLANA_USER_ADDRESS!));
  const simR = await messageTransmitterProgram.provider.connection.simulateTransaction(
  tx,
  );
  console.log("Sim", simR);
  const usedNonces  = new PublicKey(anchor.utils.bytes.base64.decode(simR.value.returnData?.data[0] as string));
  // const usedNonces = await messageTransmitterProgram.methods
  // .getNoncePda({
  //   nonce: new anchor.BN(nonce), 
  //   sourceDomain: Number(remoteDomain)
  // })
  // .accounts({
  //   messageTransmitter: messageTransmitterAccount.publicKey,
  // }) 
  // .view({

  // });

  console.log("usedNonces", usedNonces);

  return {
      messageTransmitterAccount,
      tokenMessengerAccount,
      tokenMinterAccount,
      localToken,
      remoteTokenMessengerKey,
      remoteTokenKey,
      tokenPair,
      custodyTokenAccount,
      authorityPda,
      tokenMessengerEventAuthority,
      usedNonces
  }
}

export const solanaAddressToHex = (solanaAddress: string): string =>
  hexlify(bs58.decode(solanaAddress));

export const evmAddressToSolana = (evmAddress: string): string =>
  bs58.encode(hexToBytes(evmAddress));

export const evmAddressToBytes32 = (address: string): string => `0x000000000000000000000000${address.replace("0x", "")}`;

export const hexToBytes = (hex: string): Buffer => Buffer.from(hex.replace("0x", ""), "hex");

// Convenience wrapper for PublicKey.findProgramAddressSync
export const findProgramAddress = (
  label: string,
  programId: PublicKey,
  extraSeeds: (string | number[] | Buffer | PublicKey )[] = []
): FindProgramAddressResponse => {
  const seeds = [Buffer.from(anchor.utils.bytes.utf8.encode(label))];
  if (extraSeeds) {
    for (const extraSeed of extraSeeds) {
      if (typeof extraSeed === "string") {
        seeds.push(Buffer.from(anchor.utils.bytes.utf8.encode(extraSeed)));
      } else if (Array.isArray(extraSeed)) {
        seeds.push(Buffer.from(extraSeed as number[]));
      } else if (Buffer.isBuffer(extraSeed)) {
        seeds.push(extraSeed);
      } else {
        seeds.push(extraSeed.toBuffer());
      }
    }
  }
  const res = PublicKey.findProgramAddressSync(seeds, programId);
  return { publicKey: res[0], bump: res[1] };
};

// Fetches attestation from attestation service given the txHash
export const getMessages = async (txHash: string) => {
    console.log("Fetching messages for tx...", txHash);
    let attestationResponse: any = {};
    //while(attestationResponse.error || !attestationResponse.messages || attestationResponse.messages?.[0]?.attestation === 'PENDING') {
        const response = await axios.get(`https://iris-api.circle.com/messages/6/${txHash}`);
        attestationResponse = await response.data;
        // Wait 2 seconds to avoid getting rate limited
        if (attestationResponse.error || !attestationResponse.messages || attestationResponse.messages?.[0]?.attestation === 'PENDING') {
          throw new Error("Attestation is still pending");  
          //await new Promise(r => setTimeout(r, 2000))
        }
    //}

    return attestationResponse; 
}

export const decodeEventNonceFromMessage = (messageHex: string): string => {
    const nonceIndex = 12;
    const nonceBytesLength = 8;    
    const message = hexToBytes(messageHex);
    const eventNonceBytes = message.subarray(nonceIndex, nonceIndex + nonceBytesLength);
    const eventNonceHex = hexlify(eventNonceBytes);
    return BigInt(eventNonceHex).toString();
};

function solanaAddressDerivationPath(index: bigint): string {
  return `m/44'/501'/${index}'/0'`
}

export async function GetSolWalletKeyPairFromMnemonic(
  mnemonic: string,
  passphrase?: string | undefined
):Promise<Keypair> {
  const seed: Buffer = await bip39.mnemonicToSeed(mnemonic, passphrase)
  const derivedSeed = ed25519.derivePath(
    solanaAddressDerivationPath(BigInt(0)),
    seed.toString("hex")
  ).key
  const keypair = Keypair.fromSeed(derivedSeed)

  return keypair
}