'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import type { ProductFormData } from '@/types/product';
import { createProduct, updateProduct } from '@/services/product.service';
import { useCategories } from '@/hooks/useCategories';
import { formatCategory } from '@/lib/filters';
import { cn } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

// ---------------------------------------------------------------------------
// Form values — all strings so <input> elements stay controlled.
// Price and stock are numeric in the API but stored as strings here to allow
// intermediate input states like "1." without coercing the value prematurely.
// ---------------------------------------------------------------------------
interface FormValues {
  title:       string;
  description: string;
  price:       string;
  category:    string;
  stock:       string;
}

interface FormErrors {
  title?:       string;
  description?: string;
  price?:       string;
  category?:    string;
  stock?:       string;
}

// ---------------------------------------------------------------------------
// validate — pure function; returns an empty object when all fields are valid.
// ---------------------------------------------------------------------------
function validate(v: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!v.title.trim())
    errors.title = 'Title is required.';

  if (!v.description.trim())
    errors.description = 'Description is required.';

  const p = parseFloat(v.price);
  if (v.price.trim() === '' || isNaN(p))
    errors.price = 'Price must be a valid number.';
  else if (p < 0)
    errors.price = 'Price must be 0 or greater.';

  const s = parseInt(v.stock, 10);
  if (v.stock.trim() === '' || isNaN(s) || String(s) !== v.stock.trim())
    errors.stock = 'Stock must be a whole number 0 or greater.';
  else if (s < 0)
    errors.stock = 'Stock must be a whole number 0 or greater.';

  if (!v.category)
    errors.category = 'Please select a category.';

  return errors;
}

// ---------------------------------------------------------------------------
// ProductForm props
// ---------------------------------------------------------------------------
interface ProductFormProps {
  /** create — POST /products/add;  edit — PUT /products/{productId} */
  mode:           'create' | 'edit';
  /** Required when mode === 'edit'. */
  productId?:     number;
  /** Pre-populated values for edit mode (or partial defaults for create). */
  initialValues?: Partial<FormValues>;
}

