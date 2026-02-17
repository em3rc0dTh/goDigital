import MissionControlDashboard from "@/components/mission-control/MissionControlDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mission Control | goDigital",
    description: "Financial Mission Control Dashboard",
};

export default function ManagementPage() {
    return <MissionControlDashboard />;
}
