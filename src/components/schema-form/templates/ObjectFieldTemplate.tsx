import React from "react";
import { ObjectFieldTemplateProps } from "@rjsf/utils";

export const ObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
    return (
        <div className="mb-4">
            {props.title && (
                <h4 className="text-md font-semibold mb-2">{props.title}</h4>
            )}
            {props.description && (
                <p className="text-sm text-gray-500 mb-4">{props.description}</p>
            )}
            <div className="grid grid-cols-1 gap-4">
                {props.properties.map((element) => (
                    <div key={element.name} className="w-full">
                        {element.content}
                    </div>
                ))}
            </div>
        </div>
    );
};
