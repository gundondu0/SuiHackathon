"use client"

import Cookies from "js-cookie";
import { redirect, useParams, usePathname,useRouter,useSelectedLayoutSegments } from 'next/navigation'
import { useEffect, useState } from "react";

const App =  async () => {
  
 
 useEffect(()=>{
    let hash =  window.location.hash;
  hash = hash.split("&")[0].split("=")[1];
  Cookies.set('zk_jwt', hash, { expires: 24 }); 
    redirect("/")
 },[])
 

  return (
    
    <>Loading...</>
      
  )
}

export default App;

