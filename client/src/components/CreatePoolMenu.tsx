import { Box, Card, HStack, VStack, Text, Button } from "@chakra-ui/react";
import React, { useState } from "react";
import CurrencyInput from "react-currency-input-field";
import { BsArrowLeftRight } from "react-icons/bs";
import TokenModal from "./TokenModal";

const CreatePoolMenu: React.FC = () => {
  const [inputValue1, setInputValue1] = useState<string>("0");
  const [inputValue2, setInputValue2] = useState<string>("0");
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
  return (
    <Card border="1px solid black" display="inline-flex" p="4px">
      <VStack align={"flex"}>
        <HStack>
          <Box border="1px solid black">
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
          <TokenModal />
          <Box alignContent={"center"}>
            <BsArrowLeftRight />
          </Box>
          <Box border="1px solid black">
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
          <TokenModal />
        </HStack>
      </VStack>
    </Card>
  );
};

export default CreatePoolMenu;
