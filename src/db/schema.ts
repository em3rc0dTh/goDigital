import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  doublePrecision,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
);

// GoDigital Specific Tables

export const bankAccounts = pgTable("bank_account", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  alias: text("alias").notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number"),
  currency: text("currency").notNull(), // PEN, USD
  type: text("type").notNull(), // personal, business
  holderName: text("holder_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => bankAccounts.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull(),
  date: timestamp("date").notNull(),
  originalDateString: text("original_date_string"),
  uuid: text("uuid").unique(), // For deduplication (account_number + date)
  metadata: text("metadata"), // JSON string for extra fields (nro_operacion, canal, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment Request Workflow Tables

export const businessUnits = pgTable("business_unit", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  adminId: text("admin_id").references(() => users.id), // Unit Admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const businessUnitTreasurers = pgTable(
  "business_unit_treasurer",
  {
    businessUnitId: uuid("business_unit_id")
      .notNull()
      .references(() => businessUnits.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.businessUnitId, t.userId] }),
  })
);

export const projects = pgTable("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  projectOwnerId: text("project_owner_id").references(() => users.id), // Project Owner
  businessUnitId: uuid("business_unit_id").references(() => businessUnits.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const providers = pgTable("provider", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  taxId: text("tax_id"), // RUC/NIF
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentRequests = pgTable("payment_request", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id),
  providerId: uuid("provider_id").references(() => providers.id),
  subtotal: doublePrecision("subtotal").notNull(),
  tax: doublePrecision("tax").notNull(),
  total: doublePrecision("total").notNull(),
  currency: text("currency").notNull(), // USD, PEN
  date: timestamp("date"),
  dueDate: timestamp("due_date"),
  creatorId: text("creator_id").references(() => users.id),
  notes: text("notes"),
  status: text("status").default("pending"), // pending, approved, authorized, paid, rejected
  paymentProof: text("payment_proof"), // URL to voucher
  approvedBy: text("approved_by").references(() => users.id), // Project Owner
  approvalNotes: text("approval_notes"),
  authorizedBy: text("authorized_by").references(() => users.id), // BU Admin
  authorizationNotes: text("authorization_notes"),
  paymentDate: timestamp("payment_date"),
  debitedAccountId: uuid("debited_account_id").references(() => bankAccounts.id),
  paidBy: text("paid_by").references(() => users.id), // Treasurer
  paymentNotes: text("payment_notes"),
  rejectedBy: text("rejected_by").references(() => users.id), // Any
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
