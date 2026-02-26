import { useState, useEffect } from 'react';

/**
 * Input de descuento personalizado para administradores.
 * Solo se muestra en el flujo de edición de facturas.
 *
 * @param {number} value - Valor actual del descuento en EUR
 * @param {function} onChange - Callback al cambiar el valor
 * @param {number} maxAmount - Máximo permitido (total de la factura)
 */
export default function CustomDiscountInput({ value, onChange, maxAmount }) {
  const [inputValue, setInputValue] = useState(value > 0 ? String(value) : '');
  const [error, setError] = useState('');

  useEffect(() => {
    setInputValue(value > 0 ? String(value) : '');
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(',', '.');
    setInputValue(raw);

    const parsed = parseFloat(raw);

    if (raw === '' || raw === '.') {
      setError('');
      onChange(0);
      return;
    }

    if (isNaN(parsed) || parsed < 0) {
      setError('Introduce un número positivo');
      return;
    }

    if (parsed > maxAmount) {
      setError(`El descuento no puede superar el total (${maxAmount.toFixed(2)} €)`);
      onChange(maxAmount);
      return;
    }

    setError('');
    onChange(Math.round(parsed * 100) / 100);
  };

  const handleBlur = () => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed < 0) {
      setInputValue('');
      setError('');
      onChange(0);
    } else {
      const clamped = Math.min(Math.round(parsed * 100) / 100, maxAmount);
      setInputValue(clamped > 0 ? String(clamped) : '');
      onChange(clamped);
    }
  };

  return (
    <div className="flex justify-end py-4 px-4 md:px-0">
      <div className="w-full max-w-xs">
        <div className="border border-info/30 rounded-lg p-3 bg-info/5 space-y-2">
          <p className="text-xs font-semibold text-info uppercase tracking-wide">
            Descuento admin
          </p>
          <div className="flex items-center gap-2">
            <label
              htmlFor="custom-discount-input"
              className="text-sm text-roots-earth flex-1"
            >
              Descuento personalizado
            </label>
            <div className="relative">
              <input
                id="custom-discount-input"
                type="number"
                min="0"
                max={maxAmount}
                step="0.01"
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="0.00"
                className="input input-sm input-bordered w-28 text-right pr-6 tabular-nums"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-base-content/50 pointer-events-none">
                €
              </span>
            </div>
          </div>
          {error && (
            <p className="text-xs text-error">{error}</p>
          )}
          {value > 0 && !error && (
            <p className="text-xs text-success">
              Descuento de {value.toFixed(2)} € aplicado
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
