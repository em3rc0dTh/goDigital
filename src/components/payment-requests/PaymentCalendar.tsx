
"use client";

import React, { useState, useMemo } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    addMonths,
    subMonths,
    isBefore,
    addDays,
    isToday
} from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

interface PaymentRequest {
    _id: string;
    project_id: { _id: string; name: string } | string;
    provider_id: { _id: string; name: string } | string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    dueDate: string;
    total: number;
}

interface PaymentCalendarProps {
    data: PaymentRequest[];
    className?: string;
}

export default function PaymentCalendar({ data, className }: PaymentCalendarProps) {
    const { t, locale } = useI18n();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDateLocale = () => (locale === 'es' ? es : enUS);

    // Helpers to navigate months
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const jumpToToday = () => setCurrentMonth(new Date());

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const localeObj = locale === 'es' ? es : enUS;
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: localeObj });
        const endDate = endOfWeek(monthEnd, { locale: localeObj });

        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth, locale]);

    // Group data by date
    const eventsByDate = useMemo(() => {
        const groups: Record<string, PaymentRequest[]> = {};

        data.forEach(item => {
            if (!item.dueDate) return;
            // Assuming string format YYYY-MM-DD or ISO
            const dateStr = item.dueDate.split('T')[0];
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(item);
        });

        return groups;
    }, [data]);

    const getDayStatusColor = (item: PaymentRequest) => {
        const today = new Date();
        const due = new Date(item.dueDate);
        const isOverdue = isBefore(due, new Date(today.setHours(0, 0, 0, 0)));
        const isNear = isBefore(due, addDays(today, 3));

        if (item.status === 'paid') return "bg-purple-100 text-purple-700 border-purple-200";
        if (isOverdue && item.status !== 'paid') return "bg-red-100 text-red-700 border-red-200";
        if (isNear && item.status !== 'paid') return "bg-yellow-100 text-yellow-700 border-yellow-200";
        return "bg-green-100 text-green-700 border-green-200";
    };

    const getStatusDot = (item: PaymentRequest) => {
        const today = new Date();
        const due = new Date(item.dueDate);
        const isOverdue = isBefore(due, new Date(today.setHours(0, 0, 0, 0)));
        const isNear = isBefore(due, addDays(today, 3));

        if (item.status === 'paid') return "bg-purple-500";
        if (isOverdue) return "bg-red-500";
        if (isNear) return "bg-yellow-500";
        return "bg-green-500";
    };

    return (
        <Card className={cn("shadow-sm border-muted-foreground/20", className)}>
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-xl capitalize">
                        {format(currentMonth, "MMMM yyyy", { locale: getDateLocale() })}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={jumpToToday}>
                        {t("Common.today") || "Today"}
                    </Button>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b bg-muted/30">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                        <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {/* Simple hack for localized weekdays, or just hardcode if acceptable. 
                                Better: create a dummy date for each weekday and format it. */}
                            {format(addDays(startOfWeek(new Date(), { locale: getDateLocale() }), i), "EEE", { locale: getDateLocale() })}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 auto-rows-fr">
                    {calendarDays.map((day) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const dayEvents = eventsByDate[dateKey] || [];
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "min-h-[100px] border-b border-r p-2 transition-colors hover:bg-muted/50 relative group",
                                    !isCurrentMonth && "bg-muted/10 text-muted-foreground/50",
                                    isTodayDate && "bg-accent/10"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                        "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                        isTodayDate ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                    )}>
                                        {format(day, "d")}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 hidden md:flex">
                                            {dayEvents.length}
                                        </Badge>
                                    )}
                                </div>

                                {/* Events List (Preview) */}
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map((event) => (
                                        <Popover key={event._id}>
                                            <PopoverTrigger asChild>
                                                <button className={cn(
                                                    "w-full text-left text-[10px] truncate px-1.5 py-0.5 rounded cursor-pointer border flex items-center gap-1.5",
                                                    getDayStatusColor(event)
                                                )}>
                                                    <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusDot(event))} />
                                                    <span className="truncate flex-1">
                                                        {typeof event.provider_id === 'object' ? event.provider_id.name : "Provider"}
                                                    </span>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-0" align="start">
                                                <div className="p-3 border-b bg-muted/10">
                                                    <div className="font-semibold text-sm flex items-center justify-between">
                                                        <span>Payment Request Details</span>
                                                        <Badge variant="outline">{event.status}</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">ID: #{event._id.slice(-6).toUpperCase()}</p>
                                                </div>
                                                <div className="p-3 space-y-2 text-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="text-muted-foreground text-xs">Project</div>
                                                        <div className="font-medium text-right truncate">
                                                            {typeof event.project_id === 'object' ? event.project_id.name : "N/A"}
                                                        </div>

                                                        <div className="text-muted-foreground text-xs">Provider</div>
                                                        <div className="font-medium text-right truncate">
                                                            {typeof event.provider_id === 'object' ? event.provider_id.name : "N/A"}
                                                        </div>

                                                        <div className="text-muted-foreground text-xs">Due Date</div>
                                                        <div className="font-medium text-right">
                                                            {format(new Date(event.dueDate), "PPP", { locale: getDateLocale() })}
                                                        </div>

                                                        <div className="text-muted-foreground text-xs">Amount</div>
                                                        <div className="font-bold text-right">
                                                            {event.currency} {event.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    ))}

                                    {dayEvents.length > 3 && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="w-full text-left text-[10px] text-muted-foreground hover:text-foreground pl-2 mt-1">
                                                    + {dayEvents.length - 3} more...
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-2">
                                                <h4 className="font-medium mb-2 text-sm">Events for {format(day, "MMM d")}</h4>
                                                <ScrollArea className="h-[200px]">
                                                    <div className="space-y-1">
                                                        {dayEvents.map(event => (
                                                            <div key={event._id} className={cn(
                                                                "p-2 rounded border text-xs flex justify-between",
                                                                getDayStatusColor(event)
                                                            )}>
                                                                <span className="truncate font-medium">
                                                                    {typeof event.provider_id === 'object' ? event.provider_id.name : "Provider"}
                                                                </span>
                                                                <span>{event.currency} {event.total}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
