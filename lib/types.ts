export interface Profile {
  id: number;
  name: string;
  display_name: string;
  title_1: string;
  title_2: string;
  title_3: string;
  tagline: string;
  hero_image: string;
  about_quote: string;
  about_text_1: string;
  about_text_2: string;
  resume_url: string;
  phone: string;
  email: string;
  whatsapp_number: string;
}

export interface Skill {
  id: number;
  name: string;
  icon: string;
  category: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
  items: string[];
}

export type WorkType = 'project' | 'design' | 'event';

export interface Work {
  id: number;
  type: WorkType;
  title: string;
  description: string;
  image_url: string;
  tech_stack: string[];
  live_url: string | null;
  source_url: string | null;
  category_label: string | null;
  highlights: string[];
  design_tool: string | null;
  client_name: string | null;
  is_live_url_private: boolean | null;
  is_source_url_private: boolean | null;
}

export interface JourneyItem {
  id: number;
  role: string;
  company: string;
  dates: string;
  description: string;
  logo_url: string | null;
  type: string;
  order_index: number;
}

export interface Social {
  id: number;
  platform: string;
  url: string;
  icon: string;
}

export interface PortfolioData {
  profile: Profile | null;
  skills: Skill[];
  services: Service[];
  works: Work[];
  journey: JourneyItem[];
  socials: Social[];
}
