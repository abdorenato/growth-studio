"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onCheckedChange?: (checked: boolean) => void;
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, checked, ...props }, ref) => {
    return (
      <label
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer select-none",
          className
        )}
      >
        <span className="relative inline-block">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              onChange?.(e);
              onCheckedChange?.(e.target.checked);
            }}
            className="peer sr-only"
            {...props}
          />
          <span className="block w-4 h-4 rounded border border-input bg-background peer-checked:bg-primary peer-checked:border-primary transition" />
          <Check className="absolute top-0 left-0 w-4 h-4 text-primary-foreground opacity-0 peer-checked:opacity-100 transition" />
        </span>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
