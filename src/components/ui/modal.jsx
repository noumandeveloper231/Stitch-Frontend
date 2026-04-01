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

export default function Modal({ open, onClose, title, footer, children, contentClassName }) {
  const allowTinyMceAuxClick = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (
      target.closest(".tox-tinymce-aux") ||
      target.closest(".moxman-window") ||
      target.closest(".tam-assetmanager-root")
    ) {
      event.preventDefault();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose?.() : null)}>
      <DialogContent className={contentClassName} onInteractOutside={allowTinyMceAuxClick}>
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
