"use client";
import { Button, HStack, Text } from "@chakra-ui/react";
import React from "react";

import CurrencyInput from "react-currency-input-field";
import apr from "@/data/apr";
import { useState } from "react";
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

type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;
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

interface PoolInfoProps {
  volatile: number;
  stable: number;
  exchange: number;
  volume: string;
  userState: number;
  zkUserAddress: string;
  poolId: string;
}

import { Box } from "@chakra-ui/react";
import SwapModal from "./SwapModal";
import LiquidityModal from "./LiquidityModal";
const DECIMALS = 10 ** 9;

const PoolItem: React.FC<PoolInfoProps> = ({
  volatile,
  stable,
  exchange,
  volume,
  userState,
  zkUserAddress,
  poolId,
}) => {
  const { currentAccount, signAndExecuteTransactionBlock } = useWalletKit();
  const [statusText, setStatusText] = useState<string>("");
  return (
    <HStack
      borderRadius={"lg"}
      border="1px solid"
      p="16px"
      m="8px 4px 8px 4px"
      h="4rem"
      spacing={"16px"}
      bg="main"
    >
      <Text textAlign={"center"} m="auto" w="8.5rem">
        Token A - Token B
      </Text>
      <Text textAlign={"center"} m="auto" w="4rem">
        {exchange}
      </Text>
      <Text textAlign={"center"} m="auto" w="7rem">
        ${volume}
      </Text>
      <LiquidityModal
        poolId={poolId}
        userState={userState}
        zkUserAddress={zkUserAddress}
        volatile={volatile}
        stable={stable}
        exchange={exchange}
      />
      <SwapModal
        poolId={poolId}
        userState={userState}
        zkUserAddress={zkUserAddress}
        volatile={volatile}
        stable={stable}
        exchange={exchange}
      />
      <Button
        onClick={async () => {
          if (userState === 0) return;
          if (userState == 1) {
            if (!currentAccount) return;
            const client = new SuiClient({ url: getFullnodeUrl("devnet") });
            const tx = new TransactionBlock();
            const currOrder = await client.getDynamicFieldObject({
              parentId: poolId,
              name: {
                type: "address",
                value: currentAccount?.address,
              },
            });

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
            const coinObjectIds2 = token_b
              .slice(1)
              .map((token) => token.coinObjectId);
            const originalCoinBObjectId = token_b[0].coinObjectId;
            if (!token_b[0]) return;
            if (coinObjectIds2.length > 1) {
              tx.mergeCoins(token_b[0].coinObjectId, coinObjectIds2);
            }

            console.log(coinObjectIds);
            const selectedToken = "";
            if (!currOrder.data) return;
            tx.moveCall({
              target: `${links.contract}::pool::withdraw_order`,
              typeArguments: [links.token_a, links.token_b, selectedToken],
              arguments: [tx.object(currOrder.data?.objectId)],
            });
            await signAndExecuteTransactionBlock({ transactionBlock: tx });
            setStatusText("Success");

            console.log("create pools");
          } else if (userState == 2) {
            const client = new SuiClient({ url: getFullnodeUrl("devnet") });

            const currOrder = await client.getDynamicFieldObject({
              parentId: poolId,
              name: {
                type: "address",
                value: zkUserAddress,
              },
            });
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
            const coinObjectIds2 = token_b
              .slice(1)
              .map((token) => token.coinObjectId);
            const originalCoinBObjectId = token_b[0].coinObjectId;
            if (!token_b[0]) return;
            if (coinObjectIds2.length > 1) {
              tx.mergeCoins(token_b[0].coinObjectId, coinObjectIds2);
            }

            console.log(coinObjectIds);
            const selectedToken = "";
            if (!currOrder.data) return;
            tx.moveCall({
              target: `${links.contract}::pool::withdraw_order`,
              typeArguments: [links.token_a, links.token_b, selectedToken],
              arguments: [tx.object(currOrder.data?.objectId)],
            });
            const res = await postGenerateZkSalt();
            let zkSalt = res.zk_salt;
            const zk_jwt = Cookies.get("zk_jwt");
            if (!zk_jwt) return;

            const zksaltBigInt = base64ToBigInt(zkSalt);

            const zkLoginUserAddress = jwtToAddress(zk_jwt, zksaltBigInt);
            console.log(zkLoginUserAddress, "<-- user address");

            let ephemeralKeyPair = Ed25519Keypair.fromSecretKey(
              base64ToU8(Cookies.get("privkey")!)
            );
            console.log(ephemeralKeyPair.getPublicKey().toBase64());
            const proofResponse = await postZkProof(
              ephemeralKeyPair.getPublicKey().toBase64(),
              zkSalt
            );

            const partialZkLoginSignature =
              proofResponse as PartialZkLoginSignature;
            tx.setSender(zkLoginUserAddress);

            const { bytes, signature: userSignature } = await tx.sign({
              client,
              signer: ephemeralKeyPair,
            });

            const decodedJwt = jwt_decode(zk_jwt) as JwtPayload;
            if (!decodedJwt.aud || !decodedJwt.sub) return;
            console.log(decodedJwt);

            const addressSeed: string = genAddressSeed(
              zksaltBigInt,
              "sub",
              decodedJwt.sub,
              //@ts-ignore
              decodedJwt.aud
            ).toString();

            const zkLoginSignature = getZkLoginSignature({
              inputs: {
                ...partialZkLoginSignature,
                addressSeed,
              },
              maxEpoch: 10,
              userSignature,
            });
            await client.executeTransactionBlock({
              transactionBlock: bytes,
              signature: zkLoginSignature,
            });
            setStatusText("Success");
          }
        }}
      >
        Withdraw Current Order
      </Button>
      <Text>{statusText}</Text>
    </HStack>
  );
};

export default PoolItem;
