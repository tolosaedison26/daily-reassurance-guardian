import { useParams } from "react-router-dom";
import AcknowledgmentCard from "@/components/AcknowledgmentCard";

export default function AcknowledgmentPage() {
  const { token } = useParams();

  // Demo data — in production this would be fetched via token
  const demo = {
    seniorName: "Dorothy Wilson",
    seniorAge: 75,
    missedTime: "9:00 AM",
    alertSentTime: "9:45 AM",
    contactName: "Sarah Johnson",
    contactRelationship: "Daughter",
    seniorPhone: "+1 (555) 987-6543",
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <AcknowledgmentCard {...demo} />
    </div>
  );
}
