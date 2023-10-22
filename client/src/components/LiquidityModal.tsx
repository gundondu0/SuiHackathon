"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Button,
  ModalFooter,
} from "@chakra-ui/react";
import { useState } from "react";
import LiquidityMenu from "./LiquidityMenu";

interface LiquidityMenuProps {
  volatile: number;
  stable: number;
  exchange: number;
  zkUserAddress: string;
  userState: number;
  poolId: string;
}

const LiquidityModal: React.FC<LiquidityMenuProps> = ({
  volatile,
  stable,
  exchange,
  zkUserAddress,
  userState,
  poolId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => setIsOpen(false);
  const onOpen = () => setIsOpen(true);

  return (
    <>
      <Button onClick={onOpen} ml="auto">
        Add Liquidity
      </Button>

      <Modal isOpen={isOpen} size={"xl"} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="mainDark">
          <ModalHeader>Add Liquidity</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <LiquidityMenu
              zkUserAddress={zkUserAddress}
              userState={userState}
              volatile={volatile}
              stable={stable}
              exchange={exchange}
              poolId={poolId}
            />
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

export default LiquidityModal;
