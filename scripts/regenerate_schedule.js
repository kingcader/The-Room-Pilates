const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually since we're running with node
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabaseUrl = envVars.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSchedule() {
  console.log('Updating schedule...');

  // 1. Get Class IDs
  const { data: classes } = await supabase.from('classes').select('id, name');
  const sculptId = classes.find(c => c.name === 'Sculpt Pilates')?.id;
  const matId = classes.find(c => c.name === 'Mat Pilates')?.id;
  const redLightId = classes.find(c => c.name === 'Red Light Pilates')?.id;

  if (!sculptId || !matId || !redLightId) {
    console.error('Could not find all classes');
    return;
  }

  // 2. Clear future schedule (from tomorrow onwards to preserve today's history if any)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const { error: deleteError } = await supabase
    .from('schedule')
    .delete()
    .gte('start_time', tomorrow.toISOString());

  if (deleteError) {
    console.error('Error clearing schedule:', deleteError);
    return;
  }

  // 3. Generate new schedule for next 30 days
  const scheduleItems = [];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(tomorrow);
    date.setDate(date.getDate() + i);
    const day = date.getDay();

    // Skip Sundays (0) if you want closed on Sundays, or include them?
    // The previous schedule seemed to imply Mon-Fri. Let's stick to Mon-Fri for now based on the "5 day" pattern in the prompt images.
    // Actually, let's include Saturday too since the calendar strip showed Sat/Sun dates.
    // The poster usually shows Mon-Fri. I'll stick to Mon-Fri to match the poster style request.
    if (day === 0 || day === 6) continue; // Skip Sat/Sun

    // 9:00 AM - Sculpt Pilates
    const time9 = new Date(date);
    time9.setHours(9, 0, 0, 0);
    scheduleItems.push({
      class_id: sculptId,
      start_time: time9.toISOString(),
      instructor_name: 'Sarah Johnson'
    });

    // 12:30 PM - Mat Pilates
    const time1230 = new Date(date);
    time1230.setHours(12, 30, 0, 0);
    scheduleItems.push({
      class_id: matId,
      start_time: time1230.toISOString(),
      instructor_name: 'Emma Davis'
    });

    // 4:00 PM - Red Light Pilates
    const time16 = new Date(date);
    time16.setHours(16, 0, 0, 0);
    scheduleItems.push({
      class_id: redLightId,
      start_time: time16.toISOString(),
      instructor_name: 'Michael Chen'
    });
  }

  const { error: insertError } = await supabase
    .from('schedule')
    .insert(scheduleItems);

  if (insertError) {
    console.error('Error inserting new schedule:', insertError);
  } else {
    console.log('Success! Schedule updated with new times.');
  }
}

updateSchedule();

