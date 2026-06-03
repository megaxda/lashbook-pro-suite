import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface ClienteOption { id: string; nome: string; telefone?: string | null; }

interface Props {
  clients: ClienteOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function ClientCombobox({ clients, value, onChange, placeholder = "Selecione...", className }: Props) {
  const [open, setOpen] = useState(false);
  const sorted = useMemo(
    () => [...clients].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })),
    [clients]
  );
  // Detect homonyms (same first+second name) so we can show phone hint to disambiguate.
  const homonymSet = useMemo(() => {
    const counts = new Map<string, number>();
    sorted.forEach(c => {
      const key = normalize(c.nome).split(" ").slice(0, 2).join(" ");
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [sorted]);
  const selected = clients.find(c => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-secondary border-border min-h-[44px] font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-left">{selected ? selected.nome : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card border-border" align="start">
        <Command shouldFilter={false} filter={() => 1}>
          <CommandSearch
            clients={sorted}
            homonymSet={homonymSet}
            value={value}
            onChange={(id) => { onChange(id); setOpen(false); }}
          />
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CommandSearch({
  clients,
  homonymSet,
  value,
  onChange,
}: {
  clients: ClienteOption[];
  homonymSet: Map<string, number>;
  value: string;
  onChange: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const tokens = normalize(q).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return clients;
    // Every token must appear somewhere in name (substring within any word).
    return clients.filter(c => {
      const n = normalize(c.nome);
      return tokens.every(t => n.includes(t));
    });
  }, [clients, q]);
  return (
    <>
      <CommandInput placeholder="Buscar cliente..." value={q} onValueChange={setQ} />
      <CommandList className="max-h-72">
        <CommandEmpty>Nenhuma cliente encontrada.</CommandEmpty>
        <CommandGroup>
          {filtered.map(c => {
            const key = normalize(c.nome).split(" ").slice(0, 2).join(" ");
            const isHomonym = (homonymSet.get(key) || 0) > 1;
            return (
              <CommandItem
                key={c.id}
                value={c.id}
                onSelect={() => onChange(c.id)}
                className="cursor-pointer"
              >
                <Check className={cn("mr-2 h-4 w-4 shrink-0", value === c.id ? "opacity-100" : "opacity-0")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{c.nome}</p>
                  {isHomonym && c.telefone && (
                    <p className="truncate text-[10px] text-muted-foreground">{c.telefone}</p>
                  )}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </>
  );
}
