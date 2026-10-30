import { Check, ChevronDown, Search, X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useId, useMemo, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";
import type { SelectOption } from "./Select";

type MultiSelectProps = {
  value: string[];
  onValueChange?: (value: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  /** Optional: show this when selected is empty; usually driven by placeholder. */
  emptyLabel?: ReactNode;
  noResultsText?: string;
  clearText?: string;
  selectedCountText?: (count: number) => string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

/**
 * Searchable multi-select dropdown.
 * - Keeps the existing Select trigger style.
 * - Supports check/uncheck, search, and showing selected values.
 */
export function MultiSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  disabled,
  required,
  id,
  className,
  emptyLabel,
  noResultsText = "No results",
  clearText = "Clear",
  selectedCountText = (count) => `${count} selected`,
  ...aria
}: MultiSelectProps) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedOptions = useMemo(
    () => options.filter((o) => selectedSet.has(o.value)),
    [options, selectedSet],
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const haystack = `${o.label} ${o.description ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  const triggerLabel = useMemo(() => {
    if (selectedOptions.length === 0) return emptyLabel ?? placeholder ?? "";
    const labels = selectedOptions.map((o) => o.label);
    if (labels.length <= 2) return labels.join("、");
    return `${labels.slice(0, 2).join("、")} +${labels.length - 2}`;
  }, [emptyLabel, placeholder, selectedOptions]);

  const toggle = (optionValue: string, checked: boolean) => {
    if (!onValueChange) return;
    const next = checked
      ? Array.from(new Set([...value, optionValue]))
      : value.filter((v) => v !== optionValue);
    if (required && next.length === 0) return;
    onValueChange(next);
  };

  const clear = () => {
    if (!onValueChange) return;
    if (required) return;
    onValueChange([]);
  };

  const canClear = !disabled && !required && value.length > 0;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}>
      <PopoverPrimitive.Trigger asChild>
        <button
          aria-expanded={open}
          className={cn(
            "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border-strong bg-surface px-2.5 text-left text-sm text-fg transition-colors hover:border-fg-placeholder focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-fg-subtle aria-invalid:border-danger",
            className,
          )}
          disabled={disabled}
          id={id}
          type="button"
          {...aria}
        >
          <span className={cn("min-w-0 flex-1 truncate", selectedOptions.length === 0 && "text-fg-placeholder")}>
            {triggerLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            {canClear ? (
              <span
                className="rounded p-0.5 text-fg-subtle hover:bg-muted"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clear();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    clear();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={clearText}
              >
                <X aria-hidden="true" size={14} />
              </span>
            ) : null}
            <ChevronDown aria-hidden="true" className="shrink-0 text-fg-subtle" size={14} />
          </span>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={cn(
            "z-50 min-w-(--radix-popover-trigger-width) overflow-hidden rounded-md border bg-surface text-sm text-fg shadow-overlay data-[state=open]:animate-fade-in",
          )}
          align="start"
          sideOffset={4}
        >
          <div className="border-b p-2">
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-2 top-1/2 -translate-y-1/2 text-fg-subtle" size={14} />
              <Input
                id={inputId}
                className="h-8 pl-7"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-64 overflow-auto p-1">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const checked = selectedSet.has(option.value);
                const disableUncheck = required && checked && value.length === 1;
                return (
                  <label
                    className={cn(
                      "flex min-h-8 cursor-pointer select-none items-start gap-2 rounded px-2 py-1.5 pr-2 outline-none hover:bg-muted",
                      (option.disabled || disableUncheck) && "cursor-not-allowed opacity-50",
                    )}
                    key={option.value}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled || option.disabled || disableUncheck}
                      onCheckedChange={(next) => toggle(option.value, next === true)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate">{option.label}</span>
                        {checked ? <Check aria-hidden="true" className="shrink-0 text-primary" size={14} /> : null}
                      </span>
                      {option.description ? (
                        <span className="block truncate text-xs text-fg-subtle">{option.description}</span>
                      ) : null}
                    </span>
                  </label>
                );
              })
            ) : (
              <div className="px-2 py-2 text-xs text-fg-subtle">{noResultsText}</div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t p-2">
            <span className="text-xs text-fg-subtle">{selectedCountText(value.length)}</span>
            <Button
              size="sm"
              type="button"
              variant="ghost"
              disabled={!canClear}
              onClick={clear}
            >
              {clearText}
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
