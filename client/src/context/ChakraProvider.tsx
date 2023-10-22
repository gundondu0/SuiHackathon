"use client";

import { extendTheme } from "@chakra-ui/react";
import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider as CUIChakraProvider } from "@chakra-ui/react";

const theme = extendTheme({
  colors: {
    main: "#1f1e48",
    mainDark: "#313049",
    themeOrange: "#DD6B20",
    themeBlue: "#00bcd4",
    themeBlueDark: "#007399",
    myGradient: "linear(to-r, teal.400, teal.500, teal.600)",
  },

  fonts: {
    body: "Poppins, sans-serif",
    heading: "Poppins, sans-serif",
  },
  styles: {
    global: {
      body: {
        color: "gray.300",
      },
      "*": {
        borderColor: "gray.300",
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "teal",
      },
    },
  },
});

export function ChakraProvider({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <CUIChakraProvider theme={theme}>{children}</CUIChakraProvider>
    </CacheProvider>
  );
}
