-- CrisisIQ Demo Seed Data
-- 1 event, 12 needs, 6 volunteers, 3 assignments

-- ============================================================
-- EVENT
-- ============================================================
INSERT INTO public.events (id, name, description, lat, lng, radius_km, active) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Colombo Flood Response — May 2025', 'Major flooding across western Colombo following 72hrs continuous rainfall. Multiple areas submerged, evacuations ongoing.', 6.9271, 79.8612, 25, true);

-- ============================================================
-- VOLUNTEERS
-- ============================================================
INSERT INTO public.volunteers (id, user_id, name, lat, lng, skills, available, phone) VALUES
  ('v1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Dr. Amara Perera', 6.9344, 79.8428, '{medical,driving}', true, '+94771234001'),
  ('v1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Kamal Dissanayake', 6.9120, 79.8650, '{rescue,driving,logistics}', true, '+94771234002'),
  ('v1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Nimal Jayasuriya', 6.9450, 79.8710, '{cooking,logistics}', true, '+94771234003'),
  ('v1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Fatima Hassan', 6.9185, 79.8520, '{medical,translation}', false, '+94771234004'),
  ('v1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'Ravi Mendis', 6.9500, 79.8800, '{rescue,driving}', true, '+94771234005'),
  ('v1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'Lakshmi Silva', 6.9250, 79.8350, '{cooking,translation,logistics}', true, '+94771234006');

-- ============================================================
-- NEEDS (12 total — varied types, urgencies, statuses)
-- ============================================================

-- Pending needs (6)
INSERT INTO public.needs (id, submitter_name, lat, lng, need_type, description, urgency_self, urgency_ai, ai_brief, ai_matched_skills, status, event_id) VALUES
  ('n1000000-0000-0000-0000-000000000001', 'Sunil Fernando', 6.9310, 79.8480, 'rescue', 'Family of 4 stranded on second floor. Water level rising, ground floor fully submerged. Elderly grandmother cannot swim.', 5, 5, 'Critical rescue needed for trapped family with elderly member. Water rising — immediate boat/rescue team deployment required.', '{rescue,driving}', 'pending', 'e1000000-0000-0000-0000-000000000001'),
  ('n1000000-0000-0000-0000-000000000002', 'Priya Gunasekara', 6.9150, 79.8590, 'medical', 'Diabetic patient ran out of insulin 2 days ago. Feeling dizzy and weak. No pharmacy accessible due to flooding.', 4, 5, 'Urgent medical supply delivery for diabetic patient without insulin for 48hrs. Risk of diabetic emergency escalating.', '{medical,driving}', 'pending', 'e1000000-0000-0000-0000-000000000001'),
  ('n1000000-0000-0000-0000-000000000003', 'Community Center Wellawatte', 6.8740, 79.8600, 'food', '45 displaced families sheltering at community center. Food supplies running low, expect to run out by tomorrow morning.', 3, 3, 'Medium-priority food resupply for 45 displaced families. Current supplies last until morning — plan logistics for bulk delivery.', '{cooking,logistics,driving}', 'pending', 'e1000000-0000-0000-0000-000000000001'),
  ('n1000000-0000-0000-0000-000000000004', 'Anil Rathnayake', 6.9400, 79.8750, 'shelter', 'Roof collapsed in our area. 3 families (12 people) need temporary shelter. Currently standing in rain.', 4, 4, 'Displaced families need immediate temporary shelter. Exposure risk in ongoing rain — prioritize nearby dry facilities.', '{logistics,driving}', 'pending', 'e1000000-0000-0000-0000-000000000001'),
  ('n1000000-0000-0000-0000-000000000005', 'Mohamed Ali', 6.9280, 79.8400, 'other', 'Lost contact with elderly neighbor (lives alone) since yesterday. Her phone is off. House is in low-lying area.', 3, 4, 'Welfare check needed for isolated elderly resident. No contact for 24hrs in flood-prone area — potential rescue situation.', '{rescue,driving}', 'pending', 'e1000000-0000-0000-0000-000000000001'),
  ('n1000000-0000-0000-0000-000000000006', 'Kamini Peris', 6.9100, 79.8700, 'food', 'Single mother with 3 young children. No food since yesterday, cannot leave house due to waist-high water outside.', 4, 4, 'Food delivery needed for isolated mother and children. Inaccessible by foot — requires boat or wading access.', '{cooking,driving,rescue}', 'pending', 'e1000000-0000-0000-0000-000000000001');

-- Assigned needs (3 — these have volunteers working on them)
INSERT INTO public.needs (id, submitter_name, lat, lng, need_type, description, urgency_self, urgency_ai, ai_brief, ai_matched_skills, status, assigned_volunteer_id, event_id) VALUES
  ('n1000000-0000-0000-0000-000000000007', 'Ruwan Bandara', 6.9380, 79.8550, 'rescue', 'Trapped in vehicle on flooded Baseline Road. Water entering car. Cannot open doors due to pressure.', 5, 5, 'Life-threatening vehicle entrapment in flood waters. Immediate rescue team with extraction tools needed.', '{rescue,driving}', 'assigned', 'v1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001'),
  ('n1000000-0000-0000-0000-000000000008', 'Galle Road Pharmacy', 6.9200, 79.8450, 'medical', 'Clinic needs medical supplies restocked urgently. Running low on bandages, antiseptic, and basic medications for walk-in patients.', 3, 3, 'Medical resupply for active clinic serving flood-affected community. Not immediately critical but impacts ongoing care capacity.', '{medical,driving,logistics}', 'in_progress', 'v1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001'),
  ('n1000000-0000-0000-0000-000000000009', 'Dehiwala Temple Committee', 6.8580, 79.8650, 'food', 'Temple converted to emergency shelter. 80 people need evening meals. Kitchen operational but no raw ingredients.', 3, 3, 'Bulk food ingredient delivery for active shelter serving 80 displaced persons. Kitchen ready — raw materials needed.', '{cooking,logistics,driving}', 'assigned', 'v1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001');

-- Resolved needs (3)
INSERT INTO public.needs (id, submitter_name, lat, lng, need_type, description, urgency_self, urgency_ai, ai_brief, ai_matched_skills, status, assigned_volunteer_id, event_id) VALUES
  ('n1000000-0000-0000-0000-000000000010', 'Thilini Samaraweera', 6.9320, 79.8620, 'rescue', 'Elderly couple stranded on rooftop at Kirulapone junction. Both have mobility issues.', 5, 5, 'Completed: Elderly couple evacuated safely from rooftop by rescue team.', '{rescue,driving}', 'resolved', 'v1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000001'),
  ('n1000000-0000-0000-0000-000000000011', 'Colombo North School', 6.9550, 79.8500, 'shelter', 'School building opened as emergency shelter. Needed cots, blankets and basic sanitation supplies for 60 evacuees.', 3, 3, 'Completed: Shelter supplies delivered. School now operational as evacuation center.', '{logistics,driving}', 'resolved', 'v1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000001'),
  ('n1000000-0000-0000-0000-000000000012', 'Muthulingam Family', 6.9180, 79.8380, 'other', 'Tamil-speaking family cannot communicate with rescue teams. Need translator for medical instructions.', 2, 3, 'Completed: Translator assigned. Family received medical care with communication support.', '{translation,medical}', 'resolved', 'v1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001');

-- ============================================================
-- ASSIGNMENTS (3 active + mark volunteers as on-mission)
-- ============================================================
INSERT INTO public.assignments (id, need_id, volunteer_id, status, coordinator_notes) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'n1000000-0000-0000-0000-000000000007', 'v1000000-0000-0000-0000-000000000002', 'en_route', 'Priority 1 — vehicle rescue. Kamal has boat and extraction gear. ETA 10 mins.'),
  ('a1000000-0000-0000-0000-000000000002', 'n1000000-0000-0000-0000-000000000008', 'v1000000-0000-0000-0000-000000000004', 'arrived', 'Fatima coordinating with pharmacy on Galle Road. Awaiting supply list confirmation.'),
  ('a1000000-0000-0000-0000-000000000003', 'n1000000-0000-0000-0000-000000000009', 'v1000000-0000-0000-0000-000000000003', 'assigned', 'Nimal sourcing rice, dhal, vegetables from wholesale market. Budget approved.');

-- Update volunteers on active missions
UPDATE public.volunteers SET available = false, active_mission_id = 'n1000000-0000-0000-0000-000000000007' WHERE id = 'v1000000-0000-0000-0000-000000000002';
UPDATE public.volunteers SET available = false, active_mission_id = 'n1000000-0000-0000-0000-000000000008' WHERE id = 'v1000000-0000-0000-0000-000000000004';
UPDATE public.volunteers SET active_mission_id = 'n1000000-0000-0000-0000-000000000009' WHERE id = 'v1000000-0000-0000-0000-000000000003';
