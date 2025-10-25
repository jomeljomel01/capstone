import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Student {
  id?: number;
  lrn?: string;
  schoolYear?: string;
  gradeLevel?: string;
  psa?: string;
  lname?: string;
  fname?: string;
  mname?: string;
  bday?: string;
  age?: string;
  sex?: string;
  birthplace?: string;
  religion?: string;
  motherTongue?: string;
  indigenousPeople?: string;
  fourPS?: string;
  houseNumber?: string;
  streetName?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  country?: string;
  zipCode?: string;
  pHN?: string;
  pSN?: string;
  pbrgy?: string;
  pMunicipal?: string;
  pProvince?: string;
  pCountry?: string;
  pZipCode?: string;
  fatherFN?: string;
  fatherMN?: string;
  fatherLN?: string;
  fatherCN?: string;
  motherFN?: string;
  motherMN?: string;
  motherLN?: string;
  motherCN?: string;
  guardianFN?: string;
  guardianLN?: string;
  guardianCN?: string;
  SNEP?: string;
  pwdID?: string;
  rlGradeLevelComplete?: string;
  rlLastSYComplete?: string;
  rlLastSchoolAtt?: string;
  rlSchoolID?: string;
  semester?: string;
  track?: string;
  strand?: string;
  distanceLearning?: string;
  enrollment_status?: 'Pending' | 'Enrolled';
  created_at?: string;
}
