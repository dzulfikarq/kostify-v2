import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLang } from "@/i18n";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "violet" | "red" | "zinc";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmDialog({ open, title, description, confirmText, cancelText, tone = "violet", onConfirm, onCancel, loading }: Props) {
  const { t } = useLang();
  confirmText = confirmText || t("c.konfirmasi");
  cancelText = cancelText || t("c.batal");
  if (!open) return null;
  const toneClass = tone === "red" ? "bg-red-600 hover:bg-red-700" : tone === "zinc" ? "bg-zinc-900 hover:bg-black" : "bg-[#8550e6] hover:bg-[#7348d0]";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone === "red" ? "bg-red-100 text-red-600" : tone === "zinc" ? "bg-zinc-100 text-zinc-600" : "bg-[#f5f0ff] text-[#8550e6]"}`}>!</div>
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-900">{title}</h3>
            {description && <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>}
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={!!loading}> {cancelText} </Button>
          <Button className={`flex-1 shadow-sm ${toneClass}`} onClick={onConfirm} disabled={!!loading}> {loading ? "Memproses..." : confirmText} </Button>
        </div>
      </Card>
    </div>
  );
}
