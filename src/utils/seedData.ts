import { supabase } from '@/lib/supabaseClient';

export const seedSchools = async () => {
  try {
    console.log('🌱 Starting to seed schools...');

    const sampleSchools = [
      {
        name: 'University of Technology',
        code: 'UTECH',
        address: '123 Technology Drive, Tech City, TC 12345',
        contact_email: 'admin@utech.edu',
        contact_phone: '+1-555-123-4567',
        timezone: 'America/New_York',
        status: 'active'
      },
      {
        name: 'City College of Sciences',
        code: 'CCS',
        address: '456 Science Boulevard, Science Park, SP 67890',
        contact_email: 'info@ccs.edu',
        contact_phone: '+1-555-987-6543',
        timezone: 'America/New_York',
        status: 'active'
      },
      {
        name: 'Metropolitan University',
        code: 'MU',
        address: '789 Metro Avenue, Downtown, DT 11111',
        contact_email: 'contact@metro.edu',
        contact_phone: '+1-555-456-7890',
        timezone: 'America/New_York',
        status: 'active'
      },
      {
        name: 'Technical Institute of Innovation',
        code: 'TII',
        address: '321 Innovation Way, Tech Hub, TH 22222',
        contact_email: 'hello@tii.edu',
        contact_phone: '+1-555-321-0987',
        timezone: 'America/New_York',
        status: 'active'
      },
      {
        name: 'Advanced Learning Academy',
        code: 'ALA',
        address: '654 Learning Lane, Education District, ED 33333',
        contact_email: 'admissions@ala.edu',
        contact_phone: '+1-555-654-3210',
        timezone: 'America/New_York',
        status: 'active'
      }
    ];

    const { data, error } = await supabase
      .from('schools')
      .insert(sampleSchools)
      .select();

    if (error) {
      console.error('❌ Error seeding schools:', error);
      throw error;
    }

    console.log('✅ Successfully seeded schools:', data);
    console.log(`📊 Added ${data.length} schools to the database`);
    
    return data;
  } catch (error) {
    console.error('💥 Failed to seed schools:', error);
    throw error;
  }
};

export const checkSchoolsExist = async () => {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, status')
      .eq('status', 'active');

    if (error) throw error;

    console.log(`📊 Current active schools in database: ${data.length}`);
    data.forEach(school => {
      console.log(`🏫 ${school.name} (${school.id})`);
    });

    return data;
  } catch (error) {
    console.error('Error checking schools:', error);
    return [];
  }
}; 