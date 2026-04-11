// Componente global para react-hot-toast
// Se monta UNA sola vez en el Layout principal
//
// Usa iconos SVG inline en lugar de los iconos por defecto de react-hot-toast,
// que dependen de goober (CSS-in-JS). Los <style> de goober se pierden durante
// las View Transitions de Astro, dejando los iconos invisibles (opacity: 0).
import { Toaster } from 'react-hot-toast';

const SuccessIcon = () => (
  <div style={{
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#6b7c5e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }}>
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6L5 8.5L9.5 3.5"
        stroke="#faf7f4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const ErrorIcon = () => (
  <div style={{
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#a85444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }}>
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M3 3L9 9M9 3L3 9"
        stroke="#faf7f4"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

const LoadingIcon = () => (
  <svg
    className="animate-spin"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    style={{ flexShrink: 0 }}
  >
    <circle cx="10" cy="10" r="8" stroke="rgba(61,52,40,0.12)" strokeWidth="2.5" />
    <path
      d="M10 2A8 8 0 0 1 18 10"
      stroke="#6b7c5e"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

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
          icon: <SuccessIcon />,
        },
        error: {
          icon: <ErrorIcon />,
        },
        loading: {
          icon: <LoadingIcon />,
        },
      }}
    />
  );
}
