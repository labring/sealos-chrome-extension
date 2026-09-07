import { createStorage, StorageEnum } from '../base/index.js';
import type { BaseStorageType } from '../base/index.js';

interface DeploySettingsStateType {
  /**
   * When true the Sealos button opens the auto-deploy deep link (autoDeploy=1).
   * When false it opens the GitHub Import review pane so the user confirms deployment manually.
   */
  autoDeploy: boolean;
}

const storage = createStorage<DeploySettingsStateType>(
  'deploy-settings-storage-key',
  {
    autoDeploy: true,
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

type DeploySettingsStorageType = BaseStorageType<DeploySettingsStateType> & {
  setAutoDeploy: (autoDeploy: boolean) => Promise<void>;
};

const deploySettingsStorage: DeploySettingsStorageType = {
  ...storage,
  setAutoDeploy: async autoDeploy => {
    await storage.set({ autoDeploy });
  },
};

export { deploySettingsStorage };
export type { DeploySettingsStateType, DeploySettingsStorageType };
