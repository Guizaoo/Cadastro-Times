import React, { useEffect, useMemo, useState } from "react";
import { InputField } from "../components/ui";
import {
  authRememberKey,
  supabase,
  supabaseConfigError,
} from "../services/supabase";

const initialLogin = {
  email: "",
  senha: "",
  lembrar: false,
};

const initialRegister = {
  nome: "",
  email: "",
  senha: "",
  confirmar: "",
  aceitar: false,
};

export function AuthPage({ onLoginSuccess }) {
  const [view, setView] = useState("login");
  const [loginData, setLoginData] = useState(initialLogin);
  const [registerData, setRegisterData] = useState(initialRegister);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState(null);

  const isLogin = view === "login";

  useEffect(() => {
    if (!supabase) {
      setError(supabaseConfigError);
      return;
    }

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      setUser(sessionError ? null : data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target;
    setLoginData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegisterChange = (event) => {
    const { name, value, type, checked } = event.target;
    setRegisterData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const registerStatus = useMemo(() => {
    if (!registerData.senha || !registerData.confirmar) return "";
    return registerData.senha === registerData.confirmar
      ? "Senha confirmada."
      : "As senhas não conferem.";
  }, [registerData.confirmar, registerData.senha]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback("");
    setError("");

    if (!supabase) {
      setError(supabaseConfigError);
      return;
    }

    setBusy(true);

    try {
      if (isLogin) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            authRememberKey,
            loginData.lembrar ? "true" : "false"
          );
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.senha,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        setFeedback(
          loginData.lembrar
            ? "Login realizado! Sua sessão fica salva neste navegador."
            : "Login realizado! Sua sessão será mantida apenas nesta aba."
        );
        onLoginSuccess?.();
      } else {
        if (registerData.senha !== registerData.confirmar) {
          setError("As senhas precisam ser iguais.");
          return;
        }

        if (!registerData.aceitar) {
          setError("Você precisa aceitar os termos para continuar.");
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: registerData.email,
          password: registerData.senha,
          options: {
            data: {
              full_name: registerData.nome,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        setFeedback(
          "Cadastro criado! Verifique seu e-mail para confirmar o acesso."
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
      } else {
        setFeedback("Você saiu da sua conta.");
      }
    } finally {
      setBusy(false);
    }
  };

  //  Render
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_45%),radial-gradient(circle_at_bottom,rgba(30,41,59,0.85),rgba(2,6,23,1))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-900/85 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.75)] backdrop-blur">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl font-extrabold tracking-[0.2em] text-slate-100">
                JG
              </span>
              <span className="rounded-xl border border-amber-300/70 px-4 py-1 text-xl font-semibold tracking-[0.2em] text-amber-200">
                CUP
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">
                {isLogin ? "Acesse sua conta" : "Crie sua conta"}
              </h1>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 shadow-inner shadow-black/40"
          >
            {user && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                Você está conectado como {user.email}.
              </div>
            )}
            {isLogin ? (
              <>
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-semibold text-slate-200"
                    htmlFor="email"
                  >
                    E-mail
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/40">
                    <input
                      id="email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      placeholder="voce@email.com"
                      type="email"
                      className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <InputField
                  id="senha"
                  label="Senha"
                  value={loginData.senha}
                  onChange={handleLoginChange}
                  placeholder="Digite sua senha"
                  type="password"
                  className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                />
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="lembrar"
                      checked={loginData.lembrar}
                      onChange={handleLoginChange}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-amber-400 focus:ring-amber-400/60"
                    />
                    Lembrar acesso
                  </label>
                  <button
                    type="button"
                    className="text-amber-200 hover:text-amber-100"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </>
            ) : (
              <>
                <InputField
                  id="nome"
                  label="Nome completo"
                  value={registerData.nome}
                  onChange={handleRegisterChange}
                  placeholder="Seu nome"
                  className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                />
                <InputField
                  id="email"
                  label="E-mail"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="voce@email.com"
                  type="email"
                  className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    id="senha"
                    label="Senha"
                    value={registerData.senha}
                    onChange={handleRegisterChange}
                    placeholder="Crie uma senha"
                    type="password"
                    className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                  />
                  <InputField
                    id="confirmar"
                    label="Confirmar senha"
                    value={registerData.confirmar}
                    onChange={handleRegisterChange}
                    placeholder="Repita a senha"
                    type="password"
                    className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                {registerStatus && (
                  <p
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      registerStatus === "Senha confirmada."
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-100"
                    }`}
                  >
                    {registerStatus}
                  </p>
                )}
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    name="aceitar"
                    checked={registerData.aceitar}
                    onChange={handleRegisterChange}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-amber-400 focus:ring-amber-400/60"
                  />
                  Li e aceito os termos de uso e política da copa.
                </label>
              </>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                {error}
              </div>
            )}

            {feedback && (
              <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                {feedback}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-amber-400 to-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-300 hover:to-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300/70 disabled:cursor-not-allowed disabled:from-amber-200 disabled:to-amber-200 sm:w-auto"
              >
                {busy ? "Processando..." : isLogin ? "Entrar" : "Criar conta"}
              </button>
              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-100"
                >
                  Sair da conta
                </button>
              )}
            </div>
            <div className="text-center text-xs text-slate-400">
              {isLogin ? (
                <>
                  Ainda não tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setView("register");
                      setFeedback("");
                      setError("");
                    }}
                    className="font-semibold text-amber-200 hover:text-amber-100"
                  >
                    Registrar-se
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setView("login");
                      setFeedback("");
                      setError("");
                    }}
                    className="font-semibold text-amber-200 hover:text-amber-100"
                  >
                    Entrar
                  </button>
                </>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
