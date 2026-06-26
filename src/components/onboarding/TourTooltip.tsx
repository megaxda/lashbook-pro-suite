import { TooltipRenderProps } from "react-joyride";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TourStepMeta {
  icon?: LucideIcon;
  title: string;
  body: string;
  hero?: boolean;
}

export function TourTooltip({
  index,
  size,
  step,
  backProps,
  primaryProps,
  skipProps,
  closeProps,
  tooltipProps,
  isLastStep,
  continuous,
}: TooltipRenderProps) {
  const meta = ((step as any).meta || {}) as TourStepMeta;
  const Icon = meta.icon ?? Sparkles;
  const isHero = meta.hero;

  const widthClass = isHero ? "w-[min(420px,92vw)]" : "w-[min(360px,92vw)]";

  return (
    <div
      {...tooltipProps}
      className={`${widthClass} rounded-2xl bg-card border border-primary/20 shadow-2xl overflow-hidden text-left`}
    >
      {/* Gradient banner */}
      <div className="relative h-16 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center px-5">
        <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shadow-sm">
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>
        <button
          {...closeProps}
          aria-label="Fechar tour"
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground flex items-center justify-center transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-5 space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">
            Passo {index + 1} de {size}
          </p>
          <h3 className={`font-bold text-foreground ${isHero ? "text-2xl leading-tight" : "text-lg"}`}>
            {meta.title || (step.title as string)}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {meta.body || (step.content as string)}
        </p>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((index + 1) / size) * 100}%` }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {index > 0 ? (
            <Button {...backProps} variant="ghost" size="sm" className="text-muted-foreground">
              Voltar
            </Button>
          ) : (
            <Button {...skipProps} variant="ghost" size="sm" className="text-muted-foreground">
              Agora não
            </Button>
          )}
          <div className="flex items-center gap-2">
            {index > 0 && !isLastStep && (
              <Button {...skipProps} variant="ghost" size="sm" className="text-muted-foreground hidden sm:inline-flex">
                Pular tour
              </Button>
            )}
            {continuous && (
              <Button {...primaryProps} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5">
                {isLastStep ? "Concluir" : index === 0 ? "Começar tour" : "Próximo"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
