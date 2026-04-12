import React, { useState } from 'react';
import './Reviews.css';

const DORMS = [
  { id: 1, name: 'Sunrise Boarding House', address: 'P. Del Rosario St, Cebu City' },
  { id: 2, name: 'Green Leaf Dormitory', address: 'Gorordo Ave, Lahug, Cebu City' },
  { id: 3, name: 'BlueSky Residences', address: 'Salinas Dr, Lahug, Cebu City' },
];

const PLACEHOLDER_REVIEWS = [
  {
    id: 1,
    dormId: 1,
    author: 'Ashlee Sean',
    avatar: 'AS',
    date: 'March 12, 2025',
    rating: 5,
    tags: ['Clean', 'Safe', 'Great Location'],
    body: 'Absolutely love living here! The rooms are spacious and always clean. The landlord is very responsive and fixes issues quickly. Highly recommend to fellow students from USC.',
    helpful: 14,
    userMarkedHelpful: false,
  },
  {
    id: 2,
    dormId: 1,
    author: 'Angel Beats',
    avatar: 'AB',
    date: 'February 28, 2025',
    rating: 4,
    tags: ['Affordable', 'Quiet'],
    body: 'Good value for the price. The wifi could be faster during peak hours but overall a comfortable place to study. Location is perfect — 5 minutes walk from campus.',
    helpful: 8,
    userMarkedHelpful: false,
  },
  {
    id: 3,
    dormId: 1,
    author: 'Girlie',
    avatar: 'G',
    date: 'January 15, 2025',
    rating: 3,
    tags: ['Average', 'Noisy at Night'],
    body: 'The room itself is fine but the common area gets noisy late at night. Management could enforce curfew rules more strictly. Decent price for the area though.',
    helpful: 5,
    userMarkedHelpful: false,
  },
  {
    id: 4,
    dormId: 2,
    author: 'Peter Jackstone',
    avatar: 'PJ',
    date: 'March 20, 2025',
    rating: 5,
    tags: ['Clean', 'Friendly Staff', 'Fast WiFi'],
    body: "Best dorm I've stayed in during my college years. The staff treats you like family and the internet speed is actually fast enough to stream and do schoolwork simultaneously.",
    helpful: 21,
    userMarkedHelpful: false,
  },
  {
    id: 5,
    dormId: 3,
    author: 'Ian Mark',
    avatar: 'IM',
    date: 'March 5, 2025',
    rating: 4,
    tags: ['Modern', 'Secure'],
    body: 'Very modern interiors and they have 24/7 security which makes me feel safe. A bit pricier than other options but worth it for the peace of mind.',
    helpful: 9,
    userMarkedHelpful: false,
  },
];

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
  const colorIndex = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_COLORS.length;
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
      {initials}
    </div>
  );
}

