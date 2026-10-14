export const SHIPPING_FIELDS = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name', placeholder: 'Aarav Sharma' },
  { name: 'phone', label: 'Phone number', autoComplete: 'tel', placeholder: '98765 43210', inputMode: 'tel' },
  { name: 'addressLine1', label: 'Address', autoComplete: 'address-line1', placeholder: 'House no., street, area' },
  { name: 'city', label: 'City', autoComplete: 'address-level2', placeholder: 'Bengaluru' },
  { name: 'state', label: 'State', autoComplete: 'address-level1', placeholder: 'Karnataka' },
  { name: 'pincode', label: 'Pincode', autoComplete: 'postal-code', placeholder: '560001', inputMode: 'numeric', maxLength: 6 },
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const normalizePhone = (phone = '') =>
  phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');

/** Validates a single shipping field. Returns an error message or ''. */
export const validateShippingField = (name, rawValue = '') => {
  const value = String(rawValue).trim();
  const field = SHIPPING_FIELDS.find((f) => f.name === name);

  if (!value) return `${field?.label ?? 'This field'} is required.`;

  switch (name) {
    case 'fullName':
      return value.length < 2 ? 'Full name must be at least 2 characters.' : '';
    case 'phone':
      return /^[6-9]\d{9}$/.test(normalizePhone(value)) ? '' : 'Enter a valid 10-digit mobile number.';
    case 'pincode':
      return /^\d{6}$/.test(value) ? '' : 'Pincode must contain 6 digits.';
    default:
      return '';
  }
};

export const validateShipping = (values) =>
  SHIPPING_FIELDS.reduce((errors, { name }) => {
    const message = validateShippingField(name, values[name]);
    if (message) errors[name] = message;
    return errors;
  }, {});

export const normalizeShipping = (values) => ({
  fullName: values.fullName.trim(),
  phone: normalizePhone(values.phone.trim()),
  addressLine1: values.addressLine1.trim(),
  city: values.city.trim(),
  state: values.state.trim(),
  pincode: values.pincode.trim(),
});
