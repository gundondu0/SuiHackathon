"use server"
//import { jwtToAddress } from "@mysten/zklogin";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function postZkProof(ephemeralPk:string,zkSalt:string) {

    "use server";
  try {
    const nextCookies = cookies();
    const zk_token = nextCookies.get("zk_jwt");
    const randomness = nextCookies.get("randomness")
    if(!zk_token || !randomness) throw Error
 
      
      
    
    const zkSaltBody = {zkToken:zk_token,
      ephemeralPk:ephemeralPk,
      zkSalt:zkSalt,
      randomness:randomness
    }
    
    const res = await fetch(
      "http://localhost:5002/zksalt/proof",
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
    

    return (data);
  } catch (error) {
    return {};
  }
    
}

