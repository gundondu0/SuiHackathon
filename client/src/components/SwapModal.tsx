"use client";

import { useState } from "react";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
} from "@chakra-ui/react";
import SwapMenu from "./SwapMenu";

interface SwapMenuProps {
  exchange: number;
  volatile: number;
  stable: number;
  userState: number;
  zkUserAddress: string;
  poolId: string;
}

const SwapModal: React.FC<SwapMenuProps> = ({ exchange, volatile, stable,zkUserAddress,userState,poolId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => setIsOpen(false);
  const onOpen = () => setIsOpen(true);

  return (
    <>
      <Button onClick={onOpen} colorScheme="orange">Swap</Button>

      <Modal isOpen={isOpen} onClose={onClose} size={"lg"}>
        <ModalOverlay />
        <ModalContent bg="mainDark" >
          <ModalHeader>Swap</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SwapMenu poolId={poolId} zkUserAddress={zkUserAddress} userState={userState} exchange={exchange} volatile={volatile} stable={stable} />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SwapModal;
