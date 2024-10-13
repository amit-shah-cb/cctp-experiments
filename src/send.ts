import { JsonRpcProvider,hexlify,getBytes,zeroPadBytes, Wallet, ContractTransaction} from 'ethers'
import { Erc20__factory, TokenMessenger__factory } from './helpers/typechain';
import dotenv from 'dotenv';
import { Domains, ProviderUrl, TokenMessenger, UsdcErc20 } from './constants';
dotenv.config();

const generateOrderLimit = async (args: any): Promise<ContractTransaction[]>=>{
    console.log("args:",args);
    const [senderAddress, receiverAddress,fromBlockchain,toBlockchain,amountStr] = args;
    const amount = BigInt(amountStr);
    
    //https://developers.circle.com/stablecoins/docs/evm-smart-contracts
    //const receiverAddress = `0x4C64C7dC4fc7ba5B89fAd3AEbC68892bFC1B67d5`;
    const txs = [];
    const messageContractAddress = TokenMessenger.get(fromBlockchain as string)?.address as string;
    const usdcContractAddress = UsdcErc20.get(fromBlockchain as string)?.address as string;
    const destinationDomain = Domains.get(toBlockchain as string) as number;
    const provider =  new JsonRpcProvider(ProviderUrl.get(fromBlockchain as string) as string);
    const erc20 = Erc20__factory.connect(usdcContractAddress, provider);    
    const allowance = await erc20.allowance(senderAddress, messageContractAddress)
    console.log(allowance);
    if(allowance < amount){
        txs.push(await erc20.approve.populateTransaction(messageContractAddress,amount));
    }

    const tm = TokenMessenger__factory.connect(messageContractAddress, provider)
    txs.push(await tm.depositForBurn.populateTransaction(amount,destinationDomain,zeroPadBytes(getBytes(receiverAddress as string),32),usdcContractAddress));
    return txs;
  }
  
  (async()=>{
    try{
        const args = process.argv.slice(2);
        const provider =  new JsonRpcProvider(`https://mainnet.base.org`)
        
        const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider);
        console.log("loaded wallet:",wallet.address);
        
        const depositForBurnTxs = await generateOrderLimit.apply(undefined, [[wallet.address, ...args]]);
       
        for(let i=0;i<depositForBurnTxs.length;i++){
             const tx = await wallet.sendTransaction(depositForBurnTxs[i]);
            const receipt = await tx.wait();
            console.log(receipt)
        }
        console.log(depositForBurnTxs);
    }
    catch(e){
      console.error({error:e, message:`Error depositing cctp send`});
    }
  })()