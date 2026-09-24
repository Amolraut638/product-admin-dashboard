import { Star } from 'lucide-react';
import type { ProductReview } from '@/types/product';

// ---------------------------------------------------------------------------
// StarRating — renders filled/empty stars
// ---------------------------------------------------------------------------
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ReviewCard — a single review
// ---------------------------------------------------------------------------
function ReviewCard({ review }: { review: ProductReview }) {
  const formattedDate = review.date
    ? new Date(review.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Avatar initial */}
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold
                          flex items-center justify-center shrink-0 uppercase">
            {review.reviewerName?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{review.reviewerName ?? 'Anonymous'}</p>
            {formattedDate && (
              <p className="text-xs text-gray-400">{formattedDate}</p>
            )}
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>

      {review.comment && (
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProductReviews — list of reviews or empty state
// ---------------------------------------------------------------------------
interface ProductReviewsProps {
  reviews: ProductReview[];
}

export default function ProductReviews({ reviews }: ProductReviewsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Reviews{reviews.length > 0 ? ` (${reviews.length})` : ''}
      </h2>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, idx) => (
            <ReviewCard key={idx} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
