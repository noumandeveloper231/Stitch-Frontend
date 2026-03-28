import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Shared from/to date controls with Apply and Reset.
 * Pass optional `children` for extra controls (e.g. Orders date field + status).
 */
export default function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  onReset,
  children,
  className = "",
  label,
}) {
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  return (
    <div
      className={cn(
        className
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {children}
        <div className="space-y-1.5 sm:col-span-2">
          {label ? (
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {label}
            </Label>
          ) : null}
          <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={
                  "h-10   justify-start text-left shadow-sm font-normal"
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {from
                  ? to
                    ? `${format(new Date(`${from}T00:00:00`), "LLL dd, y")} - ${format(new Date(`${to}T00:00:00`), "LLL dd, y")}`
                    : format(new Date(`${from}T00:00:00`), "LLL dd, y")
                  : "Pick a date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={{
                  from: from ? new Date(`${from}T00:00:00`) : undefined,
                  to: to ? new Date(`${to}T00:00:00`) : undefined,
                }}
                onSelect={(range) => {
                  onFromChange(range?.from ? format(range.from, "yyyy-MM-dd") : "");
                  onToChange(range?.to ? format(range.to, "yyyy-MM-dd") : "");
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
