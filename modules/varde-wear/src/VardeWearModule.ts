import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { VardeWearModuleEvents } from './VardeWear.types';

declare class VardeWearModule extends NativeModule<VardeWearModuleEvents> {
  setPlan(json: string): Promise<boolean>;
  collectLogs(): Promise<string[]>;
  connectedWatches(): Promise<string[]>;
}

/** null on iOS, web and in Expo Go (the module only exists in our Android builds). */
export default requireOptionalNativeModule<VardeWearModule>('VardeWear');
