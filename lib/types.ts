export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Tables<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Lead = {
  id: string;
  created_at: string;
  updated_at: string | null;
  customer_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  postcode: string | null;
  property_size: string | null;
  service_needed: string | null;
  preferred_date: string | null;
  addons: string[] | null;
  condition_notes: string | null;
  access_notes: string | null;
  parking_notes: string | null;
  lead_source: string | null;
  quote_status: string | null;
  suggested_customer_quote: number | null;
  customer_quote: number | null;
  selected_contractor_id: string | null;
  contractor_cost_estimate: number | null;
  quote_sent_at: string | null;
  follow_up_date: string | null;
  lost_reason: string | null;
  notes: string | null;
};

export type Contractor = {
  id: string;
  created_at: string;
  updated_at: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  areas_covered: string | null;
  own_transport: boolean | null;
  years_experience: number | null;
  eot_deep_clean_experience: boolean | null;
  hmrc_status: string | null;
  insurance_certificate_uploaded: boolean | null;
  insurance_file_link: string | null;
  insurance_expiry_date: string | null;
  insurance_cover_amount: number | null;
  id_right_to_work_uploaded: boolean | null;
  id_file_link: string | null;
  contractor_agreement_signed: boolean | null;
  agreement_file_link: string | null;
  rate_card_signed: boolean | null;
  rate_card_file_link: string | null;
  test_job_status: string | null;
  test_job_date: string | null;
  test_job_result: string | null;
  active_rota_approved: boolean | null;
  contractor_status: string | null;
  pause_reason: string | null;
  dbs_status: string | null;
  notes: string | null;
};

export type Job = {
  id: string;
  lead_id: string | null;
  created_at: string;
  updated_at: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  job_address: string | null;
  postcode: string | null;
  property_size: string | null;
  service_needed: string | null;
  addons: string[] | null;
  job_date: string | null;
  arrival_window: string | null;
  access_notes: string | null;
  parking_notes: string | null;
  selected_contractor_id: string | null;
  contractor_confirmed: boolean | null;
  contractor_confirmation_time: string | null;
  job_status: string | null;
  completion_form_submitted: boolean | null;
  before_photos_link: string | null;
  after_photos_link: string | null;
  completion_notes: string | null;
  property_secured: boolean | null;
  qa_status: string | null;
  qa_checked_at: string | null;
  qa_notes: string | null;
  customer_issue: boolean | null;
  contractor_issue: boolean | null;
  payment_hold: boolean | null;
  payment_hold_reason: string | null;
  customer_invoice_sent: boolean | null;
  customer_paid: boolean | null;
  payment_cleared: boolean | null;
  customer_payment_date: string | null;
  contractor_paid: boolean | null;
  contractor_payment_date: string | null;
  customer_price: number | null;
  contractor_cost: number | null;
  review_requested: boolean | null;
  review_link_sent_at: string | null;
  invoice_link?: string | null;
  customer_agreement_link?: string | null;
  contractor_job_sheet_link?: string | null;
  job_folder_link?: string | null;
  notes: string | null;
};

export type Complaint = {
  id: string;
  job_id: string | null;
  date_opened: string;
  customer_name: string | null;
  contractor_id: string | null;
  complaint_source: string | null;
  issue_type: string | null;
  severity: string | null;
  description: string | null;
  photos_link: string | null;
  complaint_status: string | null;
  re_clean_needed: boolean | null;
  re_clean_date: string | null;
  refund_discount_offered: number | null;
  insurance_claim: boolean | null;
  final_outcome: string | null;
  closed_date: string | null;
  review_risk: boolean | null;
};

export type PricingReference = {
  id: string;
  category: string;
  item: string;
  customer_sell_min: number | null;
  customer_sell_max: number | null;
  contractor_cost_min: number | null;
  contractor_cost_max: number | null;
  notes: string | null;
};

export type LaunchChecklistItem = {
  id: string;
  category: string | null;
  task: string;
  details: string | null;
  status: string | null;
  required_before_live: boolean | null;
  blocker: boolean | null;
  owner: string | null;
  due_date: string | null;
  evidence_link: string | null;
  notes: string | null;
};

export type AgentOutreach = {
  id: string;
  created_at: string;
  agency: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  area: string | null;
  status: string | null;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  pitch_sent: boolean | null;
  pricing_sent: boolean | null;
  notes: string | null;
  outcome: string | null;
};


export type JobDocument = {
  id: string;
  created_at: string;
  job_id: string | null;
  contractor_id: string | null;
  lead_id: string | null;
  document_type: string;
  title: string;
  file_link: string | null;
  signed: boolean | null;
  signed_by: string | null;
  signed_at: string | null;
  start_work_consent: boolean | null;
  expiry_date: string | null;
  notes: string | null;
};

export type JobPhoto = {
  id: string;
  created_at: string;
  job_id: string | null;
  contractor_id: string | null;
  photo_stage: string;
  title: string | null;
  file_link: string;
  submitted_by: string | null;
  marketing_permission: boolean | null;
  notes: string | null;
};

export type FinanceItem = {
  id: string;
  created_at: string;
  job_id: string | null;
  lead_id: string | null;
  item_type: string;
  category: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  paid_date: string | null;
  payment_status: string | null;
  payment_method: string | null;
  reference: string | null;
  evidence_link: string | null;
  notes: string | null;
};

export type AuditLogItem = {
  id: string;
  created_at: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  summary: string | null;
  metadata: Json | null;
  actor: string | null;
};

export type Database = {
  public: {
    Tables: {
      leads: Tables<Lead>;
      contractors: Tables<Contractor>;
      jobs: Tables<Job>;
      complaints: Tables<Complaint>;
      pricing_reference: Tables<PricingReference>;
      launch_checklist: Tables<LaunchChecklistItem>;
      agent_outreach: Tables<AgentOutreach>;
      contractor_rates: Tables<Record<string, unknown>>;
      job_completion_submissions: Tables<Record<string, unknown>>;
      operator_profiles: Tables<Record<string, unknown>>;
      job_documents: Tables<JobDocument>;
      job_photos: Tables<JobPhoto>;
      finance_items: Tables<FinanceItem>;
      audit_log: Tables<AuditLogItem>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
