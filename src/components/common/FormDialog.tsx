import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSubmit: (e: React.FormEvent) => void
  isPending?: boolean
  submitLabel?: string
  cancelLabel?: string
  children: React.ReactNode
  size?: "sm" | "default" | "lg"
}

export const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  isPending = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  children,
  size = "default",
}) => {
  const sizeClass = size === "lg" ? "sm:max-w-[600px]" : size === "sm" ? "sm:max-w-[400px]" : "sm:max-w-[425px]"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeClass} rounded-3xl border-none shadow-2xl`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">{title}</DialogTitle>
          {description && <DialogDescription className="font-bold text-slate-400">{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">{children}</div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl font-bold h-11 px-6 border-slate-200" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            <Button type="submit" variant="brand" className="rounded-xl font-bold h-11 px-6" disabled={isPending}>
              {isPending ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
