import React from "react";
import { WidgetProps } from "@rjsf/utils";
import { Textarea } from "@/components/ui/textarea";

export const TextareaWidget = (props: WidgetProps) => {
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
        rawErrors
    } = props;

    return (
        <Textarea
            id={id}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readonly}
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            onBlur={id ? () => onBlur(id, value) : undefined}
            onFocus={id ? () => onFocus(id, value) : undefined}
            autoFocus={autofocus}
            rows={options.rows as number || 3}
            className={rawErrors && rawErrors.length > 0 ? "border-red-500" : ""}
        />
    );
};
