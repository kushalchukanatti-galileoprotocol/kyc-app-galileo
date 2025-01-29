import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface AlertProps {
  message: string;
  type: "success" | "error";
  onClose?: () => void;
  duration?: number;
}

export const Alert = ({ message, type, onClose, duration = 5000 }: AlertProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-5">
      <div
        className={`flex items-center gap-2 p-4 rounded-lg shadow-lg ${
          type === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="ml-4"
        >
          <XCircle className="w-4 h-4 opacity-60 hover:opacity-100" />
        </button>
      </div>
    </div>
  );
};