// Componente global para react-hot-toast
// Se monta UNA sola vez en el Layout principal
import { Toaster } from 'react-hot-toast';

export default function GlobalToaster() {
  return <Toaster position="bottom-center" reverseOrder={false} />;
}
