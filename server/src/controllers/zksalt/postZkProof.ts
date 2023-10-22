
import { Response, Request } from "express";
import crypto from 'crypto';
import jwt_decode, { JwtPayload } from "jwt-decode";
import forge from 'node-forge';
import { getZkLoginSignature } from "@mysten/zklogin";
export type PartialZkLoginSignature = Omit<
   Parameters<typeof getZkLoginSignature>['0']['inputs'],
   'addressSeed'
>;

function hexToBase64(hex:string) {
  // Convert the hexadecimal string to a byte array
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }


  // Encode the byte array as Base64
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64;
}
export const postZkProof = async (req: Request, res: Response) => {
    try {
        
        // Example input data (you can replace these with your own data)
        
        const {zkToken,zkSalt,ephemeralPk,randomness} = req.body;
        
        
        const outputLength = 64; // Adjust this as needed
        const decodedJwt = jwt_decode(zkToken.value) as JwtPayload;

        
  
        const bigInteger = BigInt(randomness.value); // Create a BigInt from the string
        
        
        const temp = hexToBase64(bigInteger.toString(16));
        
        
        const zkpRequestPayload = {
            jwt:zkToken.value,
            extendedEphemeralPublicKey:ephemeralPk,
            maxEpoch:10,
            jwtRandomness:temp,
            salt:zkSalt,
            keyClaimName:"sub"
        };
          const apiUrl = 'http://162.243.164.43:8081/v1';
          console.log("payload --> ",zkpRequestPayload);
          
          const requestOptions = {
            method: 'POST',
            
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(zkpRequestPayload),
          };
          
          try {
            const response = await fetch(apiUrl, requestOptions);
              
           
          
            const proofResponse = await response.json();
            console.log(proofResponse);
            
            // Handle the proofResponse data here
            const partialZkLoginSignature = proofResponse as PartialZkLoginSignature;
            res.status(200).send(partialZkLoginSignature);
          } catch (error) {
            // Handle errors
            console.error('There was a problem with the request:', error);
            res.status(400).send({ permission: false, message: error.message });

          }
        // You can use the derivedKey as needed in your application
        // For now, we'll just send it as a response for demonstration purposes
        

    } catch (error) {
        res.status(400).send({ permission: false, message: error.message });
    }
}