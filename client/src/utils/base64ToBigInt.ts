export default function base64ToBigInt(base64String: string) {
    // Decode the Base64 string to a byte array
    const binaryString = atob(base64String);
    const byteArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      byteArray[i] = binaryString.charCodeAt(i);
    }
  
    // Convert the byte array to a BigInt
    const bigIntValue = BigInt(
      "0x" +
        Array.from(byteArray)
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("")
    );
    return bigIntValue;
  }