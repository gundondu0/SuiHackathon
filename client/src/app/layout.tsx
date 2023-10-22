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
        <title>Kabwa</title>
      </head>
      <body style={{ backgroundImage: "url(/sun-tornado.svg)", backgroundRepeat: "no-repeat", backgroundPosition: 'center',
  backgroundSize: 'cover',}}>
        <ChakraProvider>
          <SuiProvider>
              <Header />
              {children}
              <Footer />
          </SuiProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}
