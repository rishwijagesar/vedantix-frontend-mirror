import { useEffect, useRef, useState } from "react";
import initialReviews from "../data/google-reviews.json";
import "../styles/google-reviews.css";

function Stars({ rating }) {
  return (
    <span
      className="review-stars"
      role="img"
      aria-label={`${rating} van 5 sterren`}
    >
      {"★".repeat(Math.round(rating))}
    </span>
  );
}

function Review({ review }) {
  const dialog = useRef(null);
  const long = review.text.length > 160;
  return (
    <article className="google-review-card">
      <div className="google-review-author">
        {review.photo && (
          <img
            src={review.photo}
            width="40"
            height="40"
            loading="lazy"
            decoding="async"
            alt=""
          />
        )}
        <div>
          <a href={review.url} target="_blank" rel="noreferrer">
            {review.name}
          </a>
          <time dateTime={review.published.slice(0, 10)}>
            {new Intl.DateTimeFormat("nl-NL", {
              dateStyle: "long",
              timeZone: "UTC",
            }).format(new Date(review.published.slice(0, 10)))}
          </time>
        </div>
        <span className="google-review-source" aria-label="Google review">
          G
        </span>
      </div>
      <Stars rating={review.rating} />
      <p className="google-review-text">{review.text}</p>
      {long && (
        <button
          className="google-review-more"
          onClick={() => dialog.current?.showModal()}
        >
          Read more
        </button>
      )}
      <dialog
        ref={dialog}
        className="google-review-dialog"
        aria-label={`Review van ${review.name}`}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <button
          autoFocus
          className="google-review-close"
          onClick={() => dialog.current.close()}
          aria-label="Review sluiten"
        >
          ×
        </button>
        <h3>{review.name}</h3>
        <Stars rating={review.rating} />
        <p>{review.text}</p>
        <a href={review.url} target="_blank" rel="noreferrer">
          Bekijk op Google
        </a>
      </dialog>
    </article>
  );
}

export default function JotformReviewWidget() {
  const container = useRef(null);
  const [data, setData] = useState(initialReviews);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch("/api/public-reviews", {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const next = await response.json();
        if (
          next.businessName === "Vedantix" &&
          Array.isArray(next.reviews) &&
          !controller.signal.aborted
        ) {
          setData((current) =>
            JSON.stringify(current) === JSON.stringify(next) ? current : next,
          );
        }
      } catch {
        /* Keep the verified review snapshot when the provider is unavailable. */
      }
    };
    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              observer.disconnect();
              void refresh();
            }
          })
        : null;
    if (observer) observer.observe(container.current);
    else void refresh();
    return () => {
      observer?.disconnect();
      controller.abort();
    };
  }, []);

  return (
    <div ref={container} className="vedantix-reviews google-reviews-native">
      <div className="google-reviews-header">
        <div>
          <h2>{data.headerTitle}</h2>
          <div className="google-reviews-rating">
            <span className="google-review-source">Google</span>
            <strong>{data.overallRating}</strong>
            <Stars rating={data.overallRating} />
            <span className="jf-reviews-count">({data.totalReviews})</span>
          </div>
        </div>
        <a
          className="google-reviews-feedback"
          href={data.shareFeedbackUrl}
          target="_blank"
          rel="noreferrer"
        >
          {data.buttonText}
        </a>
      </div>
      <div
        className="google-reviews-list"
        role="group"
        tabIndex={data.reviews.length > 1 ? 0 : undefined}
        aria-label="Klantreviews"
      >
        {data.reviews
          .filter((review) => review.rating >= data.minimumRating)
          .map((review) => (
            <Review key={`${review.url}-${review.published}`} review={review} />
          ))}
      </div>
    </div>
  );
}
