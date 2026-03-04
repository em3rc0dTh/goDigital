import React from "react";
import { ErrorListProps } from "@rjsf/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const ErrorList = ({ errors }: ErrorListProps) => {
    return (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
                <ul className="list-disc pl-4">
                    {errors.map((error, i) => (
                        <li key={i}>{error.stack}</li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
};
