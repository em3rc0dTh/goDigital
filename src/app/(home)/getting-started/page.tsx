import { Metadata } from "next";
import GettingStarted from "@/components/utils/Started";

export const metadata: Metadata = {
  title: "GoDigital",
};

export default function Page() {
  return (
    <div className="flex h-screen">
      <GettingStarted />
    </div>
  );
}
