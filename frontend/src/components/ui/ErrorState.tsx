import { useTranslation } from "react-i18next";
import Button from "./Button";

interface ErrorStateProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  message,
  title,
  onRetry = () => window.location.reload(),
  className = "",
}: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div role="alert" className={`bg-night-800 p-6 ${className}`}>
      <p className="font-semibold text-ink">{title ?? t("common.error.title")}</p>
      <p className="mt-1 text-sm text-ink-soft">{message}</p>
      <Button variant="secondary" className="mt-4" onClick={onRetry}>
        {t("common.error.retry")}
      </Button>
    </div>
  );
}