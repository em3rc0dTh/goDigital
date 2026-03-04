import React from "react";
import { ArrayFieldTemplateProps } from "@rjsf/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

type ArrayFieldItem = {
    children: React.ReactNode;
    hasMoveDown: boolean;
    hasMoveUp: boolean;
    hasRemove: boolean;
    index: number;
    key: string;
    onDropIndexClick: (index: number) => (event?: any) => void;
    onReorderClick: (index: number, newIndex: number) => (event?: any) => void;
};

export const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{props.title}</h3>
                {props.canAdd && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={props.onAddClick}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Item
                    </Button>
                )}
            </div>

            {(props.items as unknown as ArrayFieldItem[]).map((element) => (
                <Card key={element.key} className="mb-4">
                    <CardContent className="pt-6 relative">
                        <div className="absolute top-2 right-2 flex gap-1 z-10">
                            {element.hasMoveUp && (
                                <Button type="button" variant="ghost" size="icon" onClick={element.onReorderClick(element.index, element.index - 1)}>
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                            )}
                            {element.hasMoveDown && (
                                <Button type="button" variant="ghost" size="icon" onClick={element.onReorderClick(element.index, element.index + 1)}>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            )}
                            {element.hasRemove && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={element.onDropIndexClick(element.index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {element.children}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