function RatingBar({ label, count, total, darkMode = false }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  const colors = {
    label: darkMode ? '#a0a0b0' : '#888',
    track: darkMode ? '#2a2a4a' : '#eee',
    count: darkMode ? '#a0a0b0' : '#999',
  };
  return (
    <div className="rating-bar-row">
      <span className="rating-bar-label" style={{ color: colors.label }}>{label}</span>
      <span className="rating-bar-star">★</span>
      <div className="rating-bar-track" style={{ background: colors.track }}>
        <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="rating-bar-count" style={{ color: colors.count }}>{count}</span>
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
      {/* Header */}
      <div className="review-card-header">
        <Avatar initials={review.avatar} />
        <div className="review-card-meta">
          <div className="review-card-top">
            <span className="review-author" style={{ color: finalColors.text }}>{review.author}</span>
            <span className="review-date" style={{ color: finalColors.secondaryText }}>{review.date}</span>
          </div>
          <div className="review-rating-row">
            <StarRating value={review.rating} size={18} readonly />
            <span className={`review-rating-badge ${BADGE_CLASSES[review.rating]}`}>
              {RATING_LABELS[review.rating]}
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {review.tags.length > 0 && (
        <div className="review-tags">
          {review.tags.map(tag => (
            <span key={tag} className="review-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Body */}
      <p className="review-body" style={{ color: finalColors.text }}>{review.body}</p>

      {/* Helpful */}
      <div className="review-footer" style={{ borderTopColor: darkMode ? '#2a2a4a' : '#f5f5f5' }}>
        <button
          className={`helpful-btn ${review.userMarkedHelpful ? 'marked' : ''} ${animating ? 'animating' : ''}`}
          style={{
            background: darkMode ? '#0f3460' : 'transparent',
            borderColor: darkMode ? '#2a2a4a' : '#ddd',
            color: darkMode ? '#ffffff' : '#888',
          }}
          onClick={handleHelpful}
        >
          👍 Helpful ({review.helpful})
        </button>
      </div>
    </div>
  );
}

function WriteReviewModal({ onClose, onSubmit, dormName, darkMode = false }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
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

  const isValid = rating > 0 && body.trim().length >= 10;

  const handleSubmit = () => {
    if (!isValid) return;
    setSubmitted(true);
    setTimeout(() => {
      onSubmit({ rating, body, tags: selectedTags });
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

            {/* Star Rating */}
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

            {/* Tags */}
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

            {/* Body */}
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
              <div className={`modal-char-hint ${body.length < 10 ? 'warn' : ''}`} style={{ color: colors.secondaryText }}>
                {body.length} / minimum 10 characters
              </div>
            </div>

            {/* Actions */}
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

// Main Reviews Component 

export default function Reviews({ userType = 'tenant', darkMode = false, setDarkMode }) {
  const [reviews, setReviews] = useState(PLACEHOLDER_REVIEWS);
  const [selectedDorm, setSelectedDorm] = useState(DORMS[0].id);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const colors = {
    bg: darkMode ? '#1a1a2e' : 'transparent',
    cardBg: darkMode ? '#16213e' : '#faf9f7',
    text: darkMode ? '#ffffff' : '#1a1a1a',
    secondaryText: darkMode ? '#a0a0b0' : '#888',
    border: darkMode ? '#2a2a4a' : 'rgba(0, 0, 0, 0.07)',
    inputBg: darkMode ? '#0f3460' : '#f0f2f5',
    hoverBg: darkMode ? '#1e2849' : '#f2f2f2',
  };

  const currentDorm = DORMS.find(d => d.id === selectedDorm);
  const dormReviews = reviews.filter(r => r.dormId === selectedDorm);

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
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      if (sortBy === 'helpful') return b.helpful - a.helpful;
      return 0;
    });

  const handleHelpful = (reviewId) => {
    setReviews(prev => prev.map(r =>
      r.id === reviewId ? { ...r, helpful: r.helpful + 1, userMarkedHelpful: true } : r
    ));
  };

  const handleSubmitReview = ({ rating, body, tags }) => {
    const newReview = {
      id: Date.now(),
      dormId: selectedDorm,
      author: 'You',
      avatar: 'ME',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      rating,
      tags,
      body,
      helpful: 0,
      userMarkedHelpful: false,
    };
    setReviews(prev => [newReview, ...prev]);
  };

  return (
    <main className="reviews-page" style={{ background: colors.bg, color: colors.text }}>

      {/* Dorm Selector */}
      <div className="dorm-selector" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <label className="dorm-selector-label" style={{ color: colors.secondaryText }}>Select Dorm</label>
        <div className="dorm-selector-list">
          {DORMS.map(dorm => (
            <button
              key={dorm.id}
              className={`dorm-btn ${selectedDorm === dorm.id ? 'active' : ''}`}
              onClick={() => { setSelectedDorm(dorm.id); setFilterRating(0); }}
              style={{
                background: darkMode ? '#0f3460' : '#fafafa',
                borderColor: darkMode ? '#2a2a4a' : '#e5e5e5',
                color: colors.text,
              }}
            >
              <div className="dorm-btn-name" style={{ color: selectedDorm === dorm.id ? '#e8622e' : colors.text }}>{dorm.name}</div>
              <div className="dorm-btn-address" style={{ color: colors.secondaryText }}>{dorm.address}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Rating Summary + Write Review */}
      <div className="rating-summary" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <div className="rating-score">
          <div className="rating-score-number" style={{ color: colors.text }}>{avgRating}</div>
          <StarRating value={Math.round(avgRating)} size={18} readonly />
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
          <button className="write-review-btn" onClick={() => setShowModal(true)}>
            ✏️ Write a<br />Review
          </button>
        )}
      </div>

      {/* Filters & Sort */}
      <div className="reviews-controls">
        <span className="filter-label" style={{ color: colors.secondaryText }}>Filter:</span>
        {[0, 5, 4, 3, 2, 1].map(n => (
          <button
            key={n}
            className={`filter-btn ${filterRating === n ? 'active' : ''}`}
            onClick={() => setFilterRating(n)}
            style={{
              background: darkMode ? '#0f3460' : '#fff',
              borderColor: darkMode ? '#2a2a4a' : '#ddd',
              color: darkMode ? '#ffffff' : '#666',
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

      {/* Review List */}
      {displayed.length > 0 ? (
        <div className="review-list">
          {displayed.map(review => (
            <ReviewCard key={review.id} review={review} onHelpful={handleHelpful} darkMode={darkMode} colors={colors} />
          ))}
        </div>
      ) : (
        <div className="reviews-empty" style={{ background: colors.cardBg, borderColor: colors.border }}>
          <div className="reviews-empty-icon">💬</div>
          <h3 style={{ color: colors.text }}>No reviews yet</h3>
          <p style={{ color: colors.secondaryText }}>
            {filterRating !== 0
              ? 'No reviews match this filter.'
              : 'Be the first to review this dorm!'}
          </p>
          {userType === 'tenant' && filterRating === 0 && (
            <button className="reviews-empty-btn" onClick={() => setShowModal(true)}>
              Write the First Review
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
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