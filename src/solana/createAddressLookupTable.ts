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
import { PublicKey, SystemProgram, Transaction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import * as spl from '@solana/spl-token';
import { CreateAtaAccountInstruction, CreateSplSendInstruction, GetSolWalletKeyPairFromMnemonic, SOLANA_USDC_ADDRESS, addAddressesToTable, createAndSendV0Tx, createLookupTable, decodeEventNonceFromMessage, getAnchorConnection, getMessages, getPrograms, getReceiveMessagePdas } from './utils';

const main = async () => {
    const [_receiverSolanaAddress] = process.argv.slice(2);

    const [provider,keypair] = await getAnchorConnection();

    //Simulate receiver key pair
    const receiverKeyPair =await  GetSolWalletKeyPairFromMnemonic(process.env.RECEIVER_MNEMONIC!);
    console.log("receiverKeyPair: ", receiverKeyPair.publicKey.toBase58());
    const receiverWallet = new anchor.Wallet(receiverKeyPair);

    const { messageTransmitterProgram, tokenMessengerMinterProgram } = getPrograms(provider);
    
    
    // Init needed variables
    const usdcAddress = new PublicKey(SOLANA_USDC_ADDRESS);
    // const userTokenAccount = new PublicKey(process.env.USER_TOKEN_ACCOUNT as string)       
    // const receiverAccount = new PublicKey(receiverSolanaAddress)
    // console.log("receiverAccount: ", receiverAccount);
    const userTokenAccount = await spl.getAssociatedTokenAddress(usdcAddress,receiverKeyPair.publicKey);
    console.log("receiverAtaAddress: ", userTokenAccount.toBase58(), "userTokenAccount: ", userTokenAccount.toBytes().toString());
    let tokenAccountExists = false;
    try {
      const t = await spl.getAccount(
        provider.connection,
        userTokenAccount,
        "confirmed",
        spl.TOKEN_PROGRAM_ID
      )
      tokenAccountExists = t.address.equals(userTokenAccount);
    } catch (e:any) {
      // If the account does not exist, add the create account instruction to the transaction
     console.log("error: ", e); 
    }
    // console.log("receiverAtaAddress: ", receiverAtaAddress);
    // const ataTx= new Transaction().add(
    //     spl.createAssociatedTokenAccountInstruction(
    //        keypair.publicKey,receiverAtaAddress,receiverAccount,usdcAddress
    //     )
    // )
    // ataTx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
    // ataTx.sign(keypair);
    // const ataResult = await provider.connection.sendRawTransaction(ataTx.serialize(), {
        
    // })
    // // const ataResult = await spl.getOrCreateAssociatedTokenAccount(provider.connection, keypair, usdcAddress,receiverAtaAddress,true);
    // console.log("ata: ", ataResult);
    // return;
    const remoteTokenAddressHex = process.env.REMOTE_TOKEN_HEX!;
    const remoteDomain = process.env.REMOTE_DOMAIN!;
    const {messages:[attestationData]} = await getMessages(process.env.TX_HASH!);
    console.log("attestationData: ", attestationData);
    
    const messageHex = attestationData.message!;
    const attestationHex = attestationData.attestation!;
    const nonce = decodeEventNonceFromMessage(messageHex);
    console.log("nonce: ", nonce);
    // Get PDAs
    const pdas = await getReceiveMessagePdas(
        {messageTransmitterProgram, tokenMessengerMinterProgram},
        usdcAddress,
        remoteTokenAddressHex,
        remoteDomain,
        nonce
    )
   
    // accountMetas list to pass to remainingAccounts
    const accountMetas: any[] = [];
    accountMetas.push({
        isSigner: false,
        isWritable: false,
        pubkey: pdas.tokenMessengerAccount.publicKey,
    });
    accountMetas.push({
        isSigner: false,
        isWritable: false,
        pubkey: pdas.remoteTokenMessengerKey.publicKey,
    });
    accountMetas.push({
        isSigner: false,
        isWritable: true,
        pubkey: pdas.tokenMinterAccount.publicKey,
    });
    accountMetas.push({
        isSigner: false,
        isWritable: true,
        pubkey: pdas.localToken.publicKey,
    });
    accountMetas.push({
        isSigner: false,
        isWritable: false,
        pubkey: pdas.tokenPair.publicKey,
    });
    accountMetas.push({
        isSigner: false,
        isWritable: true,
        pubkey: userTokenAccount,
    });
    accountMetas.push({
        isSigner: false,
        isWritable: true,
        pubkey: pdas.custodyTokenAccount.publicKey,
    });
    accountMetas.push({
        isSigner: false,
        isWritable: false,
        pubkey: spl.TOKEN_PROGRAM_ID,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: pdas.tokenMessengerEventAuthority.publicKey,
    });
    accountMetas.push({
      isSigner: false,
      isWritable: false,
      pubkey: tokenMessengerMinterProgram.programId,
    });

    // const receiveMessageTx = await messageTransmitterProgram.methods
    //     .receiveMessage({
    //         message: Buffer.from(messageHex.replace("0x", ""), "hex"),
    //         attestation: Buffer.from(attestationHex.replace("0x", ""), "hex"),
    //     })
    //     .accounts({
    //         payer: provider.wallet.publicKey,
    //         caller: provider.wallet.publicKey,
    //         authorityPda: pdas.authorityPda,
    //         messageTransmitter: pdas.messageTransmitterAccount.publicKey,
    //         usedNonces: pdas.usedNonces,
    //         receiver: tokenMessengerMinterProgram.programId,
    //         systemProgram: SystemProgram.programId,
    //     })
    //     .remainingAccounts(accountMetas)
    //     .rpc({
    //         commitment: 'processed',
    //     });

    const rInstructions = await messageTransmitterProgram.methods
        .receiveMessage({
            message: Buffer.from(messageHex.replace("0x", ""), "hex"),
            attestation: Buffer.from(attestationHex.replace("0x", ""), "hex"),
        })
        .accounts({
            payer: provider.wallet.publicKey,
            caller: provider.wallet.publicKey,
            authorityPda: pdas.authorityPda,
            messageTransmitter: pdas.messageTransmitterAccount.publicKey,
            usedNonces: pdas.usedNonces,
            receiver: tokenMessengerMinterProgram.programId,
            systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(accountMetas)
        // .preInstructions(
        //     tokenAccountExists ? []:
        // [await CreateAtaAccountInstruction(provider,keypair,SOLANA_USDC_ADDRESS,receiverKeyPair.publicKey.toBase58())])
        // .postInstructions([
        //     await CreateSplSendInstruction(provider,keypair,SOLANA_USDC_ADDRESS,receiverKeyPair.publicKey.toBase58())
        // ])
        .instruction()
        
    console.log("rInstructions:")
    const blockhash = (await provider.connection.getLatestBlockhash()).blockhash;
    const messageV0 = new TransactionMessage({
            payerKey: keypair.publicKey,
            recentBlockhash: blockhash,
            instructions: [
                await CreateAtaAccountInstruction(provider,keypair,SOLANA_USDC_ADDRESS,receiverKeyPair.publicKey.toBase58()),
                rInstructions,
                await CreateSplSendInstruction(provider,keypair,SOLANA_USDC_ADDRESS,receiverKeyPair.publicKey.toBase58())
            ],
          }).compileToV0Message();
    console.log("ATL:",messageV0.addressTableLookups);
    console.log("AccountKeys:",messageV0.getAccountKeys().staticAccountKeys.length);
    // const vtx = new VersionedTransaction(messageV0);
    // console.log("Simulating versioned transaction with instructions:");
    // console.log(await provider.connection.simulateTransaction(vtx));
    const recentSlot = await provider.connection.getSlot();

    if(!process.env.ADDRESS_LOOKUP_TABLE){
        const [lutInst,lutAddress] = await createLookupTable(keypair.publicKey,keypair.publicKey,recentSlot-1);
        await createAndSendV0Tx(provider,keypair.publicKey,[lutInst]);
        return;
    }
    const lutAddress = new PublicKey(process.env.ADDRESS_LOOKUP_TABLE!);
    const addToLutInst = await addAddressesToTable(keypair.publicKey, keypair.publicKey,lutAddress,[...messageV0.getAccountKeys().staticAccountKeys]);
    await createAndSendV0Tx(provider,keypair.publicKey,[addToLutInst]);


    //TODO: for now simulate both keys signing this tx but in production only the receiver should sign first
    //then send to BE
    // const partialSignedVtx = receiverWallet.signTransaction(vtx)
    
    
    // vtx.sign([keypair,receiverKeyPair]);
    // const resultId = provider.connection.sendRawTransaction(vtx.serialize());
    // console.log("resultId: ", resultId);
    
    // const signedVtx = VersionedTransaction.deserialize(vtx.serialize())
    // signedVtx.sign([keypair]);
    // console.log("Sending versioned transaction with instructions:", vtx.signatures);
    // const extraSignature = sign(vtx.message.serialize(), mintKey.secretKey);
    // vtx.addSignature(mintKey.publicKey, extraSignature);
    // vtx.sign([keypair]);

    // const sendAndReceive = await provider.connection.sendRawTransaction(vtx.serialize());
    // console.log(sendAndReceive);
        
    //TODO: make this 3 instructions
    /*
    //Create ATA for receiver
    spl.createAssociatedTokenAccountInstruction(
           keypair.publicKey,receiverAtaAddress,receiverAccount,usdcAddress
        )
    //receiveMessage

    //send spl-token from receiver=>payer
    */
    
    // console.log("\n\nreceiveMessage Tx: ", receiveMessageTx);
}

main();
