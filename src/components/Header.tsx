import { Shield, Globe } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

export const Header = () => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="w-full bg-primary py-4">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-white" />
          <span className="text-xl font-bold text-white">SecureKYC</span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/kyc"
              className={cn(
                "text-white/80 hover:text-white transition-colors",
                isActive("/kyc") && "text-white font-semibold"
              )}
            >
              {t("individual.verification")}
            </Link>
            <Link
              to="/kyb"
              className={cn(
                "text-white/80 hover:text-white transition-colors",
                isActive("/kyb") && "text-white font-semibold"
              )}
            >
              {t("business.verification")}
            </Link>
          </nav>

          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <SelectValue>
                  {language === "en" ? "English" : "Français"}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
};