import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createIssues, updateIssue } from "~/lib/server-fns";
import type { Issue } from "~/lib/types";
import { calcStoryPoints, cn } from "~/lib/utils";

const PRESETS: { name: string; size: number; percent: number }[] = [
  { name: "Pils 0.5L", size: 500, percent: 4.7 },
  { name: "Pils 0.33L", size: 330, percent: 4.7 },
  { name: "Cider", size: 330, percent: 4.5 },
  { name: "Vin", size: 175, percent: 12 },
  { name: "Shot", size: 40, percent: 40 },
  { name: "G&T", size: 330, percent: 8 },
  { name: "Energi + vodka", size: 250, percent: 12 },
  { name: "Vann", size: 500, percent: 0 },
];

const SIZES = [20, 40, 100, 175, 250, 330, 400, 500, 660, 750, 1000];

interface Props {
  userId: string;
  initial?: Issue;
  onDone?: () => void;
}

export function IssueForm({ userId: _userId, initial, onDone }: Props) {
  const qc = useQueryClient();
  const isEditing = !!initial;

  const create = useMutation({
    mutationFn: (d: Parameters<typeof createIssues>[0]["data"]) =>
      createIssues({ data: d }),
  });
  const update = useMutation({
    mutationFn: (d: Parameters<typeof updateIssue>[0]["data"]) =>
      updateIssue({ data: d }),
  });

  const form = useForm({
    defaultValues: {
      title: initial?.title ?? "",
      drinkName: initial?.drinkName ?? "Pils 0.5L",
      drinkSizeMl: initial?.drinkSizeMl ?? 500,
      alcoholPercent: initial?.alcoholPercent ?? 4.7,
      quantity: 1,
    },
    onSubmit: async ({ value }) => {
      if (isEditing && initial) {
        await update.mutateAsync({
          id: initial.id,
          title: value.title,
          drinkName: value.drinkName,
          drinkSizeMl: value.drinkSizeMl,
          alcoholPercent: value.alcoholPercent,
        });
      } else {
        await create.mutateAsync(value);
      }
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["burndown"] });
      form.reset();
      onDone?.();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <form.Field
        name="title"
        validators={{
          onChange: ({ value }) =>
            !value.trim() ? "Trenger en tittel." : undefined,
        }}
        children={(field) => (
          <div>
            <Label htmlFor={field.name}>Tittel</Label>
            <Input
              id={field.name}
              placeholder="Hva er issuen?"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              maxLength={120}
              invalid={field.state.meta.errors.length > 0}
            />
            {field.state.meta.errors[0] && (
              <p className="text-xs text-hot mt-2 font-mono">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      />

      <form.Subscribe
        selector={(s) => ({
          drinkName: s.values.drinkName,
          drinkSizeMl: s.values.drinkSizeMl,
          alcoholPercent: s.values.alcoholPercent,
        })}
        children={(v) => (
          <div>
            <Label>Drink</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const active =
                  v.drinkName === p.name &&
                  v.drinkSizeMl === p.size &&
                  v.alcoholPercent === p.percent;
                return (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => {
                      form.setFieldValue("drinkName", p.name);
                      form.setFieldValue("drinkSizeMl", p.size);
                      form.setFieldValue("alcoholPercent", p.percent);
                    }}
                    className={cn("quickpick", active && "is-active")}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5">
        <form.Field
          name="drinkName"
          children={(field) => (
            <div>
              <Label htmlFor={field.name}>Eget navn</Label>
              <Input
                id={field.name}
                placeholder="navn på drinken"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                maxLength={60}
              />
            </div>
          )}
        />
        <form.Field
          name="drinkSizeMl"
          children={(field) => (
            <div>
              <Label htmlFor={field.name}>Volum</Label>
              <select
                id={field.name}
                value={String(field.state.value)}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                className="field appearance-none cursor-pointer"
              >
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s} ml
                  </option>
                ))}
              </select>
            </div>
          )}
        />
      </div>

      <form.Field
        name="alcoholPercent"
        children={(field) => (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <Label className="mb-0">Alkoholprosent</Label>
              <span className="num text-lg font-bold">
                {field.state.value.toFixed(1)}
                <span className="text-ink-3">%</span>
              </span>
            </div>
            <input
              id={field.name}
              type="range"
              min={0}
              max={50}
              step={0.1}
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: "var(--hot)" }}
            />
          </div>
        )}
      />

      {!isEditing && (
        <form.Field
          name="quantity"
          children={(field) => (
            <div>
              <Label className="mb-2">Antall</Label>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="Færre"
                    onClick={() =>
                      field.handleChange(Math.max(1, field.state.value - 1))
                    }
                    disabled={field.state.value <= 1}
                  >
                    −
                  </button>
                  <span className="stepper-value">{field.state.value}</span>
                  <button
                    type="button"
                    aria-label="Flere"
                    onClick={() =>
                      field.handleChange(Math.min(20, field.state.value + 1))
                    }
                    disabled={field.state.value >= 20}
                  >
                    +
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[2, 3, 6, 12].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => field.handleChange(n)}
                      className={cn(
                        "quickpick min-w-[3rem] justify-center",
                        field.state.value === n && "is-active",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        />
      )}

      <form.Subscribe
        selector={(s) => s.values}
        children={(values) => {
          const points = calcStoryPoints(values.drinkSizeMl, values.alcoholPercent);
          const qty = isEditing ? 1 : values.quantity;
          return (
            <div className="flex items-center justify-between rounded-xl bg-paper-2 px-4 py-3">
              <span className="caption-3">Story points</span>
              <span className="num font-bold text-3xl text-hot tabular-nums leading-none">
                {points * qty}
              </span>
            </div>
          );
        }}
      />

      <form.Subscribe
        selector={(s) => [s.canSubmit, s.isSubmitting] as const}
        children={([canSubmit, isSubmitting]) => (
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={
                !canSubmit ||
                isSubmitting ||
                create.isPending ||
                update.isPending
              }
            >
              {isEditing ? (
                <Save className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Plus className="h-4 w-4" strokeWidth={1.75} />
              )}
              {isEditing ? "Lagre" : "Legg til"}
            </Button>
          </div>
        )}
      />
    </form>
  );
}
