import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

export interface OtaStatus {
  supported: boolean;
  channel: string;
  runtimeVersion: string;
  updateId: string | null;
}

export function getOtaStatus(): OtaStatus {
  if (Platform.OS === 'web' || !Updates.isEnabled) {
    return {
      supported: false,
      channel: 'local',
      runtimeVersion: '1.0.0',
      updateId: null,
    };
  }

  return {
    supported: true,
    channel: Updates.channel || 'default',
    runtimeVersion: Updates.runtimeVersion || '1.0.0',
    updateId: Updates.updateId ?? null,
  };
}

export async function checkAndApplyOtaUpdate(): Promise<{
  updated: boolean;
  message: string;
}> {
  if (Platform.OS === 'web' || __DEV__ || !Updates.isEnabled) {
    return {
      updated: false,
      message:
        'Las actualizaciones OTA se activan automáticamente en los builds de EAS (preview / producción).',
    };
  }

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) {
      return {
        updated: false,
        message: 'Ya tenés la última versión instalada.',
      };
    }

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return {
      updated: true,
      message: 'Actualización aplicada.',
    };
  } catch {
    return {
      updated: false,
      message: 'No se pudo comprobar actualizaciones ahora. Probá más tarde.',
    };
  }
}
