import React, { useState, useEffect } from 'react';
import MyNFTContractabi from './contracts/MyNFT.sol/MyNFT.json';
import axios from 'axios';
const abi = MyNFTContractabi.abi;
const ethers = require("ethers")
const contractAddress = '0xB870755464632F353071474750C7D00ED878469D';
const PINATA_API_KEY = '5af313004f6f0f4763aa'; // Replace with your Pinata API key
const PINATA_SECRET_API_KEY = 'acefd8c1abfab6237ef827066a43446f61d8803eba0fefd4130d2956d62e2dc0'; // Replace with your Pinata secret API key

const App = () => {
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [userNFTs, setUserNFTs] = useState([]);

  // Function to fetch the user's NFTs
  // const fetchUserNFTs = async () => {
  //   try {
  //     const provider = new ethers.BrowserProvider(window.ethereum);
  //     const contract = new ethers.Contract(contractAddress, abi, provider);
  //     console.log('User Address:', userAddress);
  //     const userTokens = await contract.getUserTransactionHistory(userAddress);
  //     console.log('User Tokens:', userTokens);
  //     setUserNFTs(userTokens);
  //   } catch (error) {
  //     console.error('Error fetching user NFTs:', error);
  //   }
  // };

  const fetchNFTs = async () => {
    console.log('fetching nfts');
    const api_key = 'z8o-UNrJKSM-JQU0c3R2ISUckAx-WJJH';
    const baseURL = `https://eth-sepolia.g.alchemy.com/v2/${api_key}/getNFTs/`;

    if (!contractAddress.length) {
      const fetchURL = `${baseURL}?owner=${userAddress}`;
      const response = await fetch(fetchURL);
      const data = await response.json();
      console.log('response data', data);
      setUserNFTs(data.ownedNfts);
      console.log(userNFTs);
    } else {
      console.log('fetching nfts for collection owned by address');
      const fetchURL = `${baseURL}?owner=${userAddress}&contractAddresses%5B%5D=${contractAddress}`;
      const response = await fetch(fetchURL);
      const data = await response.json();
      console.log('response data', data);
      setUserNFTs(data.ownedNfts);
      console.log(userNFTs);
    }
  };


  // Connect to the wallet
  const connectToWallet = async () => {
    if (window.ethereum) {
      try {
        const addressArray = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (addressArray.length > 0) {
          setUserAddress(addressArray[0]);
          console.log(`Connected to wallet with address: ${addressArray[0]}`);
          // fetchUserNFTs();
          fetchNFTs();// Fetch the user's NFTs after connecting
        }
      } catch (error) {
        console.error('Error connecting to wallet:', error);
      }
    } else {
      console.error('MetaMask or compatible wallet not found.');
    }
  };

  const uploadImage = async () => {
    try {
      setLoading(true);

      if (!userAddress) {
        alert('Please connect your wallet.');
        setLoading(false);
        return;
      }

      if (!imageFile) {
        alert('Please select an image.');
        setLoading(false);
        return;
      }

      const MyNFTContract = new ethers.Contract(
        contractAddress, // Replace with your contract's address
        abi, // Use the ABI of your contract
        window.ethereum
      );

      const ipfsURL = await uploadToIPFS(imageFile);

      const transactionParameters = {
        to: contractAddress,
        from: userAddress,
        data: MyNFTContract.interface.encodeFunctionData('mintNFT', [userAddress, ipfsURL]),
      };
      console.log(transactionParameters.data);

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      setTransactionHash(txHash);
      // fetchUserNFTs();
      fetchNFTs(); // Refresh the user's NFT list after minting
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Error minting NFT. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadToIPFS = async (image) => {
    if (!image) {
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('file', image);
      formData.append(
        'pinataMetadata',
        JSON.stringify({ name: 'MyNFTImage', description: 'Description of your NFT image' })
      );

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_API_KEY,
          },
          maxContentLength: Infinity,
        }
      );

      const ipfsURL = response.data.IpfsHash;
      return ipfsURL;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      alert('Error uploading to IPFS. Please try again.');
      return null;
    }
  };

  useEffect(() => {
    // Fetch user's NFTs when the component mounts
    // fetchUserNFTs();
    fetchNFTs();
  }, [userAddress]);

  return (
    <div>
      <h1>Mint NFT</h1>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />
      <button onClick={connectToWallet}>Connect Wallet</button>
      <button onClick={uploadImage} disabled={!imageFile || loading}>Mint NFT</button>
      {loading && <p>Uploading and minting...</p>}
      {transactionHash && (
        <p>
          NFT minted! Transaction Hash:{' '}
          <a
            href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {transactionHash}
          </a>
        </p>
      )}
      {userNFTs.length > 0 ? (
  <div>
    <h2>Your NFTs:</h2>
    <ul>
      {userNFTs.map((tokenId) => (
        <li key={tokenId.tokenURI}>
  <img src={`https://gateway.pinata.cloud/ipfs/${tokenId.tokenUri.raw}`} alt="Image Description" />
</li>

      ))}
    </ul>
  </div>
) : (
  <p>No NFTs found for this user.</p>
)}

    </div>
  );
};

export default App;
