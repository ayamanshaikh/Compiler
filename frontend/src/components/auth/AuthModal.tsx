"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/context/AuthContext";
import { Lock, Mail, User, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, register } = useAuth();
  const [localMode, setLocalMode] = useState<"login" | "register" | null>(null);
  const mode = localMode ?? authModalMode;

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState(""); // login username or email

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClose = () => {
    setLocalMode(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    closeAuthModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        if (!identifier.trim() || !password) {
          setErrorMessage("Please enter both username/email and password.");
          setIsLoading(false);
          return;
        }
        await login(identifier.trim(), password);
        setSuccessMessage("Signed in successfully!");
        setTimeout(() => closeAuthModal(), 400);
      } else {
        if (!username.trim() || !email.trim() || !password) {
          setErrorMessage("All fields are required.");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage("Password must be at least 6 characters.");
          setIsLoading(false);
          return;
        }
        await register(username.trim(), email.trim(), password);
        setSuccessMessage("Account created successfully!");
        setTimeout(() => closeAuthModal(), 400);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={handleClose}
      title={mode === "login" ? "Welcome Back to CodeVista" : "Join CodeVista AI"}
      description={
        mode === "login"
          ? "Sign in to synchronize your curriculum mastery, practice solves, and custom settings."
          : "Create an account to preserve your learning progress and customize your developer workspace."
      }
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Tab switch */}
        <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setLocalMode("login");
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              mode === "login"
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setLocalMode("register");
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              mode === "register"
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success notification */}
        {successMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "login" ? (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="e.g. dev_alex or alex@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-9"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="Unique username (3-50 chars)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <Input
                    type="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              disabled={isLoading}
            >
              {isLoading
                ? "Processing..."
                : mode === "login"
                ? "Sign In to Account"
                : "Create Free Account"}
            </Button>
          </div>
        </form>

        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Accounts are 100% optional
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </Modal>
  );
}
