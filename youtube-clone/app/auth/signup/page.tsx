"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Unable to create account");
      return;
    }

    const signInResult = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/",
    });

    if (signInResult?.error) {
      setError("Account created, but sign-in failed. Please sign in manually.");
      router.push("/auth/signin");
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen bg-yt-bg px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-2xl border border-yt-border bg-yt-card p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">Create Account</h1>
        <p className="mt-3 text-sm text-yt-secondary">Register to upload videos, manage your channel, and own your content.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-yt-secondary">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-yt-border bg-[#121212] px-4 py-3 text-sm text-white outline-none focus:border-yt-red"
            />
          </div>

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
            {submitting ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-yt-secondary">
          Already have an account? <Link href="/auth/signin" className="font-semibold text-white hover:text-yt-red">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
