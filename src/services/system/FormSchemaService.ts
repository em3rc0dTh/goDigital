import { getFormSchemaModel, FormSchemaDocument } from "@/models/FormSchema";

export class FormSchemaService {

    async createSchema(data: any): Promise<FormSchemaDocument> {
        const FormSchema = await getFormSchemaModel();
        return await FormSchema.create(data) as unknown as FormSchemaDocument;
    }

    async getSchemaById(id: string): Promise<FormSchemaDocument | null> {
        const FormSchema = await getFormSchemaModel();
        return await FormSchema.findById(id);
    }

    async getSchemaByName(name: string): Promise<FormSchemaDocument | null> {
        const FormSchema = await getFormSchemaModel();
        return await FormSchema.findOne({ name });
    }

    async listSchemas(filter: any = {}): Promise<FormSchemaDocument[]> {
        const FormSchema = await getFormSchemaModel();
        return await FormSchema.find(filter);
    }

    async updateSchema(id: string, data: any): Promise<FormSchemaDocument | null> {
        const FormSchema = await getFormSchemaModel();
        return await FormSchema.findByIdAndUpdate(id, data, { new: true });
    }
}
