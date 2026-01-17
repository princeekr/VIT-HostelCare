export type AppRole = 'student' | 'admin' | 'worker';
export type ComplaintStatus = 'pending' | 'in_progress' | 'waiting_confirmation' | 'resolved';
export type ComplaintPriority = 'low' | 'medium' | 'high';
export type ComplaintCategory = 'electricity' | 'water' | 'cleaning' | 'wifi' | 'plumbing' | 'furniture' | 'other';
export type StaffType = 'electrician' | 'plumber' | 'cleaner' | 'technician' | 'maintenance';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  hostel_name: string | null;
  block: string | null;
  floor: string | null;
  room_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Worker {
  id: string;
  user_id: string;
  worker_type: StaffType;
  phone: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  photo_url: string | null;
  assigned_staff: StaffType | null;
  assigned_worker_id: string | null;
  admin_notes: string | null;
  hostel_name: string | null;
  block: string | null;
  floor: string | null;
  room_number: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  electricity: 'Electricity',
  water: 'Water',
  cleaning: 'Cleaning',
  wifi: 'Wi-Fi',
  plumbing: 'Plumbing',
  furniture: 'Furniture',
  other: 'Other',
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: 'Pending',
  in_progress: 'Ongoing',
  waiting_confirmation: 'Awaiting Confirmation',
  resolved: 'Resolved',
};

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const STAFF_LABELS: Record<StaffType, string> = {
  electrician: 'Electrician',
  plumber: 'Plumber',
  cleaner: 'Cleaner',
  technician: 'Technician',
  maintenance: 'Maintenance',
};
