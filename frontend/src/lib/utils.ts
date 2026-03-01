import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { keccak256, encodePacked } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(value: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 4);
  return `${integerPart}.${fractionalStr}`;
}

export function parseEther(value: string, decimals: number = 18): bigint {
  const [integer, fraction = ''] = value.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integer + paddedFraction);
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

export function getPhaseLabel(phase: number): string {
  const phases = ['Pending', 'Commit', 'Reveal', 'Cleared', 'Settled', 'Cancelled', 'Failed'];
  return phases[phase] || 'Unknown';
}

export function getPhaseColor(phase: number): string {
  const colors = [
    'bg-gray-500', // Pending
    'bg-blue-500', // Commit
    'bg-yellow-500', // Reveal
    'bg-green-500', // Cleared
    'bg-purple-500', // Settled
    'bg-red-500', // Cancelled
    'bg-red-700', // Failed
  ];
  return colors[phase] || 'bg-gray-500';
}

export function getPhaseClass(phase: number): string {
  const classes = [
    'phase-pending', // Pending
    'phase-commit', // Commit
    'phase-reveal', // Reveal
    'phase-cleared', // Cleared
    'phase-settled', // Settled
    'phase-cancelled', // Cancelled
    'phase-failed', // Failed
  ];
  return classes[phase] || 'phase-pending';
}

export function generateCommitment(
  quantity: bigint,
  nonce: bigint,
  address: `0x${string}`
): `0x${string}` {
  return keccak256(
    encodePacked(
      ['uint256', 'uint256', 'address'],
      [quantity, nonce, address]
    )
  );
}

export function generateNonce(): bigint {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  let hex = '0x';
  array.forEach(b => hex += b.toString(16).padStart(2, '0'));
  return BigInt(hex);
}

// Store commitment data in localStorage
export function storeCommitment(
  auctionAddress: string,
  userAddress: string,
  quantity: string,
  nonce: string
): void {
  const key = `commitment_${auctionAddress}_${userAddress}`;
  localStorage.setItem(key, JSON.stringify({ quantity, nonce }));
}

export function getStoredCommitment(
  auctionAddress: string,
  userAddress: string
): { quantity: string; nonce: string } | null {
  const key = `commitment_${auctionAddress}_${userAddress}`;
  const data = localStorage.getItem(key);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearStoredCommitment(
  auctionAddress: string,
  userAddress: string
): void {
  const key = `commitment_${auctionAddress}_${userAddress}`;
  localStorage.removeItem(key);
}
