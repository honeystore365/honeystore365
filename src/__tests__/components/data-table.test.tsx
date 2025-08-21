import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { setupComponentTest } from '../utils/test-env-setup';

// Setup the test environment
setupComponentTest();

// Define test data and columns
interface TestData {
  id: string;
  name: string;
  email: string;
  status: string;
}

const testData: TestData[] = [
  { id: '1', name: 'محمد أحمد', email: 'mohamed@example.com', status: 'نشط' },
  { id: '2', name: 'فاطمة علي', email: 'fatima@example.com', status: 'غير نشط' },
  { id: '3', name: 'أحمد محمود', email: 'ahmed@example.com', status: 'نشط' },
];

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: 'الاسم',
  },
  {
    accessorKey: 'email',
    header: 'البريد الإلكتروني',
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
  },
];

describe('DataTable Component', () => {
  it('renders table with correct headers', () => {
    render(<DataTable columns={columns} data={testData} />);

    // Check for column headers
    expect(screen.getByText('الاسم')).toBeInTheDocument();
    expect(screen.getByText('البريد الإلكتروني')).toBeInTheDocument();
    expect(screen.getByText('الحالة')).toBeInTheDocument();
  });

  it('renders table with correct data', () => {
    render(<DataTable columns={columns} data={testData} />);

    // Check for data in the table
    expect(screen.getByText('محمد أحمد')).toBeInTheDocument();
    expect(screen.getByText('fatima@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('نشط').length).toBe(2);
    expect(screen.getByText('غير نشط')).toBeInTheDocument();
  });

  it('renders empty table when no data is provided', () => {
    render(<DataTable columns={columns} data={[]} />);

    // Check for empty state
    expect(screen.getByText('الاسم')).toBeInTheDocument(); // Headers should still be visible
    expect(screen.queryByText('محمد أحمد')).not.toBeInTheDocument(); // Data should not be visible
  });

  it('is accessible', async () => {
    const { container } = render(<DataTable columns={columns} data={testData} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
