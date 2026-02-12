import mongoose, { Document, Model, Schema } from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";

export interface FormSchemaDocument extends Document {
    name: string;
    schema: any;
    uiSchema?: any;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FormSchemaSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    schema: { type: mongoose.Schema.Types.Mixed, required: true },
    uiSchema: { type: mongoose.Schema.Types.Mixed, default: {} },
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
    collection: 'form_schemas'
});

// Helper to get the model ensuring connection is established
export async function getFormSchemaModel(): Promise<Model<FormSchemaDocument>> {
    await connectToDatabase();
    // Prevent compiling model multiple times
    return mongoose.models.FormSchema as Model<FormSchemaDocument> || mongoose.model<FormSchemaDocument>("FormSchema", FormSchemaSchema);
}
