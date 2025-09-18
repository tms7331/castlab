export interface ExperimentInfo {
  costMin: bigint;
  costMax: bigint;
  totalDeposited: bigint;
  open: boolean;
}

export interface ContractFunctions {
  admin: () => Promise<string>;
  adminReturn: (experimentId: bigint) => Promise<void>;
  adminWithdraw: (experimentId: bigint) => Promise<void>;
  createExperiment: (costMin: bigint, costMax: bigint) => Promise<bigint>;
  deposit: (experimentId: bigint, value: bigint) => Promise<void>;
  experimentDepositors: (experimentId: bigint, index: bigint) => Promise<string>;
  experiments: (experimentId: bigint) => Promise<ExperimentInfo>;
  getDepositors: (experimentId: bigint) => Promise<string[]>;
  getExperimentInfo: (experimentId: bigint) => Promise<ExperimentInfo>;
  getUserDeposit: (experimentId: bigint, user: string) => Promise<bigint>;
  nextExperimentId: () => Promise<bigint>;
  undeposit: (experimentId: bigint) => Promise<void>;
}

export interface ContractEvents {
  AdminClose: {
    experimentId: bigint;
  };
  AdminWithdraw: {
    experimentId: bigint;
    amount: bigint;
  };
  Deposited: {
    experimentId: bigint;
    depositor: string;
    amount: bigint;
  };
  ExperimentCreated: {
    experimentId: bigint;
    costMin: bigint;
    costMax: bigint;
  };
  Undeposited: {
    experimentId: bigint;
    depositor: string;
    amount: bigint;
  };
}