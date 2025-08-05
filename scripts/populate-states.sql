-- Populate states_visited table from existing drive data
-- This should be run as a migration or one-time script

-- First, let's see what states we can extract from the drive addresses
WITH drive_states AS (
  SELECT DISTINCT
    -- Extract states from start addresses
    CASE 
      WHEN start_address LIKE '%Texas%' THEN 'Texas'
      WHEN start_address LIKE '%New Mexico%' THEN 'New Mexico'
      WHEN start_address LIKE '%Arizona%' THEN 'Arizona'
      WHEN start_address LIKE '%Utah%' THEN 'Utah'
      WHEN start_address LIKE '%Nevada%' THEN 'Nevada'
      WHEN start_address LIKE '%California%' THEN 'California'
      WHEN start_address LIKE '%Colorado%' THEN 'Colorado'
      WHEN start_address LIKE '%Wyoming%' THEN 'Wyoming'
      WHEN start_address LIKE '%Montana%' THEN 'Montana'
      WHEN start_address LIKE '%Idaho%' THEN 'Idaho'
      WHEN start_address LIKE '%Washington%' THEN 'Washington'
      WHEN start_address LIKE '%Oregon%' THEN 'Oregon'
      WHEN start_address LIKE '%North Dakota%' THEN 'North Dakota'
      WHEN start_address LIKE '%South Dakota%' THEN 'South Dakota'
      WHEN start_address LIKE '%Minnesota%' THEN 'Minnesota'
      WHEN start_address LIKE '%Wisconsin%' THEN 'Wisconsin'
      WHEN start_address LIKE '%Illinois%' THEN 'Illinois'
      WHEN start_address LIKE '%Indiana%' THEN 'Indiana'
      WHEN start_address LIKE '%Ohio%' THEN 'Ohio'
      WHEN start_address LIKE '%Michigan%' THEN 'Michigan'
      WHEN start_address LIKE '%Pennsylvania%' THEN 'Pennsylvania'
      WHEN start_address LIKE '%New York%' THEN 'New York'
      WHEN start_address LIKE '%Vermont%' THEN 'Vermont'
      WHEN start_address LIKE '%New Hampshire%' THEN 'New Hampshire'
      WHEN start_address LIKE '%Maine%' THEN 'Maine'
      WHEN start_address LIKE '%Massachusetts%' THEN 'Massachusetts'
      WHEN start_address LIKE '%Rhode Island%' THEN 'Rhode Island'
      WHEN start_address LIKE '%Connecticut%' THEN 'Connecticut'
      WHEN start_address LIKE '%New Jersey%' THEN 'New Jersey'
      WHEN start_address LIKE '%Delaware%' THEN 'Delaware'
      WHEN start_address LIKE '%Maryland%' THEN 'Maryland'
      WHEN start_address LIKE '%Virginia%' THEN 'Virginia'
      WHEN start_address LIKE '%West Virginia%' THEN 'West Virginia'
      WHEN start_address LIKE '%North Carolina%' THEN 'North Carolina'
      WHEN start_address LIKE '%South Carolina%' THEN 'South Carolina'
      WHEN start_address LIKE '%Georgia%' THEN 'Georgia'
      WHEN start_address LIKE '%Florida%' THEN 'Florida'
      WHEN start_address LIKE '%Alabama%' THEN 'Alabama'
      WHEN start_address LIKE '%Mississippi%' THEN 'Mississippi'
      WHEN start_address LIKE '%Tennessee%' THEN 'Tennessee'
      WHEN start_address LIKE '%Kentucky%' THEN 'Kentucky'
      WHEN start_address LIKE '%Louisiana%' THEN 'Louisiana'
      WHEN start_address LIKE '%Arkansas%' THEN 'Arkansas'
      WHEN start_address LIKE '%Missouri%' THEN 'Missouri'
      WHEN start_address LIKE '%Iowa%' THEN 'Iowa'
      WHEN start_address LIKE '%Kansas%' THEN 'Kansas'
      WHEN start_address LIKE '%Nebraska%' THEN 'Nebraska'
      WHEN start_address LIKE '%Oklahoma%' THEN 'Oklahoma'
    END as state_name
  FROM drives
  WHERE journey_id = 'continental-usa-2025'
  
  UNION
  
  SELECT DISTINCT
    -- Extract states from end addresses
    CASE 
      WHEN end_address LIKE '%Texas%' THEN 'Texas'
      WHEN end_address LIKE '%New Mexico%' THEN 'New Mexico'
      WHEN end_address LIKE '%Arizona%' THEN 'Arizona'
      WHEN end_address LIKE '%Utah%' THEN 'Utah'
      WHEN end_address LIKE '%Nevada%' THEN 'Nevada'
      WHEN end_address LIKE '%California%' THEN 'California'
      WHEN end_address LIKE '%Colorado%' THEN 'Colorado'
      WHEN end_address LIKE '%Wyoming%' THEN 'Wyoming'
      WHEN end_address LIKE '%Montana%' THEN 'Montana'
      WHEN end_address LIKE '%Idaho%' THEN 'Idaho'
      WHEN end_address LIKE '%Washington%' THEN 'Washington'
      WHEN end_address LIKE '%Oregon%' THEN 'Oregon'
      WHEN end_address LIKE '%North Dakota%' THEN 'North Dakota'
      WHEN end_address LIKE '%South Dakota%' THEN 'South Dakota'
      WHEN end_address LIKE '%Minnesota%' THEN 'Minnesota'
      WHEN end_address LIKE '%Wisconsin%' THEN 'Wisconsin'
      WHEN end_address LIKE '%Illinois%' THEN 'Illinois'
      WHEN end_address LIKE '%Indiana%' THEN 'Indiana'
      WHEN end_address LIKE '%Ohio%' THEN 'Ohio'
      WHEN end_address LIKE '%Michigan%' THEN 'Michigan'
      WHEN end_address LIKE '%Pennsylvania%' THEN 'Pennsylvania'
      WHEN end_address LIKE '%New York%' THEN 'New York'
      WHEN end_address LIKE '%Vermont%' THEN 'Vermont'
      WHEN end_address LIKE '%New Hampshire%' THEN 'New Hampshire'
      WHEN end_address LIKE '%Maine%' THEN 'Maine'
      WHEN end_address LIKE '%Massachusetts%' THEN 'Massachusetts'
      WHEN end_address LIKE '%Rhode Island%' THEN 'Rhode Island'
      WHEN end_address LIKE '%Connecticut%' THEN 'Connecticut'
      WHEN end_address LIKE '%New Jersey%' THEN 'New Jersey'
      WHEN end_address LIKE '%Delaware%' THEN 'Delaware'
      WHEN end_address LIKE '%Maryland%' THEN 'Maryland'
      WHEN end_address LIKE '%Virginia%' THEN 'Virginia'
      WHEN end_address LIKE '%West Virginia%' THEN 'West Virginia'
      WHEN end_address LIKE '%North Carolina%' THEN 'North Carolina'
      WHEN end_address LIKE '%South Carolina%' THEN 'South Carolina'
      WHEN end_address LIKE '%Georgia%' THEN 'Georgia'
      WHEN end_address LIKE '%Florida%' THEN 'Florida'
      WHEN end_address LIKE '%Alabama%' THEN 'Alabama'
      WHEN end_address LIKE '%Mississippi%' THEN 'Mississippi'
      WHEN end_address LIKE '%Tennessee%' THEN 'Tennessee'
      WHEN end_address LIKE '%Kentucky%' THEN 'Kentucky'
      WHEN end_address LIKE '%Louisiana%' THEN 'Louisiana'
      WHEN end_address LIKE '%Arkansas%' THEN 'Arkansas'
      WHEN end_address LIKE '%Missouri%' THEN 'Missouri'
      WHEN end_address LIKE '%Iowa%' THEN 'Iowa'
      WHEN end_address LIKE '%Kansas%' THEN 'Kansas'
      WHEN end_address LIKE '%Nebraska%' THEN 'Nebraska'
      WHEN end_address LIKE '%Oklahoma%' THEN 'Oklahoma'
    END as state_name
  FROM drives
  WHERE journey_id = 'continental-usa-2025'
)
INSERT OR IGNORE INTO states_visited (journey_id, state_name, first_visited_date, created_at)
SELECT 
  'continental-usa-2025' as journey_id,
  state_name,
  (
    SELECT MIN(date)
    FROM (
      SELECT date FROM drives WHERE journey_id = 'continental-usa-2025' AND (
        start_address LIKE '%' || drive_states.state_name || '%' OR
        end_address LIKE '%' || drive_states.state_name || '%'
      )
    )
  ) as first_visited_date,
  datetime('now') as created_at
FROM drive_states 
WHERE state_name IS NOT NULL;
