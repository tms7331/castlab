export interface ExperimentInfo {
  description: string;
  goal: bigint;
  totalDeposited: bigint;
  goalReached: boolean;
  closed: boolean;
}

export interface ContractFunctions {
  admin: () => Promise<string>;
  adminReturn: (experimentId: bigint) => Promise<void>;
  adminWithdraw: (experimentId: bigint) => Promise<void>;
  createExperiment: (description: string, goal: bigint) => Promise<bigint>;
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
  AdminReturn: {
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
    description: string;
    goal: bigint;
  };
  Undeposited: {
    experimentId: bigint;
    depositor: string;
    amount: bigint;
  };
}