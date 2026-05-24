import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  loading?: boolean
  variant?: "danger" | "default"
  itemName?: string
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title = "Confirm Action",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  variant = "danger",
  itemName,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="rounded-3xl border-none shadow-2xl">
      <DialogHeader>
        <DialogTitle className={`text-xl font-black ${variant === "danger" ? "text-rose-600" : "text-slate-800"}`}>
          {title}
        </DialogTitle>
        <DialogDescription className="font-bold text-slate-400">
          {description || (itemName ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.` : "Are you sure? This action cannot be undone.")}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2 sm:gap-0 mt-4">
        <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-slate-200" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "destructive" : "default"}
          className={`rounded-xl font-bold h-11 px-6 ${variant === "danger" ? "bg-rose-600 hover:bg-rose-700" : ""}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Processing..." : confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)