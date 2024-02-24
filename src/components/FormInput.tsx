import { type UseFormReturnType } from "@mantine/form/lib/types";
import { Label } from "./ui/label";
import { Required } from "./ui/required";

export function FormInputGroup<Values>({
  children,
  label,
  description,
  required,
  form,
  formKey,
}: {
  children: React.ReactNode;
  label: string;
  description?: string;
  required?: boolean;

  formKey: keyof Values;
  form: UseFormReturnType<Values, any>;
}) {
  const inputProps = form.getInputProps(formKey);

  return (
    <div className="flex flex-col space-y-1">
      <Label>
        {label}
        {required && <Required />}
        {inputProps.error && (
          <span className="text-red-500"> - {inputProps.error}</span>
        )}
      </Label>
      {/* screen readers should probably read the description first */}
      {description && <div className="sr-only">{description}</div>}
      {children}
      {description && (
        <div className="text-sm text-gray-500">{description}</div>
      )}
    </div>
  );
}
