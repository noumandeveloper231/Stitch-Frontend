import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ModalActions({
  onCancel,
  onConfirm,
  loading = false,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
}) {
  return (
    <DialogFooter className="gap-2">
      <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button type="button" onClick={onConfirm} disabled={loading}>
        {loading ? "Saving..." : confirmLabel}
      </Button>
    </DialogFooter>
  );
}

export default function Modal({ open, onClose, title, footer, children }) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose?.() : null)}>
      <DialogContent>
        {title ? (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        ) : null}
        {children}
        {footer ? <div className="pt-2">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
