import { Check, ShieldCheck, CreditCard, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useI18n } from '@/i18n/I18nProvider';

interface PaymentStatusFlowProps {
    status: string;
    dates?: {
        createdAt?: string;
        approvedAt?: string;
        authorizedAt?: string;
        paidAt?: string;
        rejectedAt?: string;
    };
}

export const PaymentStatusFlow: React.FC<PaymentStatusFlowProps> = ({ status, dates }) => {
    const { t } = useI18n();

    const steps = [
        { id: 'pending', label: t('PaymentRequestDetail.statusFlow.created'), icon: FileText, date: dates?.createdAt },
        { id: 'approved', label: t('PaymentRequestDetail.statusFlow.approved'), icon: Check, date: dates?.approvedAt },
        { id: 'authorized', label: t('PaymentRequestDetail.statusFlow.authorized'), icon: ShieldCheck, date: dates?.authorizedAt },
        { id: 'paid', label: t('PaymentRequestDetail.statusFlow.paid'), icon: CreditCard, date: dates?.paidAt },
    ];

    const currentStatus = status?.toLowerCase() || 'pending';
    const isRejected = currentStatus === 'rejected';

    const getStepStatus = (stepId: string, index: number) => {
        if (isRejected) {
            // simplified logic for rejection: if rejected, show rejected state
            return 'rejected';
        }

        const statusOrder = ['pending', 'approved', 'authorized', 'paid'];
        const currentIndex = statusOrder.indexOf(currentStatus);

        if (index < currentIndex) return 'completed';
        if (index === currentIndex) return 'current';
        return 'upcoming';
    };

    return (
        <div className="w-full py-6">
            <div className="relative flex items-center justify-between w-full">
                {/* Connecting Lines */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0 hidden sm:block"></div>

                <div className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 z-0 transition-all duration-500 hidden sm:block ${isRejected ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{
                        width: isRejected ? '100%' : `${(Math.max(0, ['pending', 'approved', 'authorized', 'paid'].indexOf(currentStatus)) / 3) * 100}%`
                    }}
                ></div>

                {/* Steps */}
                <div className="relative z-10 flex flex-col sm:flex-row justify-between w-full gap-4 sm:gap-0">
                    {steps.map((step, index) => {
                        const stepStatus = isRejected && index === steps.findIndex(s => s.id === currentStatus) // simplistic rejection logic
                            ? 'rejected'
                            : getStepStatus(step.id, index);

                        // If rejected, maybe we just want to show the specific rejection step differently, 
                        // or if the whole thing is rejected, maybe just show the last active step as rejected?
                        // For now, let's keep the happy path visualizer and handle rejection by overlay or distinct color if strictly needed.
                        // Actually, if rejected, let's just show it as a special final state or modify the current step.

                        // Revised logic for rejection within map: 
                        // If the process is rejected, we probably want to show where it stopped or if it was rejected overall.
                        // Let's assume standard flow for now.

                        const isCompleted = stepStatus === 'completed';
                        const isCurrent = stepStatus === 'current';
                        // const isUpcoming = stepStatus === 'upcoming';

                        return (
                            <div key={step.id} className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 flex-1 sm:flex-none">
                                {/* Icon Circle */}
                                <div className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 bg-background",
                                    isCompleted ? "border-green-500 bg-green-500 text-white" :
                                        isCurrent ? (isRejected ? "border-red-500 bg-red-50 text-red-500" : "border-blue-600 bg-white text-blue-600 shadow-md ring-4 ring-blue-50") :
                                            "border-gray-300 text-gray-300"
                                )}>
                                    {isCompleted ? <Check className="w-5 h-5" /> :
                                        isRejected && currentStatus === step.id ? <XCircle className="w-5 h-5" /> :
                                            <step.icon className="w-5 h-5" />}
                                </div>

                                {/* Label & Date */}
                                <div className="flex flex-col sm:items-center">
                                    <span className={cn(
                                        "text-sm font-medium capitalize",
                                        isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground",
                                        isRejected && currentStatus === step.id && "text-red-600"
                                    )}>
                                        {step.label}
                                    </span>
                                    {step.date && (
                                        <span className="text-xs text-muted-foreground hidden sm:block">
                                            {format(new Date(step.date), "MMM d, h:mm a")}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Vertical connector fix if needed, but horizontal usually scales ok with scroll or stack. 
                The current flex-col sm:flex-row handles stacking. 
                Ideally, for mobile, we might want a vertical stepper, but let's see how this looks.
            */}
        </div>
    );
};
