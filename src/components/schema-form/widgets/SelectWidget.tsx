import React, { useEffect, useState } from "react";
import { WidgetProps } from "@rjsf/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const SelectWidget = (props: WidgetProps) => {
    const {
        id,
        placeholder,
        required,
        disabled,
        readonly,
        value,
        onChange,
        options,
        onBlur,
        onFocus,
    } = props;



    const [loading, setLoading] = useState(false);
    const [internalOptions, setInternalOptions] = useState<any[]>(options.enumOptions as any[] || []);

    const apiSource = options.apiSource as string;
    const labelField = (options.labelField as string) || "name";
    const valueField = (options.valueField as string) || "id";

    useEffect(() => {
        if (options.enumOptions) {
            setInternalOptions(options.enumOptions as any[]);
        }
    }, [options.enumOptions, id]);

    useEffect(() => {
        if (!apiSource) return;
        const controller = new AbortController();

        const fetchOptions = async () => {
            setLoading(true);
            try {
                const res = await fetch(apiSource, { signal: controller.signal });
                const data = await res.json();
                if (!controller.signal.aborted && Array.isArray(data)) {
                    const mapOptions = data.map((item: any) => ({
                        label: item[labelField],
                        value: item[valueField],
                    }));
                    setInternalOptions(mapOptions);
                }
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    console.error("Failed to load options", err);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchOptions();

        return () => {
            controller.abort();
        };
    }, [apiSource, labelField, valueField]);

    return (
        <Select
            disabled={disabled || readonly || loading}
            onValueChange={(val) => onChange(val)}
            value={value ? String(value) : undefined}
        >
            <SelectTrigger id={id}>
                <SelectValue placeholder={placeholder || "Select option"} />
            </SelectTrigger>
            <SelectContent>
                {internalOptions.length > 0 ? (
                    internalOptions
                        .filter((option: any) => option.value !== undefined && option.value !== null)
                        .map((option: any) => (
                            <SelectItem key={String(option.value)} value={String(option.value)}>
                                {option.label}
                            </SelectItem>
                        ))
                ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                        No options loaded (Count: {internalOptions.length})
                    </div>
                )}
            </SelectContent>
        </Select>
    );
};
