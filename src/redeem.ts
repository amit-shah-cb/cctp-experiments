import { JsonRpcProvider,hexlify,toBeArray,zeroPadBytes, Wallet, ContractTransaction,keccak256, AbiCoder,toUtf8Bytes,getBytes} from 'ethers'
import { Erc20__factory, MessageTransmitter__factory, TokenMessenger__factory } from './helpers/typechain';
import dotenv from 'dotenv';
import { Attestation, getAttestation } from './helpers/attestationService';
import { MessageTransmitter, ProviderUrl } from './constants';
dotenv.config();

const redeem = async (args: any[]): Promise<ContractTransaction|null>=>{
    const [fromBlockchain,toBlockchain,transactionHash] = args;
    //https://developers.circle.com/stablecoins/docs/evm-smart-contracts
    //const receiverAddress = `0x4C64C7dC4fc7ba5B89fAd3AEbC68892bFC1B67d5`;
    const messageTransmitterAddress = MessageTransmitter.get(toBlockchain)?.address as string;
    const provider = new JsonRpcProvider(ProviderUrl.get(fromBlockchain as string) as string);
   
    const receipt = await provider.getTransactionReceipt(transactionHash);
    const eventTopic = keccak256(toUtf8Bytes('MessageSent(bytes)'))
    const log = receipt?.logs.find((l) => l.topics[0] === eventTopic)
    if(!log){
        console.error('No MessageSent(bytes) log found for tx:',transactionHash);
        return null;
    }
    const messsageBytes = AbiCoder.defaultAbiCoder().decode(['bytes'], log?.data as string)  
    const messageHash = keccak256(messsageBytes[0]);
    const attestation = await getAttestation(messageHash);
    console.log('attestion status:',attestation?.status);
    if(attestation?.status === 'complete'){
        const receiveProvider =  new JsonRpcProvider(ProviderUrl.get(toBlockchain as string) as string)        
        const mt = MessageTransmitter__factory.connect(messageTransmitterAddress,receiveProvider)
        const tx = mt.receiveMessage.populateTransaction(messsageBytes[0],getBytes(attestation?.message as string))
        return tx;
    }
    return null;  
}
  
  (async()=>{
    try{
        const args = process.argv.slice(2);
        const redeemTx = await redeem.apply(undefined, [args]);

        const polygonProvider =  new JsonRpcProvider(`https://polygon-rpc.com`)        
        if(redeemTx !== null){
            const wallet = new Wallet(process.env.PRIVATE_KEY as string, polygonProvider);
            console.log("loaded wallet:",wallet.address);
            const tx = await wallet.sendTransaction(redeemTx);
            const receipt = await tx.wait();
            console.log(receipt)    
        }
        
       
        // NOTE: Deserialize it.
        //const transaction = Transaction.from(bs58.decode(base58Transaction));
        console.log(redeemTx);
    }
    catch(e){
      console.error({error:e, message:`Error while redeeming cctp`});
    }
  })()