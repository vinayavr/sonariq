type FormFieldProps = {
  label: string;
  children: React.ReactNode;
};

export function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink/75">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "h-11 rounded border border-ink/15 bg-white px-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-leaf focus:ring-2 focus:ring-leaf/20";

export const textareaClass =
  "min-h-28 rounded border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-leaf focus:ring-2 focus:ring-leaf/20";
