import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode } from "react";
import {
  useForm as useFormHook,
  type Control,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  type Path,
  type UseFormProps,
} from "react-hook-form";
import { type z } from "zod";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  FormField as UIFormField,
} from "~/components/ui/form";
import { Required } from "~/components/ui/required";

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
  return useFormHook<z.infer<TSchema>>({
    ...props,
    resolver: zodResolver(schema),
  });
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
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TContext extends Path<TFieldValues> = Path<unknown>,
>(props: {
  control: Control<TFieldValues, TContext>;
  name: TName;
  friendlyName: string | ReactNode;
  description?: string | ReactNode;
  required?: boolean;
  render: ControllerProps<TFieldValues, TContext>["render"];
}) {
  return (
    <UIFormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {props.friendlyName}
            {props.required && <Required />}
          </FormLabel>
          <FormControl>
            {props.render({
              //@ts-expect-error i cant type this any better
              field,
              formState: props.control._formState,
              fieldState: props.control.getFieldState(
                props.name,
                props.control._formState,
              ),
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
