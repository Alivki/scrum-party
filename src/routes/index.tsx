import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import * as React from "react";
import { PhotoCapture } from "~/components/photo-capture";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authClient } from "~/lib/auth-client";
import { updateAvatar } from "~/lib/server-fns";
import { useCurrentUser } from "~/lib/session";

export const Route = createFileRoute("/")({
  component: JoinPage,
});

function JoinPage() {
  const navigate = useNavigate();
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (me.data) navigate({ to: "/party" });
  }, [me.data, navigate]);

  const mutation = useMutation({
    mutationFn: async (data: {
      username: string;
      password: string;
      avatar: string | null;
    }) => {
      setError(null);
      const username = data.username.trim().toLowerCase();
      const email = `${username}@scrum-party.local`;

      // 1. Try to sign in first. If credentials work, we're logged in.
      const signIn = await authClient.signIn.username({
        username,
        password: data.password,
      });

      if (signIn.data) {
        // If a new picture was supplied, refresh it.
        if (data.avatar) {
          try {
            await updateAvatar({ data: { avatar: data.avatar } });
          } catch {
            /* non-fatal */
          }
        }
        return { mode: "signin" as const };
      }

      // 2. Sign-in failed — assume new user, try to register. Better Auth's
      // `autoSignIn: true` means the user is logged in immediately on success.
      const signUp = await authClient.signUp.email({
        email,
        password: data.password,
        name: data.username.trim(),
        username,
      });

      if (signUp.error) {
        // If the username is taken, the user exists and the password they typed is wrong.
        const msg = signUp.error.message ?? "Klarte ikke å registrere.";
        const isExisting =
          msg.toLowerCase().includes("already") ||
          msg.toLowerCase().includes("exists") ||
          msg.toLowerCase().includes("taken");
        throw new Error(
          isExisting
            ? "Brukernavnet finnes allerede — sjekk passordet."
            : msg,
        );
      }

      // Attach the photo if one was uploaded during signup.
      if (data.avatar) {
        try {
          await updateAvatar({ data: { avatar: data.avatar } });
        } catch {
          /* non-fatal */
        }
      }

      return { mode: "signup" as const };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUser"] });
      navigate({ to: "/party" });
    },
    onError: (e: Error) => setError(e.message),
  });

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
      avatar: null as string | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.username.trim() || !value.password) return;
      await mutation.mutateAsync(value);
    },
  });

  return (
    <main className="min-h-screen flex flex-col bg-paper">
      <section className="flex-1 grid place-items-center px-5 py-10 md:py-16">
        <div className="w-full max-w-[440px] flex flex-col items-center">
          <div className="text-center mb-10">
            <h1 className="font-display tracking-tight leading-[0.86]">
              <span className="block text-[clamp(64px,16vw,140px)] text-ink">
                Scrum<span className="text-hot">fest</span>
              </span>
            </h1>
            <p className="caption-3 num mt-2">
              dataingeniør · scrumfest iterasjon 1
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="w-full space-y-6"
            noValidate
          >
            <form.Field
              name="username"
              validators={{
                onChange: ({ value }) =>
                  !value.trim()
                    ? undefined
                    : value.trim().length > 40
                      ? "Maks 40 tegn."
                      : undefined,
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Brukernavn</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="navn"
                    autoComplete="username"
                    autoFocus
                    maxLength={40}
                  />
                </div>
              )}
            />

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) =>
                  !value
                    ? undefined
                    : value.length < 6
                      ? "Minst 6 tegn."
                      : undefined,
              }}
              children={(field) => (
                <div>
                  <Label htmlFor={field.name}>Passord</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="••••••"
                    autoComplete="current-password"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="text-xs text-hot mt-2 font-mono">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            />

            <form.Field
              name="avatar"
              children={(field) => (
                <form.Subscribe
                  selector={(s) => s.values.username}
                  children={(name) => (
                    <PhotoCapture
                      value={field.state.value}
                      onChange={(v) => field.handleChange(v)}
                      fallbackInitials={
                        name?.trim()
                          ? name.trim().slice(0, 2).toUpperCase()
                          : "??"
                      }
                    />
                  )}
                />
              )}
            />

            {error && (
              <p
                role="alert"
                className="text-xs text-hot font-mono leading-tight bg-hot-tint/40 rounded-lg px-3 py-2 whitespace-pre-wrap"
              >
                {error}
              </p>
            )}

            <form.Subscribe
              selector={(s) =>
                [
                  s.canSubmit,
                  s.isSubmitting,
                  s.values.username,
                  s.values.password,
                ] as const
              }
              children={([canSubmit, isSubmitting, name, pwd]) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !canSubmit ||
                    !name.trim() ||
                    !pwd ||
                    isSubmitting ||
                    mutation.isPending
                  }
                >
                  {isSubmitting || mutation.isPending
                    ? "Logger inn…"
                    : "Logg inn / registrer"}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </Button>
              )}
            />

          </form>
        </div>
      </section>

      <footer className="px-5 md:px-10 py-3 border-t border-ink-3 flex items-center justify-between gap-3 flex-wrap">
        <span className="caption-3 num">dataingeniør · semester sluttfest</span>
      </footer>
    </main>
  );
}
