import { Globe } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabase";

export const Header = () => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="w-full bg-white py-4 shadow-sm">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/galileo-logo.svg" 
            alt="Galileo" 
            className="h-6 md:h-8"
          />
        </Link>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/kyc"
              className={cn(
                "text-gray-600 hover:text-primary transition-colors",
                isActive("/kyc") && "text-primary font-semibold"
              )}
            >
              {t("individual.verification")}
            </Link>
            <Link
              to="/kyb"
              className={cn(
                "text-gray-600 hover:text-primary transition-colors",
                isActive("/kyb") && "text-primary font-semibold"
              )}
            >
              {t("business.verification")}
            </Link>
          </nav>

          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[40px] md:w-[140px] bg-white border-gray-200">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <SelectValue className="hidden md:inline">
                  <span className="hidden md:inline">
                    {language === "en" ? "English" : "French"}
                  </span>
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="en">
                <span className="md:hidden">English</span>
                <span className="hidden md:inline">English</span>
              </SelectItem>
              <SelectItem value="fr">
                <span className="md:hidden">Français</span>
                <span className="hidden md:inline">Français</span>
              </SelectItem>
            </SelectContent>
          </Select>

          {user && (
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};