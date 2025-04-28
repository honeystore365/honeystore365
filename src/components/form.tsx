import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

interface FormProps<T extends z.ZodType<any, any, any>> {
  schema: T
  onSubmit: (values: z.infer<T>) => void
  fields: {
    name: string
    label: string
    description?: string
    type?: string
  }[]
}

export function CustomForm<T extends z.ZodType<any, any, any>>({
  schema,
  onSubmit,
  fields,
}: FormProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: {},
    mode: "onChange",
  })

  function handleSubmit(values: z.infer<T>) {
    onSubmit(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input type={field.type || "text"} placeholder={field.label} {...field} />
                </FormControl>
                <FormDescription>
                  {field.description}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit">Soumettre</Button>
      </form>
    </Form>
  )
}