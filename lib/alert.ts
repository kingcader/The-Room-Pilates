import { Platform, Alert as RNAlert } from 'react-native';

// Cross-platform alert that works on web and native
export const showAlert = (title: string, message: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (onOk) onOk();
  } else {
    RNAlert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
};

