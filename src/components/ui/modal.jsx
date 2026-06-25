import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCallback } from "react";

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

function assignRef(ref, node) {
  if (ref == null) return;
  if (typeof ref === "function") ref(node);
  else ref.current = node;
}

/** True when the event target is TinyMCE (or related) UI portaled to document.body. */
function isTinyMceAuxiliaryTarget(target) {
  const el = target instanceof Element ? target : target?.parentElement;
  if (!el) return false;

  let cur = el;
  while (cur) {
    const list = cur.classList;
    if (list) {
      for (const name of list) {
        // TinyMCE 6 uses tox-dialog, tox-button, etc.; bare ".tox" alone misses those.
        if (name === "tox" || name.startsWith("tox-")) return true;
      }
    }
    cur = cur.parentElement;
  }

  return Boolean(
    el.closest(".moxman-window") || el.closest(".tam-assetmanager-root"),
  );
}

/**
 * Modal dialog that uses Radix `modal={false}` so `disableOutsidePointerEvents` is off.
 * Default modal Dialog sets body pointer-events to none, which breaks TinyMCE dialogs/menus
 * rendered outside this content node. We add a manual backdrop for the same look.
 */
export default function Modal({
  open,
  onClose,
  onOpenChange,
  title,
  footer,
  children,
  contentClassName,
  contentRef: contentRefProp,
}) {
  const handleOpenChange = useCallback(
    (nextOpen) => {
      onOpenChange?.(nextOpen);
      if (!nextOpen) onClose?.();
    },
    [onClose, onOpenChange],
  );

  const setContentRef = useCallback(
    (node) => {
      assignRef(contentRefProp, node);
    },
    [contentRefProp],
  );

  const preventDismissForTinyMce = useCallback((event) => {
    const original = event.detail?.originalEvent;
    const target = original?.target ?? event.target;
    // Keep dialog open on any outside interaction; users close via X/Cancel explicitly.
    // This also safely allows TinyMCE auxiliary UI interactions.
    if (isTinyMceAuxiliaryTarget(target)) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
  }, []);

  return (
    <Dialog
      modal={false}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogPrimitive.Portal>
        <div
          aria-hidden
          className={cn(
            "fixed inset-0 z-50 bg-black/80 backdrop-blur-xs",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
          data-state={open ? "open" : "closed"}
        />
        <DialogPrimitive.Content
          ref={setContentRef}
          id="modal-root"
          className={cn(
            "fixed left-[50%] top-[50%] z-[51] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-300 bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-85 data-[state=open]:zoom-in-85 sm:rounded-xl",
            contentClassName,
          )}
          onPointerDownOutside={preventDismissForTinyMce}
          onFocusOutside={preventDismissForTinyMce}
          onInteractOutside={preventDismissForTinyMce}
        >
          {title ? (
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
          ) : null}
          {children}
          {footer ? <div className="pt-2">{footer}</div> : null}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
