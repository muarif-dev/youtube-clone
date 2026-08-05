"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen bg-yt-bg px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-2xl border border-yt-border bg-yt-card p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">Sign In</h1>
        <p className="mt-3 text-sm text-yt-secondary">Use your account to access uploads and manage your channel.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-yt-secondary">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-yt-border bg-[#121212] px-4 py-3 text-sm text-white outline-none focus:border-yt-red"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-yt-secondary">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-yt-border bg-[#121212] px-4 py-3 text-sm text-white outline-none focus:border-yt-red"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-yt-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#CC0000] disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-yt-secondary">
          Don&apos;t have an account? <Link href="/auth/signup" className="font-semibold text-white hover:text-yt-red">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
