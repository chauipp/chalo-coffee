import { Modal } from "@/components/shared/ui/Modal";

interface MobileFilterSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function MobileFilterSheet({
  open,
  onClose,
  title,
  children,
}: MobileFilterSheetProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      presentation="bottom-sheet"
    >
      <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>
    </Modal>
  );
}
