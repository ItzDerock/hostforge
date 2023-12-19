import { zodResolver } from "@hookform/resolvers/zod";
import { useForm as useFormHook, type UseFormProps } from "react-hook-form";
import { type z } from "zod";

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
