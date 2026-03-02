import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { type ReactNode } from "react";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  children: ReactNode;
}

export default function HelpModal({ open, onClose, title, icon, children }: HelpModalProps) {
  const isMobile = useIsMobile();

  const body = (
    <div className="space-y-3">
      <div className="text-sm leading-[1.7] text-muted-foreground">{children}</div>
      <div className="flex justify-end pt-2">
        <Button size="sm" onClick={onClose} className="rounded-xl font-bold">
          Got it
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <span>{icon}</span> {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[480px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <span>{icon}</span> {title}
          </DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
