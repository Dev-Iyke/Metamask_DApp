import { ethers } from "ethers";
import './style.css'
import detectEthereumProvider from "@metamask/detect-provider";
const connectBtn = document.getElementById("connectBtn");
const switchNetworkBtn = document.getElementById("switchNetworkBtn");
const accountP = document.getElementById("account");
const balanceP = document.getElementById("balance");
const toAddressInput = document.getElementById("toAddress");
const amountInput = document.getElementById("amount");
const sendBtn = document.getElementById("sendBtn");
const statusP = document.getElementById("status");


let provider;
let signer;
let currentAccount;

//VOTING
const voteBtn = document.getElementById("voteBtn");
const voteOption = document.getElementById("voteOption");
const voteStatus = document.getElementById("voteStatus");

//Voting contract details
const votingContractAddress = "0x35cd167FA931C6c5E07AbB2621846FC35D54baD6";
const votingAbi = [
  {
    inputs: [{ internalType: "uint256", name: "_proposal", type: "uint256" }],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

async function switchToSepolia() {
  console.log('sepolia switch')
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }],
    });
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

  } catch (switchError) {
    if (switchError.code === 4902) {
      // Sepolia not added
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia Testnet",
              nativeCurrency: {
                name: "SepoliaETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
        updateBalance();
      } catch (addError) {
        console.error("Error adding Sepolia:", addError);
      }
    } else {
      console.error("Error switching network:", switchError);
    }
  }
}

async function connectWallet() {
  const detected = await detectEthereumProvider();

  if (!detected) {
    alert("MetaMask not detected. Please install MetaMask.");
    return;
  }

  //connect to metamask
  provider = new ethers.BrowserProvider(window.ethereum);

  try {
    // Request account access if needed
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    console.log(accounts)
    currentAccount = accounts[0];
    signer = await provider.getSigner();
    console.log(signer)
    accountP.textContent = `Connected account: ${currentAccount}`;

    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, `Chain ID: ${network.chainId}`);
    console.log(network.toJSON())
    console.log(network)

    updateBalance();
  } catch (err) {
    console.error("Connection error:", err);
    statusP.textContent = "Failed to connect.";
  }
}

async function updateBalance() {
   //retrieves the eth balance
  const balance = await provider.getBalance(currentAccount);
  //  formats from wei (default unit) to ETH.
  const ethBalance = ethers.formatEther(balance);
  balanceP.textContent = `Balance: ${ethBalance} ETH`;
}

async function sendETH() {
  const to = toAddressInput.value.trim();
  const amount = amountInput.value.trim();

  if (!ethers.isAddress(to)) {
    alert("Invalid recipient address");
    return;
  }

  try {
    statusP.textContent = "Sending ETH...";

    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amount),
    });

    statusP.textContent = "Transaction sent. Waiting for confirmation...";
    await tx.wait();
    statusP.textContent = `Transaction confirmed!: ${tx.hash}`;
    updateBalance();
  } catch (err) {
    console.error("Send error:", err);
    console.log(err)
    statusP.textContent = "Failed to send transaction.";
  }
}


async function vote () {
  if (!signer) {
    voteStatus.textContent = "Please connect your wallet first.";
    return;
  }

  const proposal = parseInt(voteOption.value);

  if (![1, 2].includes(proposal)) {
    voteStatus.textContent = "Invalid proposal selection.";
    return;
  }

  try {
    const contract = new ethers.Contract(
      votingContractAddress,
      votingAbi,
      signer
    );

    const tx = await contract.vote(proposal);
    voteStatus.textContent = "Transaction submitted. Waiting for confirmation...";

    await tx.wait();
    voteStatus.textContent = "✅ Vote submitted successfully!";
  } catch (err) {
    console.error("Voting failed:", err);
    voteStatus.textContent = "❌ Voting failed. See console for details.";
  }
}



connectBtn.addEventListener("click", connectWallet);
switchNetworkBtn.addEventListener("click", switchToSepolia);
sendBtn.addEventListener("click", sendETH);
voteBtn.addEventListener("click", vote);
