import React from "react";
import { WidgetProps } from "@rjsf/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const BaseInputTemplate = (props: WidgetProps) => {
    const {
        id,
        placeholder,
        required,
        readonly,
        disabled,
        value,
        onChange,
        onBlur,
        onFocus,
        autofocus,
        options,
        schema,
        label,
        rawErrors,
    } = props;

    const inputType = options.inputType || "text";

    return (
        <div className="mb-4">
            {/* Label is handled by FieldTemplate usually, but simple widgets might need it if not wrapped */}
            {/* RJSF default template handles label, but here we are overriding the widget */}

            <Input
                id={id}
                type={inputType as string}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                readOnly={readonly}
                value={value || ""}
                onChange={(event) => onChange(event.target.value)}
                onBlur={id ? () => onBlur(id, value) : undefined}
                onFocus={id ? () => onFocus(id, value) : undefined}
                autoFocus={autofocus}
                className={rawErrors && rawErrors.length > 0 ? "border-red-500" : ""}
            />
        </div>
    );
};
