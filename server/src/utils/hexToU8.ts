export  function hexToU8(hex: string): Uint8Array {
    const uint8Array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        const byte = parseInt(hex.substr(i, 2), 16);
        uint8Array[i / 2] = byte;
    }
    return uint8Array;
}

