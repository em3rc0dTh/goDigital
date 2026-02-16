
import { db } from "@/db";
import {
    paymentRequests,
    users,
    projects,
    businessUnits,
    businessUnitTreasurers,
    providers,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { sendEmail } from "@/lib/mailgun";

export class PaymentRequestService {
    static async getDetails(id: string) {
        const request = await db
            .select()
            .from(paymentRequests)
            .where(eq(paymentRequests.id, id))
            .then((res) => res[0]);

        if (!request) throw new Error("Payment request not found");

        const project = request.projectId
            ? await db
                .select()
                .from(projects)
                .where(eq(projects.id, request.projectId))
                .then((res) => res[0])
            : null;

        const businessUnit = project?.businessUnitId
            ? await db
                .select()
                .from(businessUnits)
                .where(eq(businessUnits.id, project.businessUnitId))
                .then((res) => res[0])
            : null;

        const provider = request.providerId
            ? await db
                .select()
                .from(providers)
                .where(eq(providers.id, request.providerId))
                .then((res) => res[0])
            : null;

        const creator = request.creatorId
            ? await db
                .select()
                .from(users)
                .where(eq(users.id, request.creatorId))
                .then((res) => res[0])
            : null;

        const projectOwner = project?.projectOwnerId
            ? await db
                .select()
                .from(users)
                .where(eq(users.id, project.projectOwnerId))
                .then((res) => res[0])
            : null;

        const admin = businessUnit?.adminId
            ? await db
                .select()
                .from(users)
                .where(eq(users.id, businessUnit.adminId))
                .then((res) => res[0])
            : null;

        let treasurers: typeof users.$inferSelect[] = [];
        if (businessUnit) {
            const treasurerLinks = await db
                .select()
                .from(businessUnitTreasurers)
                .where(eq(businessUnitTreasurers.businessUnitId, businessUnit.id));

            if (treasurerLinks.length > 0) {
                treasurers = await db
                    .select()
                    .from(users)
                    .where(
                        inArray(
                            users.id,
                            treasurerLinks.map((t) => t.userId)
                        )
                    );
            }
        }

        return {
            request,
            project,
            businessUnit,
            provider,
            creator,
            projectOwner,
            admin,
            treasurers,
        };
    }

    static async approve(id: string, approverId: string) {
        const { request, creator, projectOwner, admin } = await this.getDetails(id);

        if (request.status !== "pending") {
            throw new Error("Request must be pending to be approved.");
        }

        // Verify approver is project owner
        // if (approverId !== projectOwner?.id) throw new Error("Only Project Owner can approve."); // Optional check

        await db
            .update(paymentRequests)
            .set({
                status: "approved",
                approvedBy: approverId,
                updatedAt: new Date(),
            })
            .where(eq(paymentRequests.id, id));

        // Notifications
        const subject = `Payment Request Approved: #${id.slice(-6)}`;

        // To Creator
        if (creator?.email) {
            await sendEmail({
                to: creator.email,
                subject,
                html: `<p>Your payment request has been approved by the Project Owner.</p>`,
                replyTo: "no-reply@godigital.com",
                text: "Your payment request has been approved.",
            });
        }

        // To Project Owner (Confirmation)
        if (projectOwner?.email && projectOwner.id !== approverId) {
            // If approver IS the project owner, they know. But user says "emails Project Owner (confirmation)"
            await sendEmail({
                to: projectOwner.email,
                subject,
                html: `<p>You approved the payment request.</p>`,
                replyTo: "no-reply@godigital.com",
                text: "You approved the payment request.",
            });
        }

        // To Admin (Action Required)
        if (admin?.email) {
            await sendEmail({
                to: admin.email,
                subject: `Start Authorization: Payment Request #${id.slice(-6)}`,
                html: `<p>A payment request is ready for your authorization.</p>`,
                replyTo: "no-reply@godigital.com",
                text: "A payment request is ready for your authorization.",
            });
        }

        return { success: true };
    }

    static async authorize(id: string, authorizerId: string) {
        const { request, creator, admin, treasurers } = await this.getDetails(id);

        if (request.status !== "approved") {
            throw new Error("Request must be approved to be authorized.");
        }

        await db
            .update(paymentRequests)
            .set({
                status: "authorized",
                authorizedBy: authorizerId,
                updatedAt: new Date(),
            })
            .where(eq(paymentRequests.id, id));

        // Notifications
        const subject = `Payment Request Authorized: #${id.slice(-6)}`;

        // To Creator
        if (creator?.email) {
            await sendEmail({
                to: creator.email,
                subject,
                html: `<p>Your payment request has been authorized and is sent to treasury.</p>`,
                replyTo: "no-reply@godigital.com",
                text: "Your payment request has been authorized.",
            });
        }

        // To Admin (Confirmation)
        if (admin?.email) {
            await sendEmail({
                to: admin.email,
                subject,
                html: `<p>You authorized the payment request.</p>`,
                replyTo: "no-reply@godigital.com",
                text: "You authorized the payment request.",
            });
        }

        // To Treasurers (Action Required)
        for (const treasurer of treasurers) {
            if (treasurer.email) {
                await sendEmail({
                    to: treasurer.email,
                    subject: `Action Required: Pay Request #${id.slice(-6)}`,
                    html: `<p>A payment request is authorized and pending payment.</p>`,
                    replyTo: "no-reply@godigital.com",
                    text: "A payment request is authorized and pending payment.",
                });
            }
        }
        return { success: true };
    }

    static async pay(id: string, payerId: string, paymentProof: string) {
        const { request, creator, treasurers } = await this.getDetails(id);

        if (request.status !== "authorized") {
            throw new Error("Request must be authorized to be paid.");
        }

        if (!paymentProof) throw new Error("Payment proof is required.");

        await db
            .update(paymentRequests)
            .set({
                status: "paid",
                paidBy: payerId,
                paymentProof,
                updatedAt: new Date(),
            })
            .where(eq(paymentRequests.id, id));

        // Notifications
        const subject = `Payment Request Paid: #${id.slice(-6)}`;

        // To Creator
        if (creator?.email) {
            await sendEmail({
                to: creator.email,
                subject,
                html: `<p>Your payment request has been paid. Voucher: <a href="${paymentProof}">View Voucher</a></p>`,
                replyTo: "no-reply@godigital.com",
                text: `Your payment request has been paid. Voucher: ${paymentProof}`,
            });
        }

        // To Treasurer (Confirmation)
        // Send to the SPECIFIC treasurer who paid, or all? User says "Treasurer (confirmation)".
        // We can filter by payerId if we knew who they were in the list, but effectively just sending to the current user (which is handled by the caller or we send it here).
        // Assuming payerId corresponds to a user.
        const payer = treasurers.find(t => t.id === payerId);
        if (payer?.email) {
            await sendEmail({
                to: payer.email,
                subject,
                html: `<p>You marked the request as paid.</p>`,
                replyTo: "no-reply@godigital.com",
                text: "You marked the request as paid.",
            });
        }

        return { success: true };
    }

    static async reject(id: string, rejectorId: string) {
        const { request, creator } = await this.getDetails(id);

        if (request.status === "paid" || request.status === "rejected") {
            // Usually can't reject after paid, but user said "any stage" (Action: Can be triggered at any stage).
            // However, rejecting a paid request implies refund or voiding. I'll allow it but update db.
        }

        await db
            .update(paymentRequests)
            .set({
                status: "rejected",
                rejectedBy: rejectorId,
                updatedAt: new Date(),
            })
            .where(eq(paymentRequests.id, id));

        // Notifications
        const subject = `Payment Request Rejected: #${id.slice(-6)}`;

        // To Creator
        if (creator?.email) {
            await sendEmail({
                to: creator.email,
                subject,
                html: `<p>Your payment request has been rejected.</p>`,
                replyTo: "no-reply@godigital.com",
                text: "Your payment request has been rejected.",
            });
        }

        // To Rejector? User says "Emails Creator and the user who rejected it."
        // We need to fetch the rejector user if not in our details list (which only had roles).
        // Rejector could be anyone authorized (PO, Admin, Treasurer).
        const rejector = await db.select().from(users).where(eq(users.id, rejectorId)).then(res => res[0]);
        if (rejector?.email) {
            await sendEmail({
                to: rejector.email,
                subject,
                html: `<p>You rejected the payment request.</p>`,
                replyTo: "no-reply@godigital.com",
                text: "You rejected the payment request.",
            });
        }

        return { success: true };
    }
}
