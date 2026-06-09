import Toast from 'react-native-toast-message';

/** Thin wrapper over react-native-toast-message to mirror the PWA's `sonner` API. */
export const toast = {
  success: (message: string) => Toast.show({ type: 'success', text1: message, position: 'top' }),
  error: (message: string) => Toast.show({ type: 'error', text1: message, position: 'top' }),
  info: (message: string) => Toast.show({ type: 'info', text1: message, position: 'top' }),
};
