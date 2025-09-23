// src/components/AlertError.tsx
import React from 'react';
import { Alert } from 'react-native';

interface AlertErrorProps {
  title: string;
  message: string;
  onClose?: () => void;
}

export const AlertError: React.FC<AlertErrorProps> = ({ title, message, onClose }) => {
  React.useEffect(() => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Entendido',
          onPress: onClose,
        },
      ],
      { cancelable: false }
    );
  }, [title, message, onClose]);

  return null; // Este componente no renderiza nada visual
};

export default AlertError;

