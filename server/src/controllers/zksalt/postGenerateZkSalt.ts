
import { Response, Request } from "express";
import crypto from 'crypto';
import jwt_decode, { JwtPayload } from "jwt-decode";
import forge from 'node-forge';

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

function applyHKDF(ikm: string, salt: string, info: string, outputLength: number): string {
    const ikmBytes = forge.util.encodeUtf8(ikm);
    const saltBytes = forge.util.encodeUtf8(salt);
    const infoBytes = forge.util.encodeUtf8(info);
  
    const derivedKey = forge.pkcs5.pbkdf2(ikmBytes, saltBytes, 1, outputLength, forge.md.sha256.create());
    console.log(forge.util.bytesToHex(derivedKey));
    
    return forge.util.bytesToHex(derivedKey);
  }


export const postGenerateZkSalt = async (req: Request, res: Response) => {
    try {
        
        // Example input data (you can replace these with your own data)
        const ikm = 'myseceeefwerect'
        const salt = Buffer.from('mysalt', 'utf8');
        const {zkToken} = req.body;
        console.log(zkToken.value);
        
        const decodedJwt = jwt_decode(zkToken.value) as JwtPayload;
        console.log(decodedJwt);
        
        const outputLength = 16; // Adjust this as needed
        
        
        let derivedKey = applyHKDF(ikm, decodedJwt.iss,decodedJwt.sub + decodedJwt.aud, outputLength);
        // You can use the derivedKey as needed in your application
        // For now, we'll just send it as a response for demonstration purposes
        
        derivedKey = hexToBase64(derivedKey);

        res.status(200).send({ zk_salt: derivedKey, message:    "Succsess" });

    } catch (error) {
        res.status(400).send({ permission: false, message: error.message });
    }
}