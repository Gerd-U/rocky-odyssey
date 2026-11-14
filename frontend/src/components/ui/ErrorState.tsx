import Button from "./Button";

interface ErrorStateProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  message,
  title = "No se pudieron cargar los datos",
  onRetry = () => window.location.reload(),
  className = "",
}: ErrorStateProps) {
  return (
    <div role="alert" className={`bg-night-800 p-6 ${className}`}>
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{message}</p>
      <Button variant="secondary" className="mt-4" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}