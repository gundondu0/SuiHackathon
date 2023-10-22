"use client";
import {
  Card,
  HStack,
  VStack,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Text,
  Box,
  SliderMark,
  Slider,
  Button,
  SliderThumb,
  SliderTrack,
} from "@chakra-ui/react";
import CurrencyInput from "react-currency-input-field";
import apr from "@/data/apr";
import React, { useState } from "react";
import { BsArrowLeftRight } from "react-icons/bs";

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
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import {
  jwtToAddress,
  generateNonce,
  generateRandomness,
  genAddressSeed,
  getZkLoginSignature,
} from "@mysten/zklogin";
import {
  Ed25519Keypair,
  Ed25519KeypairData,
} from "@mysten/sui.js/keypairs/ed25519";
import jwt_decode, { JwtPayload } from "jwt-decode";

import TokenModal from "./TokenModal";
import links from "../data/links.json";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { ConnectButton, useWalletKit } from "@mysten/wallet-kit";
import { link } from "fs";
import { postGenerateZkSalt } from "@/services/postGenerateZkSalt";
import Cookies from "js-cookie";
import base64ToBigInt from "@/utils/base64ToBigInt";
import base64ToU8 from "@/utils/base64ToU8";
import { postZkProof } from "@/services/postZkProof";
interface LiquidityMenuProps {
  exchange: number;
  volatile: number;
  stable: number;
  zkUserAddress: string;
  userState: number;
  poolId: string;
}
type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;
const LiquidityMenu: React.FC<LiquidityMenuProps> = ({
  exchange,
  volatile,
  stable,
  zkUserAddress,
  userState,
  poolId,
}) => {
  const DECIMALS = 10 ** 9;
  const [stateText, setStateText] = useState<string>("");
  const [inputValue1, setInputValue1] = useState<string>("0");
  const [inputValue2, setInputValue2] = useState<string>("0");
  const { currentAccount, signAndExecuteTransactionBlock } = useWalletKit();
  const [pointOne, setPointOne] = useState<string>(
    String(exchange - exchange / 10)
  );
  const [pointTwo, setPointTwo] = useState<string>(
    String(exchange + exchange / 10)
  );

  const handleInputChange1 = (value: string | undefined) => {
    if (value === undefined) {
      value = "0";
    }
    setInputValue1(value);
    setInputValue2(String(Number(value) / exchange));
  };
  const handleInputChange2 = (value: string | undefined) => {
    if (value === undefined) {
      value = "0";
    }
    setInputValue2(value);
    setInputValue1(String(Number(value) * exchange));
  };
  const handlePointOneChange = (value: string | undefined) => {
    if (value === undefined) {
      value = "0";
    }
    setPointOne(value);
  };
  const handlePointTwoChange = (value: string | undefined) => {
    if (value === undefined) {
      value = "0";
    }
    setPointTwo(value);
  };
  const handleAddLiqudity = async () => {
    if (userState === 0) return;
    if (userState == 1) {
      if (!currentAccount) return;
      const client = new SuiClient({ url: getFullnodeUrl("devnet") });
      const tx = new TransactionBlock();
      const token_a = (
        await client.getCoins({
          owner: currentAccount.address,
          coinType: links.token_a,
        })
      ).data;
      if (!token_a[0]) return;
      const coinObjectIds = token_a.slice(1).map((token) => token.coinObjectId);
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
          target: `${links.contract}::pool::add_liqudity`,
          typeArguments:[links.token_a, links.token_b],
          arguments: [
              tx.object(poolId),
              tx.object(originalCoinAObjectId),
              tx.object(originalCoinBObjectId), // convert hexadecimal string to int[]
              tx.pure.u64(parseInt(inputValue1)*DECIMALS),
              tx.pure.u64(parseInt(inputValue2)*DECIMALS),
             ],
         });
         await signAndExecuteTransactionBlock({ transactionBlock: tx });
         setStateText("Success");


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
        console.log(inputValue1);
        console.log(inputValue2);
        
        tx.moveCall({
          target: `${links.contract}::pool::add_liqudity`,
          typeArguments:[links.token_a, links.token_b],
          arguments: [
              tx.object(poolId),
              tx.object(originalCoinAObjectId),
              tx.object(originalCoinBObjectId), // convert hexadecimal string to int[]
              tx.pure.u64(parseInt(inputValue1)*DECIMALS),
              tx.pure.u64(parseInt(inputValue2)*DECIMALS),
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
   console.log("succsess");
    }
  };

  return (
    <Card p="2rem" bg={"main"}>
      <VStack>
        <HStack alignItems={"flex-end"}>
          <VStack>
            <Text fontWeight="bold" color={"gray.300"}>
              Token A: {volatile}
            </Text>
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
          </VStack>
          <Box alignContent={"center"} mb="12px" mr="1rem" ml="1rem">
            <BsArrowLeftRight fill="#CBD5E0" />
          </Box>
          <VStack>
            <Text fontWeight={"bold"} color={"gray.300"}>
              Token B: {stable}
            </Text>
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
          </VStack>
        </HStack>

        <HStack align="flex" mt="2rem" spacing={"4rem"}>
          <VStack m="auto">
            <Text fontWeight={"bold"} color={"gray.300"}>
              Interval Start
            </Text>
            <Box bg="white" p="8px" pl="15px" borderRadius={"md"}>
              <CurrencyInput
                decimalsLimit={10}
                disableAbbreviations={true}
                disableGroupSeparators={true}
                decimalSeparator="."
                groupSeparator=","
                value={pointOne}
                onValueChange={(value: string | undefined) => {
                  handlePointOneChange(value);
                }}
              />
            </Box>
          </VStack>
          <VStack m="auto">
            <Text fontWeight={"bold"} color={"gray.300"}>
              Interval End
            </Text>
            <Box bg="white" p="8px" pl="15px" borderRadius={"md"}>
              <CurrencyInput
                decimalsLimit={10}
                disableAbbreviations={true}
                disableGroupSeparators={true}
                decimalSeparator="."
                groupSeparator=","
                value={pointTwo}
                onValueChange={(value: string | undefined) => {
                  handlePointTwoChange(value);
                }}
              />
            </Box>
          </VStack>
        </HStack>

        <RangeSlider
          defaultValue={[Number(pointOne), Number(pointTwo)]}
          value={[Number(pointOne), Number(pointTwo)]}
          min={Number(pointOne) <= exchange ? Number(pointOne) : exchange}
          max={exchange <= Number(pointTwo) ? Number(pointTwo) : exchange}
          isReadOnly
        >
          <Slider
            min={Number(pointOne) <= exchange ? Number(pointOne) : exchange}
            max={exchange <= Number(pointTwo) ? Number(pointTwo) : exchange}
            defaultValue={exchange}
          >
            <SliderMark
              value={exchange}
              textAlign="center"
              bg="orange.600"
              color="white"
              mt="15px"
              ml="-23.5px"
              w="12"
              borderRadius="lg"
            >
              {exchange}
            </SliderMark>
            <SliderTrack bg="transparent">
            </SliderTrack>
            <SliderThumb mt="0.5" mr="5"/>
          </Slider>
          <RangeSliderTrack bg={"gray.300"}>
            <RangeSliderFilledTrack bg={"teal"} />
          </RangeSliderTrack>
          <RangeSliderThumb index={0} />
          <RangeSliderThumb index={1} />
        </RangeSlider>
        <Text>{stateText}</Text>
        <Text>Fee: {apr * 1}%</Text>
        <Button onClick={handleAddLiqudity}>Supply</Button>
      </VStack>
    </Card>
  );
};

export default LiquidityMenu;