// ---------------------------------------------------------------------------
// ProductForm — the shared create/edit form.
//
// State management:
//  - `values`       — controlled form state; updated on onChange (event handler, lint-safe)
//  - `touched`      — Set of field names the user has blurred (event handler, lint-safe)
//  - `errors`       — validation result; recalculated on submit + on blur
//  - `submitted`    — true after first submit attempt; enables showing all errors at once
//  - `isSubmitting` — true while the API request is in-flight; disables the submit button
//  - `submitError`  — non-null when the API call fails; kept until next submit attempt
//
// Validation strategy:
//  - On blur of an individual field: validate just that field, mark it touched.
//  - On submit: validate all fields, mark submitted=true; stop if errors exist.
//  - Show error for a field when: submitted || touched.has(field).
//
// Submission:
//  - All state updates happen inside the async handleSubmit event handler.
//  - No setState inside useEffect — fully lint-safe.
//  - isSubmitting=true before the await prevents duplicate submissions.
// ---------------------------------------------------------------------------
export default function ProductForm({
  mode,
  productId,
  initialValues = {},
}: ProductFormProps) {
  const router = useRouter();

  // ── Form state ────────────────────────────────────────────────────────
  const [values, setValues] = useState<FormValues>({
    title:       initialValues.title       ?? '',
    description: initialValues.description ?? '',
    price:       initialValues.price       ?? '',
    category:    initialValues.category    ?? '',
    stock:       initialValues.stock       ?? '',
  });

  const [errors,      setErrors]      = useState<FormErrors>({});
  const [touched,     setTouched]     = useState<Set<keyof FormValues>>(new Set());
  const [submitted,   setSubmitted]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Categories ────────────────────────────────────────────────────────
  const { categories, loading: catsLoading, error: catsError } = useCategories();

  // ── Helpers ───────────────────────────────────────────────────────────

  // Returns the error string for a field only if it should be visible.
  function fieldError(field: keyof FormValues): string | undefined {
    if (!submitted && !touched.has(field)) return undefined;
    return errors[field];
  }

  // Update a single form field — event handler, lint-safe.
  function handleChange(field: keyof FormValues, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Re-validate the changed field live once it's been touched.
    if (touched.has(field) || submitted) {
      setErrors(validate(next));
    }
  }

  // Mark a field as touched and validate on blur — event handler, lint-safe.
  function handleBlur(field: keyof FormValues) {
    const nextTouched = new Set(touched).add(field);
    setTouched(nextTouched);
    setErrors(validate(values));
  }

  // ── Submit ────────────────────────────────────────────────────────────
  // All setState calls here are in an async event handler — lint-safe.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);

    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return; // stop on validation failure

    setIsSubmitting(true);
    setSubmitError(null);

    // Build the typed payload — convert string inputs to correct numeric types.
    const payload: ProductFormData = {
      title:       values.title.trim(),
      description: values.description.trim(),
      price:       parseFloat(values.price),
      category:    values.category,
      stock:       parseInt(values.stock, 10),
    };

    try {
      if (mode === 'create') {
        await createProduct(payload);
        router.push('/products');
      } else {
        await updateProduct(productId!, payload);
        router.push(`/products/${productId}`);
      }
      // Note: after router.push the component will unmount, so no further
      // setState calls will run — no "setState on unmounted component" warning.
    } catch {
      setSubmitError(
        mode === 'create'
          ? 'Failed to create the product. Please try again.'
          : 'Failed to update the product. Please try again.',
      );
      setIsSubmitting(false);
    }
  }

  // ── Labels / copy ─────────────────────────────────────────────────────
  const isCreate  = mode === 'create';
  const heading   = isCreate ? 'Add Product'  : 'Edit Product';
  const submitLabel = isCreate ? 'Add Product' : 'Save Changes';
  const backHref  = isCreate ? '/products' : `/products/${productId}`;
  const backLabel = isCreate ? 'Back to Products' : 'Back to Product';

  // ── Textarea class helper ─────────────────────────────────────────────
  const textareaClass = cn(
    'w-full rounded-xl border py-2.5 px-4 text-sm text-gray-900 resize-none',
    'placeholder-gray-400 outline-none transition',
    'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
    fieldError('description')
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-gray-300',
  );

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500
                   hover:text-indigo-600 transition mb-6"
      >
        <ArrowLeft size={15} />
        {backLabel}
      </Link>

      {/* Page heading */}
      <h1 className="text-xl font-bold text-gray-900 mb-6">{heading}</h1>

      {/* Form card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-2xl">
        {/* Submit error banner */}
        {submitError && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl
                       px-4 py-3 text-sm text-red-700"
          >
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>{submitError}</span>
          </div>
        )}

        <form
          id={isCreate ? 'add-product-form' : 'edit-product-form'}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >
          {/* Title */}
          <Input
            id="product-title"
            label="Title"
            placeholder="e.g. iPhone 15 Pro"
            value={values.title}
            onChange={(e) => handleChange('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            error={fieldError('title')}
            disabled={isSubmitting}
          />

          {/* Description */}
          <div>
            <label
              htmlFor="product-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="product-description"
              rows={4}
              placeholder="Product description..."
              value={values.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              disabled={isSubmitting}
              className={textareaClass}
            />
            {fieldError('description') && (
              <p className="mt-1 text-xs text-red-500">{fieldError('description')}</p>
            )}
          </div>

          {/* Price + Category — two columns on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="product-price"
              label="Price ($)"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={values.price}
              onChange={(e) => handleChange('price', e.target.value)}
              onBlur={() => handleBlur('price')}
              error={fieldError('price')}
              disabled={isSubmitting}
            />

            <Select
              id="product-category"
              label="Category"
              value={values.category}
              onChange={(e) => handleChange('category', e.target.value)}
              onBlur={() => handleBlur('category')}
              error={fieldError('category')}
              disabled={isSubmitting || catsLoading}
            >
              <option value="">
                {catsLoading ? 'Loading categories…' : 'Select category'}
              </option>
              {!catsLoading && !catsError &&
                categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatCategory(cat)}
                  </option>
                ))}
              {catsError && (
                <option disabled>Could not load categories</option>
              )}
            </Select>
          </div>

          {/* Stock */}
          <div className="sm:w-1/2 sm:pr-2">
            <Input
              id="product-stock"
              label="Stock"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={values.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
              onBlur={() => handleBlur('stock')}
              error={fieldError('stock')}
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              id={isCreate ? 'submit-add-product' : 'submit-edit-product'}
              variant="primary"
              size="md"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isCreate ? <Plus size={15} /> : <Save size={15} />}
              {submitLabel}
            </Button>
            <Link
              href={backHref}
              id={isCreate ? 'cancel-add-product' : 'cancel-edit-product'}
              className={cn(
                'inline-flex items-center px-5 py-2 rounded-full text-sm font-medium',
                'border border-gray-300 text-gray-600 hover:bg-gray-50 transition',
                isSubmitting ? 'pointer-events-none opacity-50' : '',
              )}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
