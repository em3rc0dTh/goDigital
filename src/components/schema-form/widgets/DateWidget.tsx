import React from "react";
import { WidgetProps } from "@rjsf/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export const DateWidget = (props: WidgetProps) => {
    const {
        id,
        required,
        disabled,
        readonly,
        value,
        onChange,
        onBlur,
        onFocus,
    } = props;

    const [date, setDate] = React.useState<Date | undefined>(
        value ? new Date(value) : undefined
    );

    React.useEffect(() => {
        if (value) {
            if (value instanceof Date) {
                setDate(value);
            } else if (typeof value === 'string') {
                // Try parsing YYYY-MM-DD
                if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    const [y, m, d] = value.split('-').map(Number);
                    setDate(new Date(y, m - 1, d));
                } else {
                    // Handle ISO strings or other formats
                    const d = new Date(value);
                    if (!isNaN(d.getTime())) {
                        setDate(d);
                    }
                }
            }
        } else {
            setDate(undefined);
        }
    }, [value]);

    const handleSelect = (newDate: Date | undefined) => {
        setDate(newDate);
        if (newDate) {
            onChange(format(newDate, "yyyy-MM-dd"));
        } else {
            onChange(undefined);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant={"outline"}
                    disabled={disabled || readonly}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
};
