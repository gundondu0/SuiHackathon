"use server"
//import { jwtToAddress } from "@mysten/zklogin";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function postExecuteBlock(coinA:string,coinB:string,coinGive:string,poolId:string,userAddress:string,cooldown:number,intervalle_amount:number) {
    "use server";
  try {
    const nextCookies = cookies();
    const zk_token = nextCookies.get("zk_jwt");
    const randomness = nextCookies.get("randomness")
    if(!zk_token || !randomness) throw Error
 
      
      
    
    const zkSaltBody = {coinA:coinA,
      coinB:coinB,
      coinGive:coinGive,
      poolId:poolId,
      userAddress:userAddress,
      cooldown:cooldown,
      intervalle_amount:intervalle_amount,

    }
    
    const res = await fetch(
      "http://localhost:5002/sui/execute-block",
      {
        credentials: "include",
        cache: "no-store",
        method: "POST",
        body: JSON.stringify(zkSaltBody),
      
        headers: {
          Authorization:`Bearer ${zk_token.value}`,
          "Content-Type": "application/json", // set the content type of the request body

        },
      }
    );

    
      
    const data = await res.json();
    //const zkLoginUserAddress = jwtToAddress(zk_token.value, data.zk_salt)
    //console.log("zklogin user address -->", zkLoginUserAddress);

    return (data);
  } catch (error) {
    return {};
  }
    
}

