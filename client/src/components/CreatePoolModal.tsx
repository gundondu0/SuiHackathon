"use client";

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

import { Box, Card, HStack, VStack, Text, Button } from "@chakra-ui/react";
import React from "react";
import CurrencyInput from "react-currency-input-field";
import { BsArrowLeftRight } from "react-icons/bs";
import TokenModal from "./TokenModal";
import links from "../data/links.json";
import { useState } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { ConnectButton, useWalletKit } from "@mysten/wallet-kit";
import { link } from "fs";
import { postGenerateZkSalt } from "@/services/postGenerateZkSalt";
import Cookies from "js-cookie";
import base64ToBigInt from "@/utils/base64ToBigInt";
import base64ToU8 from "@/utils/base64ToU8";
import { postZkProof } from "@/services/postZkProof";
const DECIMALS = 10 ** 9;
type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;
interface Props {
  currentAccount: any;
  userState: number;
  zkUserAddress: string;
}

const CreatePoolModal = ({
  zkUserAddress,
  userState,
  currentAccount,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const { signAndExecuteTransactionBlock } = useWalletKit();
  const onClose = () => setIsOpen(false);
  const onOpen = () => setIsOpen(true);
  const [inputValue1, setInputValue1] = useState<string>("0");
  const [inputValue2, setInputValue2] = useState<string>("0");
  const [stateText, setStateText] = useState<string>("");
  const handleInputChange1 = (value: string | undefined) => {
    if (value === undefined) {
      value = "0";
    }
    setInputValue1(value);
  };
  const handleInputChange2 = (value: string | undefined) => {
    if (value === undefined) {
      value = "0";
    }
    setInputValue2(value);
  };
  const handleCreatePool = async () => {
    if(userState===0)return;
    if (userState ==1) {
        const client = new SuiClient({ url: getFullnodeUrl('devnet') });
    const tx = new TransactionBlock();
    const token_a = (await client.getCoins({owner: currentAccount.address,coinType: links.token_a})).data;
    if(!token_a[0])return;
    const coinObjectIds = token_a.slice(1).map((token) => token.coinObjectId);
    const originalCoinAObjectId = token_a[0].coinObjectId;
    if(coinObjectIds.length>1){
        tx.mergeCoins(token_a[0].coinObjectId, coinObjectIds);
    };
    const token_b = (await client.getCoins({owner: currentAccount.address,coinType: links.token_b})).data;
    const coinObjectIds2 = token_b.slice(1).map((token) => token.coinObjectId);
    const originalCoinBObjectId = token_b[0].coinObjectId;
    if(!token_b[0])return;
    if(coinObjectIds2.length>1){
        tx.mergeCoins(token_b[0].coinObjectId, coinObjectIds2);

    }
    
    console.log(coinObjectIds);
    
    tx.moveCall({
        target: `${links.contract}::pool::create`,
        typeArguments:[links.token_a, links.token_b],
        arguments: [
            tx.object(originalCoinAObjectId),
            tx.object(originalCoinBObjectId), // convert hexadecimal string to int[]
            tx.pure.u64(parseInt(inputValue1)*DECIMALS),
            tx.pure.u64(parseInt(inputValue2)*DECIMALS),
            tx.pure.u64(parseInt(inputValue1)),
            tx.pure.u64(parseInt(inputValue2)),
            tx.pure.address(links.fee_payer),
           ],

        });
       await signAndExecuteTransactionBlock({ transactionBlock: tx });
       setStateText("Success");

    
    console.log("create pools");
        
    }else if (userState ==2) {
        
        const client = new SuiClient({ url: getFullnodeUrl('devnet') });
    const tx = new TransactionBlock();
    const token_a = (await client.getCoins({owner: zkUserAddress,coinType: links.token_a})).data;
    if(!token_a[0])return;
    const coinObjectIds = token_a.slice(1).map((token) => token.coinObjectId);
    const originalCoinAObjectId = token_a[0].coinObjectId;
    if(coinObjectIds.length>1){
        tx.mergeCoins(token_a[0].coinObjectId, coinObjectIds);
    };
    const token_b = (await client.getCoins({owner: zkUserAddress,coinType: links.token_b})).data;
    const coinObjectIds2 = token_b.slice(1).map((token) => token.coinObjectId);
    const originalCoinBObjectId = token_b[0].coinObjectId;
    if(!token_b[0])return;
    if(coinObjectIds2.length>1){
        tx.mergeCoins(token_b[0].coinObjectId, coinObjectIds2);

    }
    
    console.log(coinObjectIds);
    
    tx.moveCall({
        target: `${links.contract}::pool::create`,
        typeArguments:[links.token_a, links.token_b],
        arguments: [
            tx.object(originalCoinAObjectId),
            tx.object(originalCoinBObjectId), // convert hexadecimal string to int[]
            tx.pure.u64(parseInt(inputValue1)*DECIMALS),
            tx.pure.u64(parseInt(inputValue2)*DECIMALS),
            tx.pure.u64(parseInt(inputValue1)),
            tx.pure.u64(parseInt(inputValue2)),
            tx.pure.address(links.fee_payer),
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
        setStateText("Success");
    }
}
  return (
    <>
      <Button onClick={onOpen} w="220px" ml="320px" mr="15px">
        Create Pool
      </Button>

      <Modal isOpen={isOpen} size={"3xl"} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="mainDark">
          <ModalHeader>Create Pool</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Card bg={"main"} p="2rem">
              <VStack>
                <HStack>
                  <Box bg="white" p="8px" pl="15px" borderRadius={"md"}>
                    <CurrencyInput
                      decimalsLimit={10}
                      disableAbbreviations={true}
                      disableGroupSeparators={true}
                      decimalSeparator="."
                      groupSeparator=","
                      value={inputValue1}
                      onValueChange={(value: string | undefined) => {
                        handleInputChange1(value);
                      }}
                    />
                  </Box>
                  <Heading size={"sm"} color={"gray.300"}>
                    Token A
                  </Heading>
                  <Box alignContent={"center"}>
                    <BsArrowLeftRight fill={"#CBD5E0"} />
                  </Box>
                  <Box bg="white" p="8px" pl="15px" borderRadius={"md"}>
                    <CurrencyInput
                      decimalsLimit={10}
                      disableAbbreviations={true}
                      disableGroupSeparators={true}
                      decimalSeparator="."
                      groupSeparator=","
                      value={inputValue2}
                      onValueChange={(value: string | undefined) => {
                        handleInputChange2(value);
                      }}
                    />
                  </Box>
                  <Heading size={"sm"} color={"gray.300"}>
                    Token B
                  </Heading>
                </HStack>
              </VStack>
            </Card>
          </ModalBody>
          <ModalFooter>
            <Heading>{stateText}</Heading>
            <Button
              colorScheme="teal"
              onClick={() => {
                handleCreatePool();
              }}
              mr={3}
            >
              Create Pool
            </Button>
            <Button
              colorScheme="red"
              onClick={() => {
                setStateText("");
                onClose();
              }}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreatePoolModal;
