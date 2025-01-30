import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { Alert } from './Alert';
import { useLanguage } from '@/contexts/LanguageContext';

export const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const { t } = useLanguage();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      <Card className="w-full max-w-md p-6">
        <form onSubmit={handleAuth} className="space-y-4">
          <h2 className="text-2xl font-bold text-center mb-6">
            {isSignUp ? t("create.account") : t("sign.in")}
          </h2>
          <Input
            type="email"
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("loading") : isSignUp ? t("sign.up") : t("sign.in")}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-500 hover:underline"
            >
              {isSignUp ? t("have.account") : t("need.account")}
            </button>
          </div>
        </form>
      </Card>
    </>
  );
};