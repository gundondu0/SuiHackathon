import { ChakraProvider } from "../context/ChakraProvider";
import Header from "@/layouts/Navbar";
import Footer from "@/layouts/Footer";
import { SuiProvider } from "@/context/SuiProvider";
import { Box } from "@chakra-ui/react";
import './globals.css';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <title>BEST DEX EVER</title>
      </head>
      <body className="mainaa">
        <ChakraProvider>
          <SuiProvider>
            <Box
              bgColor="mainDark"
              h="100vh"
            >
              <Header />
              {children}
              <Footer />
            </Box>
          </SuiProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}
