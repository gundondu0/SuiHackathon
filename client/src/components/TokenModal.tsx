import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Button,
  Flex,
  useDisclosure,
} from "@chakra-ui/react";

const TokenModal: React.FC = () => {
  const coins = [
    "Bitcoin",
    "Ethereum",
    "Cardano",
    "Binance Coin",
    "Dogecoin",
    "Sui",
  ];
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const handleCoinSelect = (coin: string) => {
    setSelectedCoin(coin);
    onClose();
  };

  return (
    <>
      <Button onClick={onOpen} ml="auto">
        {selectedCoin ? selectedCoin : "Select a coin"}
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select a coin</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column">
              {coins.map((coin) => (
                <Button
                  key={coin}
                  py={2}
                  borderBottom="1px solid gray"
                  onClick={() => handleCoinSelect(coin)}
                >
                  {coin}
                </Button>
              ))}
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TokenModal;