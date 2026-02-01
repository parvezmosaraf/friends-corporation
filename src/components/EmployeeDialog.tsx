import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShops } from '@/hooks/useShops';
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/useEmployees';
import { Employee } from '@/lib/types';

const employeeSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(1, 'Name is required'),
  designation: z.string().optional(),
  base_salary: z.coerce.number().min(0, 'Salary must be positive'),
  shop_id: z.string().min(1, 'Shop is required'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}

export function EmployeeDialog({ open, onOpenChange, employee }: EmployeeDialogProps) {
  const { data: shops } = useShops();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const isEditing = !!employee;

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_id: '',
      name: '',
      designation: '',
      base_salary: 0,
      shop_id: '',
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        employee_id: employee.employee_id,
        name: employee.name,
        designation: employee.designation || '',
        base_salary: Number(employee.base_salary),
        shop_id: employee.shop_id,
      });
    } else {
      form.reset({
        employee_id: '',
        name: '',
        designation: '',
        base_salary: 0,
        shop_id: shops?.[0]?.id || '',
      });
    }
  }, [employee, shops, form]);

  const onSubmit = async (data: EmployeeFormData) => {
    if (isEditing) {
      await updateEmployee.mutateAsync({
        id: employee.id,
        ...data,
      });
    } else {
      await createEmployee.mutateAsync({
        employee_id: data.employee_id,
        name: data.name,
        designation: data.designation || null,
        base_salary: data.base_salary,
        shop_id: data.shop_id,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl>
                    <Input placeholder="EMP001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input placeholder="Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="base_salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Salary</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shop_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a shop" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shops?.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEmployee.isPending || updateEmployee.isPending}
              >
                {isEditing ? 'Save Changes' : 'Add Employee'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
