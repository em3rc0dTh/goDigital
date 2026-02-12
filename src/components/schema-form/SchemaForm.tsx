"use client";

import React from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { RJSFSchema, UiSchema, RegistryWidgetsType } from "@rjsf/utils";
import { BaseInputTemplate } from "./templates/BaseInputTemplate";
import { TextareaWidget } from "./widgets/TextareaWidget";
import { SelectWidget } from "./widgets/SelectWidget";
import { RadioWidget } from "./widgets/RadioWidget";
import { DateWidget } from "./widgets/DateWidget";
import { ArrayFieldTemplate } from "./templates/ArrayFieldTemplate";
import { ObjectFieldTemplate } from "./templates/ObjectFieldTemplate";
import { ErrorList } from "./templates/ErrorList";

interface SchemaFormProps {
    schema: RJSFSchema;
    uiSchema?: UiSchema;
    formData?: any;
    onChange?: (e: any) => void;
    onSubmit?: (e: any) => void;
    onError?: (e: any) => void;
    className?: string;
}

import { FileWidget } from "./widgets/FileWidget";

const widgets: RegistryWidgetsType = {
    TextWidget: BaseInputTemplate,
    TextareaWidget: TextareaWidget,
    SelectWidget: SelectWidget,
    RadioWidget: RadioWidget,
    DateWidget: DateWidget,
    FileWidget: FileWidget,
};

export const SchemaForm: React.FC<SchemaFormProps> = ({
    schema,
    uiSchema,
    formData,
    onChange,
    onSubmit,
    onError,
    className,
}) => {

    // Helper to preprocess schema and uiSchema
    const { safeSchema, safeUiSchema } = React.useMemo(() => {
        const safeSchema = JSON.parse(JSON.stringify(schema));
        const safeUiSchema = uiSchema ? JSON.parse(JSON.stringify(uiSchema)) : {};

        if (safeSchema.properties) {
            Object.keys(safeSchema.properties).forEach((key) => {
                const prop = safeSchema.properties[key];

                // Fix missing type for file widgets
                if (!prop.type) {
                    if (prop["ui:widget"] === "file") {
                        prop.type = "string";
                        prop.format = "data-url"; // Standard for file widgets
                    } else if (prop["ui:widget"]) {
                        prop.type = "string"; // Default fallback
                    }
                }

                // Move ui:* props to uiSchema if needed
                // (RJSF might not support inline ui props in schema)
                const uiProps = Object.keys(prop).filter(k => k.startsWith("ui:"));
                if (uiProps.length > 0) {
                    if (!safeUiSchema[key]) safeUiSchema[key] = {};
                    uiProps.forEach(uiKey => {
                        safeUiSchema[key][uiKey] = prop[uiKey];
                        // Optional: delete from schema if strict validation is an issue
                        // delete prop[uiKey]; 
                    });
                }
            });
        }
        return { safeSchema, safeUiSchema };
    }, [schema, uiSchema]);

    return (
        <div className={className}>
            <Form
                schema={safeSchema}
                uiSchema={safeUiSchema}
                formData={formData}
                validator={validator}
                onChange={onChange}
                onSubmit={onSubmit}
                onError={onError}
                widgets={widgets}
                templates={{
                    ArrayFieldTemplate,
                    ObjectFieldTemplate,
                    ErrorListTemplate: ErrorList,
                    BaseInputTemplate,
                }}
                showErrorList={"top"}
                noHtml5Validate={true} // Use RJSF validation
            />
        </div>
    );
};
