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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { FieldPath } from 'react-hook-form'; // Import FieldPath

interface FormProps<T extends z.ZodType<any, any, any>> {
  schema: T;
  onSubmit: (values: z.infer<T>) => void;
  fields: {
    name: FieldPath<z.infer<T>>; // Use FieldPath for name
    label: string;
    description?: string;
    type?: string;
  }[];
  categories?: { id: string; name: string; }[]; // Add categories prop
}

export function CustomForm<T extends z.ZodType<any, any, any>>({
  schema,
  onSubmit,
  fields,
  categories, // Destructure categories prop
}: FormProps<T>) {
  const defaultValues = fields.reduce((acc, field) => {
    if (field.type === 'number') {
      acc[field.name] = 0; // Default to 0 for number fields
    } else if (field.type === 'category-select') {
       acc[field.name] = []; // Default to empty array for category select
    }
    else {
      acc[field.name] = ''; // Default to empty string for other fields
    }
    return acc;
  }, {} as z.infer<T>);

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues, // Use generated default values
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
            render={({ field: formField }) => ( // Rename field to formField
              <FormItem>
                <FormLabel>{field.label}</FormLabel> {/* Use outer field.label */}
                <FormControl>
                  {field.type === 'category-select' && categories ? ( // Use outer field.type
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={category.id}
                            checked={formField.value?.includes(category.id)} // Use formField.value
                            onCheckedChange={(checked) => {
                              const currentValues = (formField.value as string[]) || []; // Explicitly cast to string[]
                              if (checked) {
                                formField.onChange([...currentValues, category.id]); // Use formField.onChange
                              } else {
                                formField.onChange(currentValues.filter((id: string) => id !== category.id)); // Use formField.onChange
                              }
                            }}
                          />
                          <Label htmlFor={category.id}>{category.name}</Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Input
                      type={field.type || "text"}
                      placeholder={field.label}
                      {...formField}
                      onChange={(e) => { // Add onChange handler
                        if (field.type === 'number') {
                          formField.onChange(Number(e.target.value)); // Parse as number
                        } else {
                          formField.onChange(e.target.value); // Otherwise, pass string value
                        }
                      }}
                    />
                  )}
                </FormControl>
                <FormDescription>
                  {field.description} {/* Use outer field.description */}
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