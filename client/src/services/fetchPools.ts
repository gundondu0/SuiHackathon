import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import links from "../data/links.json";

export interface Pool {
    id:{id:string},
    lp_addresses:[string],
    token_a_pool:string,
    token_b_pool:string,
}

export default async function fetchPools() {
    const client = new SuiClient({
        url: getFullnodeUrl('devnet'),
    });
    let finalArray:Pool[] = [];

    const promises = links.current_pools.map(async (element:string) => {
        const txn = await client.getObject({
            id: element,
            // fetch the object content field
            options: { showContent: true },
        });
        //@ts-ignore
        finalArray.push((txn.data?.content.fields) as Pool);
    });

    await Promise.all(promises);
    
    return finalArray;
}