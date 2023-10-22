"use server"
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function postGenerateZkSalt() {

    "use server";
  try {
    const nextCookies = cookies();
    const zk_token = nextCookies.get("zk_jwt");
    if(!zk_token) throw Error
    const zkSaltBody = {zkToken:zk_token}
    
    const res = await fetch(
     "http://localhost:5002/zksalt/generate",
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

