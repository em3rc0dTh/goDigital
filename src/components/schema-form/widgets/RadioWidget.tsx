import React from "react";
import { WidgetProps } from "@rjsf/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export const RadioWidget = (props: WidgetProps) => {
    const {
        id,
        value,
        required,
        disabled,
        readonly,
        onChange,
        onBlur,
        onFocus,
        options,
    } = props;

    const { enumOptions, inline } = options;

    return (
        <RadioGroup
            id={id}
            value={value}
            onValueChange={(val) => onChange(val)}
            disabled={disabled || readonly}
            className={inline ? "flex flex-row gap-4" : "flex flex-col gap-2"}
        >
            {(enumOptions as any[])?.map((option: any, i: number) => {
                const itemValue = String(option.value);
                const itemLabel = option.label;
                return (
                    <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={itemValue} id={`${id}-${i}`} />
                        <Label htmlFor={`${id}-${i}`}>{itemLabel}</Label>
                    </div>
                );
            })}
        </RadioGroup>
    );
};
