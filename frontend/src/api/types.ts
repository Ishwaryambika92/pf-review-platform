export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Rating {
  overall: number;
  quality: number | null;
  communication: number | null;
  transparency: number | null;
  value_for_money: number | null;
  professionalism: number | null;
  response_time: number | null;
}

export type ReviewStatus =
  | "draft"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "needs_info"
  | "published_unverified";

export interface ReviewPublic {
  id: string;
  reference_id: string;
  title: string;
  body: string;
  pros: string;
  cons: string;
  would_recommend: boolean | null;
  display_name: string;
  service_name: string;
  service_date: string;
  status: ReviewStatus;
  language: "en" | "te" | "mixed";
  is_verified: boolean;
  proof_verified: boolean;
  proof_preview_available: boolean;
  rating: Rating;
  helpful_count: number;
  created_at: string;
}

export interface ServiceSummary {
  id: string;
  slug: string;
  name: string;
  category_name: string;
  location: string;
  average_rating: string;
  total_reviews: number;
  verified_reviews: number;
}

export interface ServiceDetail extends ServiceSummary {
  description: string;
  process_info: string;
  common_requirements: string;
  contact_info: string;
  rating_distribution: { stars: number; count: number; pct: number }[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface MyUser {
  id: string;
  username: string;
  email: string;
  is_moderator: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  profile: { display_name: string; bio: string; avatar: string | null };
} //

export interface ModerationReview {
  id: string;
  reference_id: string;
  reviewer_username: string;
  service_name: string;
  title: string;
  body: string;
  rating_overall: number;
  status: ReviewStatus;
  service_date: string;
  has_proof: boolean;
  report_count: number;
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  related_review_id: string | null;
  read: boolean;
  created_at: string;
}
