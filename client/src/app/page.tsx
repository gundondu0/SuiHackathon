"use client";
import React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import PoolItem from "@/components/PoolItem";
import pooldata from "@/data/poolData";
import CreatePoolModal from "@/components/CreatePoolModal";
import { Heading, Center, Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { ConnectButton, useWalletKit } from "@mysten/wallet-kit";
import { formatAddress } from "@mysten/sui.js/utils";
import {
  generateNonce,
  generateRandomness,
  getZkLoginSignature,
} from "@mysten/zklogin";
import { SuiClient } from "@mysten/sui.js/client";
import { jwtToAddress } from "@mysten/zklogin";
import { postGenerateZkSalt } from "@/services/postGenerateZkSalt";
import fetchPools, { Pool } from "@/services/fetchPools";

function base64ToBigInt(base64String: string) {
  // Decode the Base64 string to a byte array
  const binaryString = atob(base64String);
  const byteArray = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }

  // Convert the byte array to a BigInt
  const bigIntValue = BigInt(
    "0x" +
      Array.from(byteArray)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
  );
  return bigIntValue;
}
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const uint8Array = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }

  return uint8Array;
}

const HomePage: React.FC = () => {
  const { currentAccount } = useWalletKit();
  const [zkUserAddress, setZkUserAddress] = useState<string>("");
  const [zkUserBalance, setZkuserBalance] = useState<string>("0");
  const [userState, setUserState] = useState<number>(0); //0: not login, 1: walletadapter, 2: zklgon
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const maxEpoch = 10;
  const FULLNODE_URL = "https://fullnode.devnet.sui.io"; // replace with the RPC URL you want to use

  const client = new SuiClient({ url: FULLNODE_URL });
  // Cookie expires in 7 days
  const [pools, setPools] = useState<any[]>([]);
  useEffect(() => {
    const temp = async () => {
      const currPools = await fetchPools();
      setPools(currPools);
    }
    temp();
  }, [])
  useEffect(() => {
    if (Cookies.get("zk_jwt") == undefined) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
    const temp = async () => {
      const zk_jwt = Cookies.get("zk_jwt");
      if (!zk_jwt) return;

      const res = await postGenerateZkSalt();
      //@ts-ignore
      let zkSalt = res.zk_salt;

      const zksaltBigInt = base64ToBigInt(zkSalt);
      const zkLoginUserAddress = jwtToAddress(zk_jwt, zksaltBigInt);
      const coinBalance = await client.getBalance({
        owner: zkLoginUserAddress,
      });
      setUserState(2);
      setZkUserAddress(zkLoginUserAddress);
      setZkuserBalance(coinBalance.totalBalance);
    };
    temp();
  }, [zkUserAddress]);

  useEffect(() => {
    if (currentAccount) {
      setUserState(1);
    } else {
      setUserState(0);
    }
    const temp = async () => {
      console.log(currentAccount);
    };
    temp();
  }, [currentAccount]);

  const handleLogout = () => {
    Cookies.remove("zk_jwt");
    Cookies.remove("zk_salt");
    Cookies.remove("randomness");
    Cookies.remove("nonce");
    Cookies.remove("privkey");
    setZkUserAddress("");
    setUserState(0);
  };

  return (
    <Box alignContent={"flex"} w="80vw" margin="auto">
       <Center>
      <HStack mt={"4rem"} mb={"4rem"} h={"100%"} spacing={10}>
        {userState != 2 ? (
          <>
            <ConnectButton
              connectText={"Connect Wallet"}
              connectedText={`Connected: ${formatAddress(
                currentAccount ? currentAccount.address : ""
              )}`}
            />
          </>
        ) : (
          <> </>
        )}

        {userState == 0 ? <Heading>OR </Heading> : <> </>}

        {userState == 2 ? (
          <>
            <Text>Address:{zkUserAddress}</Text>
            <Text>Balance:{parseInt(zkUserBalance) / 10 ** 9} SUI</Text>
            <Button onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            {" "}
            {userState == 0 ? (
              <>
                <Button
                  colorScheme="red"
                  onClick={async () => {
                    const ephemeralKeyPair = new Ed25519Keypair();
                    let randomness = generateRandomness();
                    const nonce = generateNonce(
                      ephemeralKeyPair.getPublicKey(),
                      maxEpoch,
                      randomness
                    );

                    Cookies.set("randomness", randomness.toString());

                    Cookies.set(
                      "privkey",
                      ephemeralKeyPair.export().privateKey
                    );
                    const params = new URLSearchParams({
                      // See below for how to configure client ID and redirect URL
                      client_id:
                        "922729408934-tvnb4ps8h9kb9bgfgosj8klitc4f8rlm.apps.googleusercontent.com",

                      redirect_uri: "http://localhost:3000/auth",
                      response_type: "id_token",
                      scope: "openid",
                      // See below for details about generation of the nonce
                      nonce: nonce,
                    });

                    const loginURL = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

                    window.location.assign(loginURL);
                    return;
                  }}
                >
                  {" "}
                  Login with Gmail
                </Button>
              </>
            ) : (
              <> </>
            )}
            <Button onClick={async ()=>{
              const a = await fetchPools()
              console.log(a);
              

            }}></Button>
          </>
        )}

        
      </HStack>
    </Center>
      <HStack       bg="main"
        borderBottom="1px solid"
        p="16px"
        m="4px"
        borderLeft={"1px solid transparent"}
        borderRight={"1px solid transparent"}
        spacing="16px"
        borderTopRadius="lg">
      <Text textAlign={"center"} ml="6" mr="6" w="8rem" fontWeight="bold">
          Pool
        </Text>
        <Text textAlign={"center"}  ml="25" mr="75px" w="4rem" fontWeight="bold">
          Rate
        </Text>
        <Text textAlign={"center"}  w="4rem" fontWeight="bold">
          Volume
        </Text>
        <CreatePoolModal currentAccount={currentAccount} userState={userState} zkUserAddress={zkUserAddress}  />

      </HStack>
      {pools.map((pool:Pool) => (
        <PoolItem

          key={pool.id.id}
          userState={userState}
          zkUserAddress={zkUserAddress}
          poolId={pool.id.id}
          volatile={parseInt(pool.token_a_pool)/(10**9)}
          stable={parseInt(pool.token_b_pool)/(10**9)}
          exchange={(parseInt(pool.token_a_pool)/parseInt(pool.token_b_pool))}
          volume={"A: "+ parseInt(pool.token_a_pool)/(10**9)+" / B: "+parseInt(pool.token_b_pool)/(10**9)}
        />
      ))}
    </Box>
  );
};

export default HomePage;