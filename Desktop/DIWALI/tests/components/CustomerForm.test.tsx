import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerForm } from '../../src/components/CustomerForm';
import { CustomerDetails } from '../../src/types/customer';

describe('CustomerForm Component', () => {
  const initialValues: CustomerDetails = {
    fullName: '',
    mobileNumber: '',
    fulfilmentPreference: 'COUNTER_PICKUP',
    ageConfirmed: true,
    notes: '',
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders all form input fields and fulfilment options', () => {
    render(
      <CustomerForm initialValues={initialValues} onSubmit={vi.fn()} />
    );

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/10-Digit Mobile Number/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Collection at the campus/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/Wholesale Enquiry/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Special Instructions \/ Notes/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('displays validation errors when submitted empty', () => {
    const handleSubmit = vi.fn();
    render(
      <CustomerForm initialValues={initialValues} onSubmit={handleSubmit} />
    );

    const submitBtn = screen.getByRole('button', {
      name: /Save & Continue to Review/i,
    });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText(/Please enter your full name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please enter a valid 10-digit Indian mobile number/i)
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('validates mobile number format strictly against Indian pattern', () => {
    const handleSubmit = vi.fn();
    render(
      <CustomerForm initialValues={initialValues} onSubmit={handleSubmit} />
    );

    const nameInput = screen.getByLabelText(/Full Name/i);
    const mobileInput = screen.getByLabelText(/10-Digit Mobile Number/i);
    const submitBtn = screen.getByRole('button', {
      name: /Save & Continue to Review/i,
    });

    fireEvent.change(nameInput, { target: { value: 'Ravi Kumar' } });

    // Test with invalid prefix (e.g., starts with 5)
    fireEvent.change(mobileInput, { target: { value: '5555555555' } });
    fireEvent.click(submitBtn);
    expect(
      screen.getByText(/Please enter a valid 10-digit Indian mobile number/i)
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();

    // Test with short number
    fireEvent.change(mobileInput, { target: { value: '98765' } });
    fireEvent.click(submitBtn);
    expect(
      screen.getByText(/Please enter a valid 10-digit Indian mobile number/i)
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();

    // Test with valid number (starts with 9)
    fireEvent.change(mobileInput, { target: { value: '9876543210' } });
    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      fullName: 'Ravi Kumar',
      mobileNumber: '9876543210',
      fulfilmentPreference: 'COUNTER_PICKUP',
      ageConfirmed: true,
      notes: '',
    });
  });

  it('allows selecting wholesale fulfilment preference and entering notes', () => {
    const handleSubmit = vi.fn();
    render(
      <CustomerForm initialValues={initialValues} onSubmit={handleSubmit} />
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Sita Devi' },
    });
    fireEvent.change(screen.getByLabelText(/10-Digit Mobile Number/i), {
      target: { value: '7890123456' },
    });

    // Select Wholesale Enquiry button
    const wholesaleBtn = screen.getByText(/Wholesale Enquiry/i).closest('button');
    expect(wholesaleBtn).toBeInTheDocument();
    fireEvent.click(wholesaleBtn!);

    // Fill notes
    fireEvent.change(screen.getByLabelText(/Special Instructions/i), {
      target: { value: 'Please pack in moisture-proof cartons' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Save & Continue to Review/i })
    );

    expect(handleSubmit).toHaveBeenCalledWith({
      fullName: 'Sita Devi',
      mobileNumber: '7890123456',
      fulfilmentPreference: 'SPECIAL_ENQUIRY',
      ageConfirmed: true,
      notes: 'Please pack in moisture-proof cartons',
    });
  });

  it('guarantees personal customer information is NEVER saved to localStorage', () => {
    const handleSubmit = vi.fn();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <CustomerForm initialValues={initialValues} onSubmit={handleSubmit} />
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Anand Sharma' },
    });
    fireEvent.change(screen.getByLabelText(/10-Digit Mobile Number/i), {
      target: { value: '9123456789' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Save & Continue to Review/i })
    );

    expect(handleSubmit).toHaveBeenCalled();
    // Verify no customer fields leaked into localStorage
    expect(localStorage.getItem('fullName')).toBeNull();
    expect(localStorage.getItem('mobileNumber')).toBeNull();
    expect(localStorage.getItem('customerDetails')).toBeNull();
    expect(setItemSpy).not.toHaveBeenCalled();

    setItemSpy.mockRestore();
  });
});
