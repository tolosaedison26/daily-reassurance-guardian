import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserMinus } from "lucide-react";

interface DisconnectSeniorDialogProps {
  seniorName: string;
  onConfirm: () => void;
  disconnecting?: boolean;
}

export default function DisconnectSeniorDialog({
  seniorName,
  onConfirm,
  disconnecting,
}: DisconnectSeniorDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-destructive/10 active:scale-95"
          aria-label={`Disconnect ${seniorName}`}
        >
          <UserMinus className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[340px] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black">Disconnect {seniorName}?</AlertDialogTitle>
          <AlertDialogDescription>
            You'll no longer see their daily check-ins. They can share a new invite code to reconnect.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={disconnecting}
            className="rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {disconnecting ? "Removing…" : "Disconnect"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
