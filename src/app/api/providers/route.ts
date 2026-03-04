// Our Providers
// TIPO DE PERSONA	TAX ID	NUMERO DE TAX ID	NOMBRE DEL PROVEEDOR	DIRECCION	ENTIDAD BANCARIA	MONEDA	NÚMERO DE CUENTA	CCI	CONDICION DE PAGO	NOMBRE DEL CONTACTO	TELEFONO	CORREO
// PJ	RUC	20509675491	Delta Electronics (Perú) INC. S.R.L.	Av. Pardo y Aliaga 699 Of. 601, San Isidro, Lima, Peru	CITIBANK	USD	0006324118	00700100000632411816		Alvaro Cruz	967265206	
// PJ	RUC	20418354781	ANIXTER PERU SAC	Calle Ontario 157	BCP	USD	194-1112239-1-46	002-194-001112239146-96		Maria Huillca	989581820	Maria.Huillca@anixter.com
// PJ	RUC	20602028306	FIBERMAX SAC	Calle Marco Nicolini 215 - Urb. Santa Catalina La Victoria - Lima, Perú	BCP	USD	193-2381353-1-79	00219300238135317917		Maria Andrade	958155646	maria.andrade@fibermax.pe
// PJ	RUC	20602142249	DASMITEC PERÚ SA	AV. INCA GARCILASO DE LA VEGA 1358 INT. 344 , LIMA	BCP	PEN	191-2434890-0-47 	002-1910024348900-47-53		Jacob Rakov	935329993	ventas@dasmitec.pe
// PJ	RUC	20609434393	COMERCIAL DE PRODUCTOS INTEGRAL YAJOMAR SAC	JR. AZANGARO NRO. 970 INT. 150 CERCADO DE LIMA - LIMA 	BCP	PEN	191-17091307-0-61	002-191-007091307061-54		Elena	998369901	comercial.yajomar@gmail.com
// On this JSON FORMAT
// const EntitySchema = new mongoose.Schema({
//     company_id: { type: String, required: true },
//     name: { type: String, required: true },
//     entity_classes: { type: [String], default: [] },
//     legal_class: {
//         type: String,
//         enum: ['legal-entity', 'natural-entity'],
//         required: true
//     },
//     business_type: { type: String },
//     vendor_type: { type: String },
//     identifiers: {
//         tax_id: { type: String },
//         national_id: { type: String },
//         registration_number: { type: String }
//     },
//     contact: {
//         email: { type: String },
//         phone: { type: String },
//         address: { type: String }
//     },
//     is_active: { type: Boolean, default: true }
// }, {
//     timestamps: true,
//     collection: 'entities'
// });

const MOCK_DATA = [
    {
        "company_id": "1",
        "name": "Delta Electronics (Perú) INC. S.R.L.",
        "entity_classes": ["legal-entity"],
        "legal_class": "legal-entity",
        "business_type": "Proveedor",
        "vendor_type": "Proveedor",
        "identifiers": {
            "tax_id": "20509675491",
            "national_id": "",
            "registration_number": ""
        },
        "contact": {
            "email": "",
            "phone": "967265206",
            "address": "Av. Pardo y Aliaga 699 Of. 601, San Isidro, Lima, Peru"
        },
        "is_active": true
    },
    {
        "company_id": "2",
        "name": "ANIXTER PERU SAC",
        "entity_classes": ["legal-entity"],
        "legal_class": "legal-entity",
        "business_type": "Proveedor",
        "vendor_type": "Proveedor",
        "identifiers": {
            "tax_id": "20418354781",
            "national_id": "",
            "registration_number": ""
        },
        "contact": {
            "email": "[EMAIL_ADDRESS]",
            "phone": "989581820",
            "address": "Calle Ontario 157"
        },
        "is_active": true
    },
    {
        "company_id": "3",
        "name": "FIBERMAX SAC",
        "entity_classes": ["legal-entity"],
        "legal_class": "legal-entity",
        "business_type": "Proveedor",
        "vendor_type": "Proveedor",
        "identifiers": {
            "tax_id": "20602028306",
            "national_id": "",
            "registration_number": ""
        },
        "contact": {
            "email": "[EMAIL_ADDRESS]",
            "phone": "958155646",
            "address": "Calle Marco Nicolini 215 - Urb. Santa Catalina La Victoria - Lima, Perú"
        },
        "is_active": true
    },
    {
        "company_id": "4",
        "name": "DASMITEC PERÚ SA",
        "entity_classes": ["legal-entity"],
        "legal_class": "legal-entity",
        "business_type": "Proveedor",
        "vendor_type": "Proveedor",
        "identifiers": {
            "tax_id": "20602142249",
            "national_id": "",
            "registration_number": ""
        },
        "contact": {
            "email": "ventas@dasmitec.pe",
            "phone": "935329993",
            "address": "AV. INCA GARCILASO DE LA VEGA 1358 INT. 344 , LIMA"
        },
        "is_active": true
    },
    {
        "company_id": "5",
        "name": "COMERCIAL DE PRODUCTOS INTEGRAL YAJOMAR SAC",
        "entity_classes": ["legal-entity"],
        "legal_class": "legal-entity",
        "business_type": "Proveedor",
        "vendor_type": "Proveedor",
        "identifiers": {
            "tax_id": "20609434393",
            "national_id": "",
            "registration_number": ""
        },
        "contact": {
            "email": "[EMAIL_ADDRESS]",
            "phone": "998369901",
            "address": "JR. AZANGARO NRO. 970 INT. 150 CERCADO DE LIMA - LIMA"
        },
        "is_active": true
    }
];

export async function GET() {
    return Response.json(MOCK_DATA);
}