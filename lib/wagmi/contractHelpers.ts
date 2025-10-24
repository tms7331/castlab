import { parseAbi, encodeFunctionData } from 'viem';
import { CONTRACT_ADDRESS, usdToTokenAmount } from './config';
import CastlabExperimentABI from '../contracts/CastlabExperiment.json';

// Parse the ABI for type safety
export const experimentFundingAbi = parseAbi(
  CastlabExperimentABI.abi.map(item => {
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
export function prepareDepositTransaction(
  experimentId: string,
  fundAmountUSD: number,
  betAmount0USD: number = 0,
  betAmount1USD: number = 0
) {
  // Convert experiment ID (for now using a simple mapping)
  // In production, you'd store the mapping between database IDs and contract IDs
  const contractExperimentId = BigInt(experimentId.charCodeAt(0));

  // Convert USD to Wei
  const fundValueInWei = usdToTokenAmount(fundAmountUSD);
  const betValue0InWei = usdToTokenAmount(betAmount0USD);
  const betValue1InWei = usdToTokenAmount(betAmount1USD);

  // Encode the function call
  const data = encodeFunctionData({
    abi: CastlabExperimentABI.abi,
    functionName: 'userFundAndBet',
    args: [contractExperimentId, fundValueInWei, betValue0InWei, betValue1InWei],
  });

  return {
    to: CONTRACT_ADDRESS,
    data,
  };
}

/**
 * Prepare create experiment transaction
 */
export function prepareCreateExperimentTransaction(costMinUSD: number, costMaxUSD: number) {
  const costMinWei = usdToTokenAmount(costMinUSD);
  const costMaxWei = usdToTokenAmount(costMaxUSD);
  
  const data = encodeFunctionData({
    abi: CastlabExperimentABI.abi,
    functionName: 'adminCreateExperiment',
    args: [costMinWei, costMaxWei],
  });

  return {
    to: CONTRACT_ADDRESS,
    data,
  };
}