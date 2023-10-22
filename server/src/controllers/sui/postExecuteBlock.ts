import { Response, Request } from "express";
import { Ed25519Keypair, Ed25519KeypairData } from "@mysten/sui.js/keypairs/ed25519";
import { hexToU8 } from "@utils/hexToU8";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { hexToU8a } from '@polkadot/util';

export const postExecuteBlock = async (req: Request, res: Response) => {
    try {
        const keypair =  Ed25519Keypair.fromSecretKey(hexToU8(process.env.FEE_PAYER_PRIV));
        console.log(keypair.getPublicKey().toSuiAddress());
        
        const {coinA,coinB,coinGive,poolId,userAddress,intervalle_amount,cooldown} = req.body;
        console.log(coinA,coinB,coinGive,poolId,userAddress,intervalle_amount,cooldown);
        
        let count = 0;
        const intervalId = setInterval(async () => {
            try {
                const client = new SuiClient({
                    url: getFullnodeUrl('devnet'),
                });
                console.log("bura geldim");
                
                const tx = new TransactionBlock();
                tx.moveCall({
                    target: `${process.env.CONTRACT}::pool::next_swap`,
                    typeArguments:[coinA,coinB,coinGive],
                    arguments: [
                        tx.object(process.env.CAP_OBJECT),
                        tx.object(poolId),
                        tx.pure.address(userAddress),
                    ],
                });
                console.log("bura geldim2");

                // const response = await fetch('https://api.drand.sh/8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce/public/latest');
                //         const data = await response.json();
                //         console.log(data);
                                            
                //             tx.moveCall({
                //                 target:`${process.env.TOKEN_CONTRACT}::utility_token::mint`,
                //                 arguments:[
                //                     tx.object(process.env.TREASURY_CAP),
                //                     tx.pure.address(userAddress),
                //                     tx.pure.u64(data.round),
                //                     tx.pure(Array.from(hexToU8a(data.signature))), // convert hexadecimal string to int[]
                //                     tx.pure(Array.from(hexToU8a(data.previous_signature))), // convert hexadecimal string to int[]
                //                     tx.pure.u64(100)
                //                 ]
                //             })
                      
                console.log("sona geldmi");
                
                await client.signAndExecuteTransactionBlock({
                    signer: keypair,
                    transactionBlock: tx,
                });
                console.log(count);
                
                count++;
                if (count === intervalle_amount) {
                    clearInterval(intervalId);
                    res.status(200).send({ message: "Success" });
                }
            } catch (error) {
                console.log(error);
                clearInterval(intervalId);
                res.status(400).send({ permission: false, message: error.message });
            }
        }, cooldown);
    } catch (error) {
        console.log(error);
        res.status(400).send({ permission: false, message: error.message })
    }
}

