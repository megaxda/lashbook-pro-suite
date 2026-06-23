import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value: number | null | undefined;
  onValueChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  prefix?: string;
  disabled?: boolean;
  id?: string;
};

const fmt = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function format(n: number) {
  if (!isFinite(n)) return "";
  return fmt.format(n);
}

/**
 * Input de moeda em pt-BR. Usa máscara baseada em centavos:
 * o usuário digita apenas dígitos e o componente posiciona a vírgula automaticamente.
 * Ex.: digitar "11237" → "11.237,00" (R$ 11.237,00).
 */
export function CurrencyInputBRL({
  value,
  onValueChange,
  placeholder = "0,00",
  className,
  prefix = "R$",
  disabled,
  id,
}: Props) {
  const [text, setText] = React.useState<string>(
    value && value !== 0 ? format(value) : ""
  );

  React.useEffect(() => {
    const current = parseFromText(text);
    if (value == null) {
      if (text !== "") setText("");
      return;
    }
    if (Math.abs((current ?? 0) - value) > 0.001) {
      setText(format(value));
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function parseFromText(t: string): number | null {
    const digits = t.replace(/\D/g, "");
    if (!digits) return null;
    const cents = parseInt(digits, 10);
    return cents / 100;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 14);
    if (!digits) {
      setText("");
      onValueChange(0);
      return;
    }
    const num = parseInt(digits, 10) / 100;
    setText(format(num));
    onValueChange(num);
  };

  return (
    <div className={cn("relative", className)}>
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {prefix}
        </span>
      )}
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(prefix && "pl-9", "text-right")}
      />
    </div>
  );
}
