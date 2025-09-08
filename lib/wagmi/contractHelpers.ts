import { parseAbi, encodeFunctionData } from 'viem';
import { CONTRACT_ADDRESS, usdToWei } from './config';
import ExperimentFundingABI from '../contracts/ExperimentFunding.json';

// Parse the ABI for type safety
export const experimentFundingAbi = parseAbi(
  ExperimentFundingABI.abi.map(item => {
    // Convert ABI to string format for parseAbi
    if (item.type === 'function') {
      const inputs = item.inputs.map(i => `${i.type} ${i.name}`).join(', ');
      const outputs = item.outputs?.length 
        ? ` returns (${item.outputs.map(o => o.type).join(', ')})` 
        : '';
      return `function ${item.name}(${inputs})${item.stateMutability === 'view' ? ' view' : ''}${item.stateMutability === 'payable' ? ' payable' : ''}${outputs}`;
    }
    if (item.type === 'event') {
      const inputs = item.inputs.map((i: { type: string; name: string; indexed?: boolean }) => 
        `${i.type}${i.indexed ? ' indexed' : ''} ${i.name}`
      ).join(', ');
      return `event ${item.name}(${inputs})`;
    }
    return '';
  }).filter(Boolean) as readonly string[]
);

/**
 * Prepare deposit transaction data
 */
export function prepareDepositTransaction(experimentId: string, amountUSD: number) {
  // Convert experiment ID (for now using a simple mapping)
  // In production, you'd store the mapping between database IDs and contract IDs
  const contractExperimentId = BigInt(experimentId.charCodeAt(0));
  
  // Convert USD to Wei
  const valueInWei = usdToWei(amountUSD);
  
  // Encode the function call
  const data = encodeFunctionData({
    abi: ExperimentFundingABI.abi,
    functionName: 'deposit',
    args: [contractExperimentId],
  });

  return {
    to: CONTRACT_ADDRESS,
    value: valueInWei,
    data,
  };
}

/**
 * Prepare create experiment transaction
 */
export function prepareCreateExperimentTransaction(description: string, goalUSD: number) {
  const goalInWei = usdToWei(goalUSD);
  
  const data = encodeFunctionData({
    abi: ExperimentFundingABI.abi,
    functionName: 'createExperiment',
    args: [description, goalInWei],
  });

  return {
    to: CONTRACT_ADDRESS,
    data,
  };
}