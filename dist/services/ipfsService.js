import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY || '';
export const ipfsService = {
    uploadFile: async (filePath, fileName) => {
        if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
            console.warn("Pinata keys not configured. Falling back to local IPFS mock.");
            // Just return a dummy CID
            return "QmDummyHash" + Date.now();
        }
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            const pinataMetadata = JSON.stringify({ name: fileName });
            formData.append('pinataMetadata', pinataMetadata);
            const pinataOptions = JSON.stringify({ cidVersion: 0 });
            formData.append('pinataOptions', pinataOptions);
            const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
                headers: {
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_API_KEY,
                }
            });
            return res.data.IpfsHash;
        }
        catch (error) {
            console.error("Error uploading to IPFS via Pinata:", error);
            throw new Error("IPFS Upload Failed");
        }
    }
};
