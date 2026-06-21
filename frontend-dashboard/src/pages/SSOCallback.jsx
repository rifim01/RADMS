/**
 * SSO Callback — /sso-callback
 *
 * Menerima token dari RAOS SSO Bridge dan set session Supabase.
 * RADMS dapat membuka halaman ini via redirect dari RAOS.
 *
 * URL format: /sso-callback?access_token=...&refresh_token=...&sso_source=raos
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase/config";

export default function SSOCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Memproses login SSO...");

  useEffect(() => {
    async function handleSSO() {
      const accessToken  = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setStatus("Token tidak valid. Silakan login manual.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        const { error } = await supabase.auth.setSession({
          access_token:  accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;

        setStatus("Login berhasil. Mengalihkan...");
        setTimeout(() => navigate("/dashboard"), 500);
      } catch (err) {
        console.error("SSO callback error:", err);
        setStatus("Gagal login SSO. Silakan login manual.");
        setTimeout(() => navigate("/login"), 2000);
      }
    }

    handleSSO();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600 text-sm">{status}</p>
      </div>
    </div>
  );
}
