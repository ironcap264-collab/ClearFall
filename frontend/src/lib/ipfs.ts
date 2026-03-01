// IPFS/Pinata Integration for ClearFall
// Uses Pinata's JWT authentication for secure uploads

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface AuctionMetadata {
  name: string;
  description: string;
  image?: string;
  external_url?: string;
  attributes?: {
    trait_type: string;
    value: string | number;
  }[];
  auction_details?: {
    token_address: string;
    total_supply: string;
    start_price: string;
    end_price: string;
    start_time: string;
    commit_duration: string;
    reveal_duration: string;
  };
}

// Get Pinata JWT from environment
function getPinataJWT(): string {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  if (!jwt) {
    throw new Error('NEXT_PUBLIC_PINATA_JWT is not configured');
  }
  return jwt;
}

// Upload JSON metadata to IPFS via Pinata
export async function uploadMetadataToIPFS(metadata: AuctionMetadata): Promise<string> {
  const jwt = getPinataJWT();

  const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `clearfall-auction-${Date.now()}`,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload to IPFS: ${error}`);
  }

  const data: PinataResponse = await response.json();
  return `ipfs://${data.IpfsHash}`;
}

// Upload image file to IPFS via Pinata
export async function uploadImageToIPFS(file: File): Promise<string> {
  const jwt = getPinataJWT();

  const formData = new FormData();
  formData.append('file', file);
  formData.append(
    'pinataMetadata',
    JSON.stringify({
      name: `clearfall-image-${Date.now()}-${file.name}`,
    })
  );
  formData.append(
    'pinataOptions',
    JSON.stringify({
      cidVersion: 1,
    })
  );

  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload image to IPFS: ${error}`);
  }

  const data: PinataResponse = await response.json();
  return `ipfs://${data.IpfsHash}`;
}

// Convert IPFS URI to HTTP gateway URL
export function ipfsToHttp(ipfsUri: string): string {
  if (!ipfsUri) return '';

  if (ipfsUri.startsWith('ipfs://')) {
    const hash = ipfsUri.replace('ipfs://', '');
    return `${PINATA_GATEWAY}/${hash}`;
  }

  if (ipfsUri.startsWith('https://') || ipfsUri.startsWith('http://')) {
    return ipfsUri;
  }

  // Assume it's just a CID
  return `${PINATA_GATEWAY}/${ipfsUri}`;
}

// Fetch metadata from IPFS
export async function fetchMetadataFromIPFS(ipfsUri: string): Promise<AuctionMetadata | null> {
  try {
    const url = ipfsToHttp(ipfsUri);
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Failed to fetch metadata from IPFS');
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching IPFS metadata:', error);
    return null;
  }
}

// Create complete auction metadata and upload
export async function createAndUploadAuctionMetadata(
  name: string,
  description: string,
  imageFile: File | null,
  auctionDetails?: AuctionMetadata['auction_details']
): Promise<{ metadataUri: string; imageUri: string }> {
  let imageUri = '';

  // Upload image first if provided
  if (imageFile) {
    imageUri = await uploadImageToIPFS(imageFile);
  }

  // Create metadata object
  const metadata: AuctionMetadata = {
    name,
    description,
    image: imageUri,
    external_url: 'https://clearfall.xyz',
    attributes: [
      {
        trait_type: 'Platform',
        value: 'ClearFall Protocol',
      },
      {
        trait_type: 'Network',
        value: 'Polygon Amoy',
      },
      {
        trait_type: 'Type',
        value: 'Dutch Auction',
      },
    ],
    auction_details: auctionDetails,
  };

  // Upload metadata
  const metadataUri = await uploadMetadataToIPFS(metadata);

  return { metadataUri, imageUri };
}

// Check if Pinata is configured
export function isPinataConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_PINATA_JWT;
}
