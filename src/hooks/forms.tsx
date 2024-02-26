import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode } from "react";
import {
  useForm as useFormHook,
  useFormState,
  type Control,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  type Path,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import { type z } from "zod";
import { Button } from "~/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  FormField as UIFormField,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Required } from "~/components/ui/required";
import { cn } from "~/utils/utils";

// type UseFormData<TFieldValues, TContext> = UseFormProps<TFieldValues

/**
 * Abstraction on top of react-hook-form so you dont have to repeat boilerplate
 * Automatically z.infer's the schema and sets the resolver
 *
 * @param data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useForm<TSchema extends z.Schema<any>, TContext = any>(
  schema: TSchema,
  props: UseFormProps<z.infer<TSchema>, TContext> = {},
) {
  const form = useFormHook<z.infer<TSchema>>({
    ...props,
    resolver: zodResolver(schema),
  });

  return form;
}

/**
 * An abstraction on top of shadcn/ui's FormField
 * Automatically fills out the rest of the UIFormField, just pass a render prop
 *
 * @example
 * ```tsx
 * <FormField
 *  control={form.control}
 *  name="name"
 *  friendlyName="Your Name"
 *  description="Your full name"
 *  required
 *  render={({ field }) => (
 *    <Input {...field} />
 *  )}
 * />
 * ```
 *
 * @param props
 * @returns
 */
export function SimpleFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TContext extends Path<TFieldValues> = Path<unknown>,
>(props: {
  control: Control<TFieldValues, TContext>;
  name: TName;
  friendlyName: string | ReactNode;
  description?: string | ReactNode;
  required?: boolean;
  render?: ControllerProps<TFieldValues, TContext>["render"];
  className?: string;
}) {
  const render = props.render ?? (({ field }) => <Input {...field} />);

  return (
    <UIFormField
      control={props.control}
      name={props.name}
      render={({ field, fieldState, formState }) => (
        <FormItem className={props.className}>
          <FormLabel>
            {props.friendlyName}
            {props.required && <Required />}
          </FormLabel>
          <FormControl>
            {render({
              //@ts-expect-error i cant type this any better
              field,
              fieldState,
              formState,
            })}
          </FormControl>
          {props.description && (
            <FormDescription>{props.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function FormSubmit({
  form,
  className,
  hideUnsavedChangesIndicator,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<z.infer<any>>;
  className?: string;
  hideUnsavedChangesIndicator?: boolean;
}) {
  return (
    <div className={cn("flex flex-row items-center gap-4", className)}>
      <Button type="submit" isLoading={form.formState.isSubmitting}>
        Save
      </Button>

      {/* does not work for some reason */}
      {/* <Button
        type="reset"
        variant="secondary"
        disabled={form.formState.isSubmitting || !form.formState.isDirty}
        onClick={() => {
          form.reset();
        }}
      >
        Reset
      </Button> */}
      {/* unsaved changes indicator */}
      {!hideUnsavedChangesIndicator && (
        <FormUnsavedChangesIndicator form={form.control} />
      )}
    </div>
  );
}

export function FormUnsavedChangesIndicator({
  form: control,
  className,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form?: UseFormReturn<z.infer<any>>["control"];
  className?: string;
}) {
  const form = useFormState({ control });

  return (
    <AnimatePresence>
      {form.isDirty && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`text-sm text-red-500 ${className}`}
        >
          You have unsaved changes!
        </motion.p>
      )}
    </AnimatePresence>
  );
}
