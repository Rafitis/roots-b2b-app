// Componente global para react-hot-toast
// Se monta UNA sola vez en el Layout principal
import { Toaster } from 'react-hot-toast';

export default function GlobalToaster() {
  return (
    <Toaster
      position="bottom-center"
      reverseOrder={false}
      toastOptions={{
        style: {
          background: '#faf7f4',
          color: '#3d3428',
          border: '1px solid rgba(61, 52, 40, 0.08)',
          fontSize: '14px',
        },
        success: {
          iconTheme: {
            primary: '#6b7c5e',
            secondary: '#faf7f4',
          },
        },
        error: {
          iconTheme: {
            primary: '#a85444',
            secondary: '#faf7f4',
          },
        },
      }}
    />
  );
}
