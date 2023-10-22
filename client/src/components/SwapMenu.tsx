"use client";

import {
  Card,
  VStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  Button,
  FormControl,
  FormLabel,
  Text,
  Box,
} from "@chakra-ui/react";
import CurrencyInput from "react-currency-input-field";
import React, { useState } from "react";
import { BsArrowDownUp } from "react-icons/bs";

import apr from "@/data/apr";


import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Heading,
} from "@chakra-ui/react";
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { jwtToAddress,generateNonce,
    generateRandomness,
    genAddressSeed,
    getZkLoginSignature, } from '@mysten/zklogin';
import { Ed25519Keypair, Ed25519KeypairData } from "@mysten/sui.js/keypairs/ed25519";
import jwt_decode, { JwtPayload } from "jwt-decode";


import TokenModal from "./TokenModal";
import links from "../data/links.json";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { ConnectButton, useWalletKit } from "@mysten/wallet-kit"
import { link } from "fs";
import { postGenerateZkSalt } from "@/services/postGenerateZkSalt";
import Cookies from "js-cookie";
import base64ToBigInt from "@/utils/base64ToBigInt";
import base64ToU8 from "@/utils/base64ToU8";
import { postZkProof } from "@/services/postZkProof";
import { postExecuteBlock } from "@/services/postExecuteBlock";
interface SwapMenuProps {
  exchange: number;
  volatile: number;
  stable: number;
  userState: number;
  zkUserAddress: string;
  poolId: string;
}
type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;
const DECIMALS = 10**9;
const SwapMenu: React.FC<SwapMenuProps> = ({ exchange, volatile, stable ,userState, zkUserAddress,poolId}) => {
  const [inputValue1, setInputValue1] = useState<string>("0");
  const [inputValue2, setInputValue2] = useState<string>("0");
  const [stateText, setStateText] = useState<string>("");
  const [interval, setInterval] = useState<number>(1000);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [converstionToken, setConversionToken] = useState<string>(links.token_a);
  const { currentAccount } = useWalletKit();
  const [inverse, setInverse] = useState<boolean>(false);

  const [PriceImpact, setPriceImpact] = useState<number>(0.01);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.01);
  const [feesToLp, setFeesToLp] = useState<number>(0.03);

  const handleInputChange1 = (value: string | undefined) => {
    if (value === undefined) {
      value = "0";
    }
    setInputValue1(value);
    setInputValue2(String(Number(value) * exchange));
  };

  const handleInputChange2 = (value: string | undefined) => {
    if (value === undefined) {
      value = "0";
    }
    setInputValue2(value);
    setInputValue1(String(Number(value) / exchange));
  };

  const handleIntervalChange = (value: number) => {
    if (!isNaN(value)) {
      setInterval(value);
    } else {
      setInterval(0);
    }
  };
  const handleOrder = async () => {
      if (userState === 0) return;
      if (userState == 1) {
        if(!currentAccount)return;
        const client = new SuiClient({ url: getFullnodeUrl("devnet") });
        const tx = new TransactionBlock();
        const token_a = (
          await client.getCoins({
            owner: currentAccount.address,
            coinType: links.token_a,
          })
        ).data;
        if (!token_a[0]) return;
        const coinObjectIds = token_a
          .slice(1)
          .map((token) => token.coinObjectId);
        const originalCoinAObjectId = token_a[0].coinObjectId;
        if (coinObjectIds.length > 1) {
          tx.mergeCoins(token_a[0].coinObjectId, coinObjectIds);
        }
        const token_b = (
          await client.getCoins({
            owner: currentAccount.address,
            coinType: links.token_b,
          })
        ).data;
        if (!token_b[0]) return;
        const coinObjectIds2 = token_b
          .slice(1)
          .map((token) => token.coinObjectId);
        const originalCoinBObjectId = token_b[0].coinObjectId;
        if(!token_b[0])return;
          if(coinObjectIds2.length>1){
              tx.mergeCoins(token_b[0].coinObjectId, coinObjectIds2);
  
          }
          console.log(inputValue1);
          console.log(inputValue2);
          
          tx.moveCall({
            target: `${links.contract}::pool::create_order`,
            typeArguments:[links.token_a, links.token_b,converstionToken],
            arguments: [
              tx.object(poolId),
              tx.object(converstionToken===links.token_a?originalCoinBObjectId:originalCoinAObjectId), // convert hexadecimal string to int[]
              tx.pure.u64(parseInt(converstionToken===links.token_a?inputValue1:inputValue2)*DECIMALS),
              tx.pure.u64(interval),
              tx.pure.u64(Number.isNaN(((executionTime * 60 * 1000) / interval))?1:Math.floor(((executionTime * 60 * 1000) / interval)))
               ],
           });
           setStateText("Success");
           postExecuteBlock(links.token_a, links.token_b,converstionToken,poolId,currentAccount.address,interval,Number.isNaN(((executionTime * 60 * 1000) / interval))?1:Math.floor(((executionTime * 60 * 1000) / interval)));
  
  
      }else if (userState ==2){
        const client = new SuiClient({ url: getFullnodeUrl("devnet") });
        const tx = new TransactionBlock();
        const token_a = (
          await client.getCoins({
            owner: zkUserAddress,
            coinType: links.token_a,
          })
        ).data;
        if (!token_a[0]) return;
        const coinObjectIds = token_a
          .slice(1)
          .map((token) => token.coinObjectId);
        const originalCoinAObjectId = token_a[0].coinObjectId;
        if (coinObjectIds.length > 1) {
          tx.mergeCoins(token_a[0].coinObjectId, coinObjectIds);
        }
        const token_b = (
          await client.getCoins({
            owner: zkUserAddress,
            coinType: links.token_b,
          })
        ).data;
        if (!token_b[0]) return;
        const coinObjectIds2 = token_b
          .slice(1)
          .map((token) => token.coinObjectId);
        const originalCoinBObjectId = token_b[0].coinObjectId;
        if(!token_b[0])return;
          if(coinObjectIds2.length>1){
              tx.mergeCoins(token_b[0].coinObjectId, coinObjectIds2);
  
          }
       
          
          tx.moveCall({
            target: `${links.contract}::pool::create_order`,
            typeArguments:[links.token_a, links.token_b,converstionToken],
            arguments: [
                tx.object(poolId),
                tx.object(converstionToken===links.token_a?originalCoinBObjectId:originalCoinAObjectId), // convert hexadecimal string to int[]
                tx.pure.u64(parseInt(converstionToken===links.token_a?inputValue1:inputValue2)*DECIMALS),
                tx.pure.u64(interval),
                tx.pure.u64(Number.isNaN(((executionTime * 60 * 1000) / interval))?1:Math.floor(((executionTime * 60 * 1000) / interval)))
               ],
           });
        const res = await postGenerateZkSalt();
        let zkSalt = res.zk_salt
        const zk_jwt = Cookies.get("zk_jwt");
        if (!zk_jwt) return;
  
        const zksaltBigInt = base64ToBigInt(zkSalt)
  
        const zkLoginUserAddress = jwtToAddress(zk_jwt, zksaltBigInt);
        console.log(zkLoginUserAddress, "<-- user address");
  
        let ephemeralKeyPair = Ed25519Keypair.fromSecretKey(base64ToU8(Cookies.get("privkey")!))
        console.log(ephemeralKeyPair.getPublicKey().toBase64())
        const proofResponse = await postZkProof(ephemeralKeyPair.getPublicKey().toBase64(), zkSalt);
  
        const partialZkLoginSignature = proofResponse as PartialZkLoginSignature;
        tx.setSender(zkLoginUserAddress);
  
         const { bytes, signature: userSignature } = await tx.sign({
           client,
           signer: ephemeralKeyPair,
         });
  
         const decodedJwt = jwt_decode(zk_jwt) as JwtPayload;
         if (!decodedJwt.aud || !decodedJwt.sub) return
         console.log(decodedJwt);
  
         //@ts-ignore
         const addressSeed: string = genAddressSeed(zksaltBigInt, "sub", decodedJwt.sub, decodedJwt.aud).toString();
  
         const zkLoginSignature = getZkLoginSignature({
           inputs: {
             ...partialZkLoginSignature,
             addressSeed
           },
           maxEpoch: 10,
           userSignature,
         });
         await client.executeTransactionBlock({
           transactionBlock: bytes,
           signature: zkLoginSignature,
         });
         postExecuteBlock(links.token_a, links.token_b,converstionToken,poolId,zkUserAddress,interval,Number.isNaN(((executionTime * 60 * 1000) / interval))?1:Math.floor(((executionTime * 60 * 1000) / interval)));
                  setStateText("Success");
     console.log("succsess");
      }
    };


  return (
    <Card bg="main" p="2rem">
      <VStack alignItems={"center"}>
        <HStack>
          <Box bg="white" p="8px" pl="15px" borderRadius={"md"}>
            <CurrencyInput
              decimalsLimit={10}
              disableAbbreviations={true}
              disableGroupSeparators={true}
              decimalSeparator="."
              groupSeparator=","
              value={inverse ? inputValue2.toString() : inputValue1.toString()}
              onValueChange={(value: string | undefined) => {
                inverse ? handleInputChange2(value) : handleInputChange1(value);
              }}
            />
          </Box>
          <Text fontWeight="bold" color="gray.300">{inverse ? stable : volatile}</Text>
        </HStack>
        <Button
          m="4px"
          alignContent={"center"}
          onClick={() => {
            setConversionToken(converstionToken === links.token_a ? links.token_b : links.token_a)
            setInverse(!inverse);
          }}
        >
          <BsArrowDownUp />
        </Button>
        <HStack>
          <Box bg="white" p="8px" pl="15px" borderRadius={"md"}>
            <CurrencyInput
              readOnly={true}
              decimalsLimit={10}
              disableAbbreviations={true}
              disableGroupSeparators={true}
              decimalSeparator="."
              groupSeparator=","
              value={inverse ? inputValue1 : inputValue2}
            />
          </Box>
          <Text fontWeight={"bold"} color="gray.300">
            {inverse ? volatile : stable}
          </Text>
        </HStack>

        <HStack>
          <FormControl w="15rem">
            <FormLabel color="gray.300">Execution Time (minutes)</FormLabel>
            <NumberInput
              step={0.5}
              min={0}
              onChange={(value) => setExecutionTime(parseFloat(value))}
            >
              <NumberInputField bgColor={"white"} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Text color="gray.300" mt="3">
              Blocks:{" "}
              {Math.floor(
                isNaN(executionTime)
                  ? 0
                  : (executionTime * 60 * 1000) / interval
              )}
            </Text>
          </FormControl>
        </HStack>
        <Text color="gray.300" mb="3">
          Price Impact: {PriceImpact}%
          <br />
          Slippage Tolerance: {slippageTolerance}%
          <br />
          Fees to LP: {feesToLp}%
        </Text>
        
        <Text color="gray.300" fontWeight={"bold"}>Advanced Options: </Text>

        <FormControl w="15rem">
          <FormLabel color="gray.300">Block Interval (miliseconds)</FormLabel>
          <NumberInput
            step={1}
            min={1}
            value={interval}
            onChange={(value) =>
              handleIntervalChange(
                isNaN(parseFloat(value)) ? 0 : parseFloat(value)
              )
            }
          >
            <NumberInputField bgColor="white"/>
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <Button onClick={handleOrder}>Create Order</Button>
      </VStack>
    </Card>
  );
};

export default SwapMenu;
