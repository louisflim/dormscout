import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { listingsAPI, reviewsAPI, bookingsAPI } from '../../../utils/api';
import './Reviews.css';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const BADGE_CLASSES = ['', 'poor', 'fair', 'good', 'very-good', 'excellent'];
const ALL_TAGS = ['Clean', 'Safe', 'Quiet', 'Affordable', 'Fast WiFi', 'Great Location', 'Friendly Staff', 'Modern', 'Secure', 'Average'];

const AVATAR_COLORS = ['#5BADA8', '#E8622E', '#7C3AED', '#059669', '#DC2626'];

function StarRating({ value, onChange, size = 28, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  const display = readonly ? value : (hovered || value);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${readonly ? 'readonly' : 'interactive'}`}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: size,
            color: star <= display ? '#F59E0B' : '#E5E7EB',
            transform: (!readonly && star <= hovered) ? 'scale(1.2)' : 'scale(1)',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function Avatar({ initials, size = 42 }) {
  const safe = (initials && initials.length) ? initials : '??';
  const colorIndex = (safe.charCodeAt(0) + (safe.charCodeAt(1) || 0)) % AVATAR_COLORS.length;
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: AVATAR_COLORS[colorIndex],
        fontSize: size * 0.38,
      }}
    >
      {safe}
    </div>
  );
}

function RatingBar({ label, count, total, darkMode = false }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="rating-bar-row">
      <span className="rating-bar-label" style={{ color: darkMode ? '#a0a0b0' : '#888' }}>{label}</span>
      <span className="rating-bar-star">★</span>
      <div className="rating-bar-track" style={{ background: darkMode ? '#2a2a4a' : '#eee' }}>
        <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="rating-bar-count" style={{ color: darkMode ? '#a0a0b0' : '#999' }}>{count}</span>
    </div>
  );
}

function ReviewCard({ review, onHelpful, darkMode = false, colors = {} }) {
  const [animating, setAnimating] = useState(false);

  const handleHelpful = () => {
    if (review.userMarkedHelpful) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    onHelpful(review.id);
  };

  const defaultColors = {
    cardBg: darkMode ? '#16213e' : '#faf9f7',
    text: darkMode ? '#ffffff' : '#222',
    secondaryText: darkMode ? '#a0a0b0' : '#aaa',
    border: darkMode ? '#2a2a4a' : 'rgba(0, 0, 0, 0.07)',
  };

  const finalColors = { ...defaultColors, ...colors };

  return (
    <div className="review-card" style={{ background: finalColors.cardBg, borderColor: finalColors.border }}>
      <div className="review-card-header">
        <Avatar initials={review.avatar || (review.author && review.author.slice(0, 2)) || '??'} />
        <div className="review-card-meta">
          <div className="review-card-top">
            <span className="review-author" style={{ color: finalColors.text }}>{review.author}</span>
            <span className="review-date" style={{ color: finalColors.secondaryText }}>{review.date}</span>
          </div>
          <div className="review-rating-row">
            <StarRating value={review.rating} size={18} readonly />
            <span className={`review-rating-badge ${BADGE_CLASSES[review.rating] || ''}`}>
              {RATING_LABELS[review.rating] || ''}
            </span>
          </div>
        </div>
      </div>

      {review.tags && review.tags.length > 0 && (
        <div className="review-tags">
          {review.tags.map(tag => (
            <span key={tag} className="review-tag">{tag}</span>
          ))}
        </div>
      )}

      <p className="review-body" style={{ color: finalColors.text }}>{review.body}</p>

      <div className="review-footer" style={{ borderTopColor: darkMode ? '#2a2a4a' : '#f5f5f5' }}>
        <button
          className={`helpful-btn ${review.userMarkedHelpful ? 'marked' : ''} ${animating ? 'animating' : ''}`}
          style={{
            background: darkMode ? '#0f3460' : 'transparent',
            borderColor: darkMode ? '#2a2a4a' : '#ddd',
            color: review.userMarkedHelpful ? '#5bada8' : (darkMode ? '#ffffff' : '#888'),
          }}
          onClick={handleHelpful}
        >
          👍 Helpful ({review.helpful || 0})
        </button>
        {review.userMarkedHelpful && (
          <span style={{ fontSize: 12, color: '#5bada8', fontWeight: 600 }}>Thanks for your feedback!</span>
        )}
      </div>
    </div>
  );
}

function WriteReviewModal({ onClose, onSubmit, dormName, darkMode = false }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [anonymous, setAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const colors = {
    modalBg: darkMode ? '#16213e' : '#fff',
    text: darkMode ? '#ffffff' : '#1a1a1a',
    secondaryText: darkMode ? '#a0a0b0' : '#666',
    inputBg: darkMode ? '#0f3460' : '#f5f5f5',
    border: darkMode ? '#2a2a4a' : '#e0e0e0',
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    );
  };

  const isValid = rating > 0 && body.trim().length >= 5;

  const handleSubmit = () => {
    if (!isValid) return;
    setSubmitted(true);
    setTimeout(() => {
      onSubmit({ rating, body, tags: selectedTags, anonymous });
      onClose();
    }, 1500);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ background: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="modal-card" style={{ background: colors.modalBg, color: colors.text }}>
        {submitted ? (
          <div className="modal-success">
            <div className="modal-success-icon">🎉</div>
            <h3 style={{ color: colors.text }}>Review Submitted!</h3>
            <p style={{ color: colors.secondaryText }}>Thank you for helping fellow students.</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="modal-title" style={{ color: colors.text }}>Write a Review</h3>
              <p className="modal-dorm-name" style={{ color: colors.secondaryText }}>{dormName}</p>
            </div>

            <div>
              <label className="modal-field-label" style={{ color: colors.text }}>
                Your Rating <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <StarRating value={rating} onChange={setRating} size={36} />
                {rating > 0 && (
                  <span className="rating-feedback" style={{ color: colors.secondaryText }}>{RATING_LABELS[rating]}</span>
                )}
              </div>
            </div>

            <div>
              <label className="modal-field-label" style={{ color: colors.text }}>
                Tags <span className="optional" style={{ color: colors.secondaryText }}>(pick up to 5)</span>
              </label>
              <div className="modal-tags">
                {ALL_TAGS.map(tag => (
                  <button
                    key={tag}
                    className={`modal-tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => toggleTag(tag)}
                    style={{
                      background: darkMode ? '#0f3460' : '#f5f5f5',
                      borderColor: darkMode ? '#2a2a4a' : '#e0e0e0',
                      color: selectedTags.includes(tag) ? '#e8622e' : colors.text,
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <label
              className="review-anonymous-toggle"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                color: colors.text,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#E8622E' }}
              />
              Post review anonymously (your name won&apos;t be shown)
            </label>

            <div>
              <label className="modal-field-label" style={{ color: colors.text }}>
                Your Review <span className="required">*</span>
              </label>
              <textarea
                className="modal-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Share details about cleanliness, safety, management, WiFi, location..."
                style={{
                  background: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
              <div className={`modal-char-hint ${body.length < 5 ? 'warn' : ''}`} style={{ color: colors.secondaryText }}>
                {body.length} / minimum 5 characters
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={onClose} style={{ background: colors.inputBg, color: colors.text, borderColor: colors.border }}>
                Cancel
              </button>
              <button
                className="modal-submit-btn"
                onClick={handleSubmit}
                disabled={!isValid}
              >
                Submit Review
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function isActiveBookingStatus(status) {
  const s = String(status || '').toLowerCase();
  return s === 'approved' || s === 'accepted' || s === 'confirmed' || s === 'active';
}

export default function Reviews({ userType = 'tenant', darkMode = false }) {
  const { user } = useAuth();
  const [availableDorms, setAvailableDorms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [loadingDorms, setLoadingDorms] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [approvedListingIds, setApprovedListingIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    const loadDorms = async () => {
      setLoadingDorms(true);
      try {
        const data = await listingsAPI.getAllListings();
        const dorms = (Array.isArray(data) ? data : []).map(l => ({
          id: Number(l.id),
          name: l.title,
          address: l.address || 'Address not specified',
        }));
        if (!cancelled) {
          setAvailableDorms(dorms);
          setSelectedDorm(prev => {
            if (prev && dorms.some(d => d.id === Number(prev))) return Number(prev);
            return dorms.length > 0 ? dorms[0].id : null;
          });
        }
      } finally {
        if (!cancelled) setLoadingDorms(false);
      }
    };
    loadDorms();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?.id || userType !== 'tenant') return;
    bookingsAPI.getBookingsByTenant(user.id)
      .then(data => {
        const raw = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
        const approved = raw
          .filter(b => isActiveBookingStatus(b.status))
          .map(b => Number(b.listing?.id ?? b.listingId))
          .filter(Boolean);
        setApprovedListingIds(new Set(approved));
      })
      .catch(() => setApprovedListingIds(new Set()));
  }, [user?.id, userType]);

  useEffect(() => {
    if (!selectedDorm) return;
    let cancelled = false;
    const loadReviews = async () => {
      setLoadingReviews(true);
      try {
        const data = await reviewsAPI.getByListing(selectedDorm);
        if (!cancelled) {
          const real = Array.isArray(data) ? data : [];
          setReviews(real);
        }
      } catch {
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setLoadingReviews(false);
      }
    };
    loadReviews();
    return () => { cancelled = true; };
  }, [selectedDorm, availableDorms]);

  const canWriteReview = () => {
    if (userType !== 'tenant' || !user?.id || !selectedDorm) return false;
    return approvedListingIds.has(Number(selectedDorm));
  };

  const colors = {
    bg: darkMode ? '#1a1a2e' : 'transparent',
    cardBg: darkMode ? '#16213e' : '#faf9f7',
    text: darkMode ? '#ffffff' : '#1a1a1a',
    secondaryText: darkMode ? '#a0a0b0' : '#888',
    border: darkMode ? '#2a2a4a' : 'rgba(0,0,0,0.07)',
    inputBg: darkMode ? '#0f3460' : '#f0f2f5',
  };

  const currentDorm = availableDorms.find(d => d.id === Number(selectedDorm)) || null;
  const dormReviews = reviews.filter(r => Number(r.dormId) === Number(selectedDorm));
  const avgRating = dormReviews.length
    ? (dormReviews.reduce((sum, r) => sum + r.rating, 0) / dormReviews.length).toFixed(1)
    : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(n => ({
    star: n,
    count: dormReviews.filter(r => r.rating === n).length,
  }));

  const displayed = dormReviews
    .filter(r => filterRating === 0 || r.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === 'newest') return String(b.id).localeCompare(String(a.id));
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      if (sortBy === 'helpful') return (b.helpful || 0) - (a.helpful || 0);
      return 0;
    });

  const handleHelpful = (reviewId) => {
    setReviews(prev =>
      prev.map(r => r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1, userMarkedHelpful: true } : r)
    );
  };

  const handleSubmitReview = async ({ rating, body, tags, anonymous: postAnonymous }) => {
    const newReview = {
      id: `new_${Date.now()}`,
      dormId: Number(selectedDorm),
      author: postAnonymous ? 'Anonymous' : (user?.name || 'You'),
      avatar: postAnonymous ? 'AN' : (user?.name || 'YO').slice(0, 2).toUpperCase(),
      anonymous: Boolean(postAnonymous),
      rating,
      body,
      tags,
      helpful: 0,
      userMarkedHelpful: false,
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };
    setReviews(prev => [newReview, ...prev]);

    try {
      await reviewsAPI.createReview(user.id, selectedDorm, {
        rating,
        body,
        tags,
        anonymous: Boolean(postAnonymous),
      });
      const data = await reviewsAPI.getByListing(selectedDorm);
      if (Array.isArray(data) && data.length > 0) setReviews(data);
    } catch {
      /* optimistic UI already updated */
    }
  };

  return (
    <main className="reviews-page" style={{ background: colors.bg, color: colors.text }}>

      {loadingDorms && (
        <div className="reviews-empty" style={{ background: colors.cardBg, borderColor: colors.border }}>
          <div className="reviews-empty-icon">⏳</div>
          <h3 style={{ color: colors.text }}>Loading listings...</h3>
        </div>
      )}

      {!loadingDorms && availableDorms.length === 0 && (
        <div className="reviews-empty" style={{ background: colors.cardBg, borderColor: colors.border }}>
          <div className="reviews-empty-icon">🏠</div>
          <h3 style={{ color: colors.text }}>No listings available</h3>
          <p style={{ color: colors.secondaryText }}>Check back once landlords have posted dormitories.</p>
        </div>
      )}

      {!loadingDorms && availableDorms.length > 0 && (
        <>
          <div className="dorm-selector" style={{ background: colors.cardBg, borderColor: colors.border }}>
            <label className="dorm-selector-label" style={{ color: colors.secondaryText }}>Select a Dorm</label>
            <div className="dorm-selector-list">
              {availableDorms.map(dorm => {
                const isActive = selectedDorm === dorm.id;
                const isBooked = approvedListingIds.has(dorm.id);
                return (
                  <button
                    key={dorm.id}
                    className={`dorm-btn ${isActive ? 'active' : ''}`}
                    onClick={() => { setSelectedDorm(dorm.id); setFilterRating(0); }}
                    style={{
                      background: isActive
                        ? (darkMode ? 'rgba(232,98,46,0.15)' : 'rgba(232,98,46,0.08)')
                        : (darkMode ? '#0f3460' : '#fafafa'),
                      borderColor: isActive ? '#e8622e' : (darkMode ? '#2a2a4a' : '#e5e5e5'),
                      position: 'relative',
                    }}
                  >
                    <div className="dorm-btn-name" style={{ color: isActive ? '#e8622e' : colors.text }}>
                      {dorm.name}
                      {isBooked && (
                        <span style={{
                          marginLeft: 6, fontSize: 10, fontWeight: 700,
                          background: 'rgba(91,173,168,0.15)', color: '#5bada8',
                          padding: '1px 6px', borderRadius: 99,
                        }}
                        >
                          Your dorm
                        </span>
                      )}
                    </div>
                    <div className="dorm-btn-address" style={{ color: colors.secondaryText }}>{dorm.address}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rating-summary" style={{ background: colors.cardBg, borderColor: colors.border }}>
            <div className="rating-score">
              <div className="rating-score-number" style={{ color: colors.text }}>
                {dormReviews.length > 0 ? avgRating : '—'}
              </div>
              <StarRating value={Math.round(Number(avgRating))} size={18} readonly />
              <div className="rating-score-count" style={{ color: colors.secondaryText }}>
                {dormReviews.length} review{dormReviews.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="rating-bars">
              {ratingCounts.map(({ star, count }) => (
                <RatingBar key={star} label={star} count={count} total={dormReviews.length} darkMode={darkMode} />
              ))}
            </div>

            {userType === 'tenant' && (
              canWriteReview() ? (
                <button className="write-review-btn" onClick={() => setShowModal(true)}>
                  ✏️ Write a<br />Review
                </button>
              ) : (
                <div style={{ textAlign: 'center', maxWidth: 110 }}>
                  <button
                    className="write-review-btn"
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    disabled
                    title="You need an approved booking for this dorm to write a review"
                  >
                    ✏️ Write a<br />Review
                  </button>
                  <p style={{ color: colors.secondaryText, fontSize: 11, marginTop: 6 }}>
                    Book this dorm first
                  </p>
                </div>
              )
            )}
          </div>

          <div className="reviews-controls">
            <span className="filter-label" style={{ color: colors.secondaryText }}>Filter:</span>
            {[0, 5, 4, 3, 2, 1].map(n => (
              <button
                key={n}
                className={`filter-btn ${filterRating === n ? 'active' : ''}`}
                onClick={() => setFilterRating(n)}
                style={{
                  background: filterRating === n
                    ? 'rgba(91,173,168,0.12)'
                    : (darkMode ? '#0f3460' : '#fff'),
                  borderColor: filterRating === n ? '#5bada8' : (darkMode ? '#2a2a4a' : '#ddd'),
                  color: filterRating === n ? '#5bada8' : colors.secondaryText,
                }}
              >
                {n === 0 ? 'All' : `${n}★`}
              </button>
            ))}

            <div className="sort-wrapper">
              <span className="sort-label" style={{ color: colors.secondaryText }}>Sort:</span>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: darkMode ? '#0f3460' : '#fff',
                  borderColor: darkMode ? '#2a2a4a' : '#ddd',
                  color: darkMode ? '#ffffff' : '#555',
                }}
              >
                <option value="newest">Newest</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>

          {loadingReviews ? (
            <div className="reviews-empty" style={{ background: colors.cardBg, borderColor: colors.border }}>
              <div className="reviews-empty-icon">⏳</div>
              <h3 style={{ color: colors.text }}>Loading reviews...</h3>
            </div>
          ) : displayed.length > 0 ? (
            <div className="review-list">
              {displayed.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onHelpful={handleHelpful}
                  darkMode={darkMode}
                  colors={{
                    cardBg: colors.cardBg,
                    text: colors.text,
                    secondaryText: colors.secondaryText,
                    border: colors.border,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="reviews-empty" style={{ background: colors.cardBg, borderColor: colors.border }}>
              <div className="reviews-empty-icon">💬</div>
              <h3 style={{ color: colors.text }}>
                {filterRating !== 0 ? `No ${filterRating}★ reviews yet` : 'No reviews yet'}
              </h3>
              <p style={{ color: colors.secondaryText }}>
                {filterRating !== 0
                  ? 'Try a different star filter above.'
                  : 'Be the first to share your experience at this dorm!'}
              </p>
              {canWriteReview() && filterRating === 0 && (
                <button className="reviews-empty-btn" onClick={() => setShowModal(true)}>
                  Write the First Review
                </button>
              )}
            </div>
          )}
        </>
      )}

      {showModal && currentDorm && (
        <WriteReviewModal
          dormName={currentDorm.name}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitReview}
          darkMode={darkMode}
        />
      )}
    </main>
  );
}
