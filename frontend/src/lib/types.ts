export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      programs: {
        Row: {
          id: string;
          name: string;
          provider: string;
          level: "bachelor" | "masters" | "phd" | "postdoc";
          funding_type: "full" | "partial" | "tuition_only" | "stipend_only";
          countries_eligible: string[];
          countries_of_study: string[];
          fields: string[];
          official_url: string;
          description: string | null;
          who_wins: string | null;
          rejection_reasons: string | null;
          status: "active" | "paused" | "discontinued" | "unknown";
          last_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["programs"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["programs"]["Insert"]>;
      };
      eligibility_rules: {
        Row: {
          id: string;
          program_id: string;
          rule_type: "gpa" | "degree" | "nationality" | "age" | "work_experience" | "language" | "other";
          operator: "=" | ">=" | "<=" | ">" | "<" | "in" | "not_in" | "exists" | "between";
          value: Json;
          confidence: "high" | "medium" | "inferred";
          source_snippet: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["eligibility_rules"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["eligibility_rules"]["Insert"]>;
      };
      requirements: {
        Row: {
          id: string;
          program_id: string;
          type: "transcript" | "cv" | "essay" | "references" | "proposal" | "test" | "interview" | "other";
          description: string;
          mandatory: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["requirements"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["requirements"]["Insert"]>;
      };
      deadlines: {
        Row: {
          id: string;
          program_id: string;
          cycle: string;
          deadline_date: string;
          timezone: string;
          stage: "application" | "interview" | "nomination" | "result";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deadlines"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["deadlines"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          nationality: string | null;
          degree: string | null;
          gpa_band: "below_2.5" | "2.5_3.0" | "3.0_3.5" | "3.5_4.0" | "above_4.0" | null;
          field: string | null;
          work_experience_years: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      agent_reviews: {
        Row: {
          id: string;
          program_id: string;
          issue_type: string;
          note: string;
          severity: "low" | "medium" | "high";
          resolved: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agent_reviews"]["Row"], "id" | "created_at">;
        Update: {
          program_id?: string;
          issue_type?: string;
          note?: string;
          severity?: "low" | "medium" | "high";
          resolved?: boolean;
        };
      };
      sources: {
        Row: {
          id: string;
          program_id: string;
          url: string;
          last_fetched_at: string;
          content_hash: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sources"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["sources"]["Insert"]>;
      };
    };
  };
};

export type Program = Database["public"]["Tables"]["programs"]["Row"];
export type EligibilityRule = Database["public"]["Tables"]["eligibility_rules"]["Row"];
export type Requirement = Database["public"]["Tables"]["requirements"]["Row"];
export type Deadline = Database["public"]["Tables"]["deadlines"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
