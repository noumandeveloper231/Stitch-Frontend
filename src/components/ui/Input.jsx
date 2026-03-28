import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const inputBaseClasses = [
  "w-full h-10 rounded-lg px-4 text-sm",
  "border border-[#cdcdcd]",
  "shadow",
  "placeholder:text-gray-500",
  "focus:outline-none focus:ring-3 focus:ring-[var(--app-accent-light,#d1d5db)] focus:border-[var(--app-accent-border,#d1d5db)]",
  "disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
  "bg-white",
];

function DatePickerInput(
  {
    className,
    value = "",
    onChange,
    placeholder,
    disabled,
    onDatePickerInteraction,
    type: _ignoredType,
    ...props
  },
  ref
) {
  const [open, setOpen] = React.useState(false);
  const dateValue = value && value.length >= 10 ? new Date(value + "T00:00:00") : undefined;
  const displayLabel = dateValue
    ? format(dateValue, "MMM d, yyyy")
    : placeholder ?? "Pick a date";

  const handleSelect = (date) => {
    const nextValue = date ? format(date, "yyyy-MM-dd") : "";
    onChange?.({
      target: { value: nextValue },
    });
    setOpen(false);
  };

  const preventNestedSubmitButtons = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("button");
    if (!button) return;
    const type = (button.getAttribute("type") || "").toLowerCase();
    if (!type || type === "submit") {
      event.preventDefault();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={ref}
          disabled={disabled}
          className={cn(
            ...inputBaseClasses,
            "flex items-center justify-between text-left",
            !dateValue && "text-gray-500",
            className
          )}
          onPointerDown={(event) => {
            props.onPointerDown?.(event);
            onDatePickerInteraction?.();
          }}
          {...props}
          type="button"
        >
          <span className="truncate">{displayLabel}</span>
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onClickCapture={preventNestedSubmitButtons}
        onPointerDownCapture={onDatePickerInteraction}
      >
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

const DatePickerInputForwarded = React.forwardRef(DatePickerInput);

const Input = React.forwardRef(
  ({ className, type = "text", value, onChange, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name ?? undefined;

    const renderControl =
      type === "date" ? (
        <DatePickerInputForwarded
          ref={ref}
          id={inputId}
          className={cn(error && "border-red-500 focus:ring-red-200", className)}
          value={value}
          onChange={onChange}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          ref={ref}
          value={value}
          onChange={onChange}
          className={cn(...inputBaseClasses, error && "border-red-500 focus:ring-red-200", className)}
          {...props}
        />
      );

    if (!label && !error) {
      return renderControl;
    }

    return (
      <div className="space-y-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
            {label}
          </label>
        ) : null}
        {renderControl}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export default Input;
