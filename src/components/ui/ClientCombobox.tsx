import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface ClienteOption { id: string; nome: string; }

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
          <ChevronsUpDream className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card border-border" align="start">
        <Command
          shouldFilter={false}
          filter={() => 1}
        >
          <CommandSearch clients={sorted} value={value} onChange={(id) => { onChange(id); setOpen(false); }} />
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Inner component to manage local search state
function CommandSearch({ clients, value, onChange }: { clients: ClienteOption[]; value: string; onChange: (id: string) => void }) {
  const [q, setQ] = useState("");
  const nq = normalize(q);
  const filtered = useMemo(
    () => nq ? clients.filter(c => normalize(c.nome).includes(nq)) : clients,
    [clients, nq]
  );
  return (
    <>
      <CommandInput placeholder="Buscar cliente..." value={q} onValueChange={setQ} />
      <CommandList className="max-h-60">
        <CommandEmpty>Nenhuma cliente encontrada.</CommandEmpty>
        <CommandGroup>
          {filtered.map(c => (
            <CommandItem
              key={c.id}
              value={c.id}
              onSelect={() => onChange(c.id)}
              className="cursor-pointer"
            >
              <Check className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")} />
              <span className="truncate">{c.nome}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </>
  );
}
