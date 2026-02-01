import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Users, Building2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { EmployeeDialog } from '@/components/EmployeeDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import { useShops } from '@/hooks/useShops';
import { Employee, formatCurrency } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function Admin() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  const { data: shops } = useShops();
  const { data: employees, isLoading } = useEmployees(selectedShopId || undefined);
  const deleteEmployee = useDeleteEmployee();

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (employeeToDelete) {
      await deleteEmployee.mutateAsync(employeeToDelete.id);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Employee Management
            </h1>
            <p className="page-subtitle">Add, edit, and manage employee information</p>
          </div>
          <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto min-h-touch">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </motion.div>

        {/* Shop Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          <Button
            variant={selectedShopId === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedShopId(null)}
          >
            All Shops
          </Button>
          {shops?.map((shop) => (
            <Button
              key={shop.id}
              variant={selectedShopId === shop.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedShopId(shop.id)}
              className={cn(
                selectedShopId === shop.id &&
                  (shop.name === 'Classio' ? 'gradient-classio text-white border-0' : 'gradient-goodvibes text-white border-0')
              )}
            >
              {shop.name}
            </Button>
          ))}
        </motion.div>

        {/* Employee Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : employees?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
          >
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No employees yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by adding your first employee
            </p>
            <Button onClick={handleAdd} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {employees?.map((employee, index) => {
              const shop = shops?.find((s) => s.id === employee.shop_id);
              const isClassio = shop?.name === 'Classio';

              return (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl text-white font-semibold',
                          isClassio ? 'gradient-classio' : 'gradient-goodvibes'
                        )}
                      >
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {employee.employee_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-min-touch w-min-touch min-w-[44px] min-h-[44px] sm:h-8 sm:w-8"
                        onClick={() => handleEdit(employee)}
                        aria-label={`Edit ${employee.name}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-min-touch w-min-touch min-w-[44px] min-h-[44px] sm:h-8 sm:w-8 text-destructive"
                        onClick={() => handleDeleteClick(employee)}
                        aria-label={`Delete ${employee.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Designation</span>
                      <span className="font-medium">{employee.designation || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Base Salary</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(Number(employee.base_salary))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          isClassio
                            ? 'bg-classio/10 text-classio'
                            : 'bg-goodvibes/10 text-goodvibes'
                        )}
                      >
                        {shop?.name}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={selectedEmployee}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {employeeToDelete?.name}? This action
              cannot be undone and will also delete all associated salary records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
