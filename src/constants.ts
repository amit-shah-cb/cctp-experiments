//https://developers.circle.com/stablecoins/docs/cctp-getting-started#attestation-service-api
export const IRIS_ATTESTATION_SERVICE_MAINNET = "https://iris-api.circle.com";
export const IRIS_ATTESTATION_SERVICE_TESTNET = "https://iris-api-sandbox.circle.com";

export type ChainInfo = {
    domain: number;
    address: string;
};

export const Domains: Map<string, number> = new Map([
    ["Ethereum",  0 ],
    ["Avalanche",  1],
    ["OP", 2],
    ["Arbitrum", 3],
    ["Base",  6,],
    ["Polygon", 7],
    ["Solana",5]
]);


export const TokenMessenger: Map<string, ChainInfo> = new Map([
    ["Ethereum", { domain: 0, address: "0xbd3fa81b58ba92a82136038b25adec7066af3155" }],
    ["Avalanche", { domain: 1, address: "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982" }],
    ["OP", { domain: 2, address: "0x2B4069517957735bE00ceE0fadAE88a26365528f" }],
    ["Arbitrum", { domain: 3, address: "0x19330d10D9Cc8751218eaf51E8885D058642E08A" }],
    ["Base", { domain: 6, address: "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962" }],
    ["Polygon", { domain: 7, address: "0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE" }],
]);

export const MessageTransmitter: Map<string, ChainInfo> = new Map([
    ["Ethereum", { domain: 0, address: "0x0a992d191deec32afe36203ad87d7d289a738f81" }],
    ["Avalanche", { domain: 1, address: "0x8186359af5f57fbb40c6b14a588d2a59c0c29880" }],
    ["OP", { domain: 2, address: "0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8" }],
    ["Arbitrum", { domain: 3, address: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca" }],
    ["Base", { domain: 6, address: "0xAD09780d193884d503182aD4588450C416D6F9D4" }],
    ["Polygon", { domain: 7, address: "0xF3be9355363857F3e001be68856A2f96b4C39Ba9" }],
]);

export const TokenMinter: Map<string, ChainInfo> = new Map([
    ["Ethereum", { domain: 0, address: "0xc4922d64a24675e16e1586e3e3aa56c06fabe907" }],
    ["Avalanche", { domain: 1, address: "0x420f5035fd5dc62a167e7e7f08b604335ae272b8" }],
    ["OP", { domain: 2, address: "0x33E76C5C31cb928dc6FE6487AB3b2C0769B1A1e3" }],
    ["Arbitrum", { domain: 3, address: "0xE7Ed1fa7f45D05C508232aa32649D89b73b8bA48" }],
    ["Base", { domain: 6, address: "0xe45B133ddc64bE80252b0e9c75A8E74EF280eEd6" }],
    ["Polygon", { domain: 7, address: "0x10f7835F827D6Cf035115E10c50A853d7FB2D2EC" }],
]);

export const UsdcErc20: Map<string, ChainInfo> = new Map([
    ["Ethereum", { domain: 0, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }],
    ["Avalanche", { domain: 1, address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" }],
    ["OP", { domain: 2, address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" }],
    ["Arbitrum", { domain: 3, address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" }],
    ["Base", { domain: 6, address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" }],
    ["Polygon", { domain: 7, address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" }],
]);

export const ProviderUrl: Map<string, string> = new Map([
    ["Ethereum", ``],
    ["Avalanche",``],
    ["OP", ``],
    ["Arbitrum", ``],
    ["Base", `https://mainnet.base.org`],
    ["Polygon",`https://polygon-rpc.com`]
])