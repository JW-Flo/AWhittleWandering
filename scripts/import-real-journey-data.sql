-- A Whittle Wandering Journey Data Import
-- Generated on 2025-08-04T05:18:39.034Z

-- Clear existing data
DELETE FROM charges WHERE journey_id = 'continental-usa-2025';
DELETE FROM drives WHERE journey_id = 'continental-usa-2025';
DELETE FROM journeys WHERE id = 'continental-usa-2025';

-- Insert journey data

      INSERT INTO journeys (id, name, description, start_date, status, created_at, updated_at)
      VALUES (
        'continental-usa-2025',
        'A Whittle Wandering - Continental USA',
        'Epic Tesla road trip across the continental United States',
        '2025-06-01',
        'completed',
        datetime('now'),
        datetime('now')
      );
    

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-001', 'continental-usa-2025', '2025-06-01T08:00:00Z', '2025-06-02T08:00:00Z',
          523, 282, 'Start: Corpus Christi, Texas', 'Carlsbad Caverns, New Mexico',
          27.8006, -97.3964, 32.1776, -104.5281,
          83, 48, 130.72,
          111, 'Drive from Texas to New Mexico', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-002', 'continental-usa-2025', '2025-06-02T08:00:00Z', '2025-06-04T08:00:00Z',
          523, 127, 'Carlsbad Caverns, New Mexico', 'Fort Stockton overnight, Texas',
          32.1776, -104.5281, 27.8006, -97.3964,
          84, 54, 130.72,
          247, 'Drive from New Mexico to Texas', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-003', 'continental-usa-2025', '2025-06-04T08:00:00Z', '2025-06-05T08:00:00Z',
          0, 291, 'Fort Stockton overnight, Texas', 'El Paso Tesla service, Texas',
          27.8006, -97.3964, 27.8006, -97.3964,
          99, 48, 0,
          0, 'Drive from Texas to Texas', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-004', 'continental-usa-2025', '2025-06-05T08:00:00Z', '2025-06-06T08:00:00Z',
          977, 329, 'El Paso Tesla service, Texas', 'Sedona, Grand Canyon (Desert View Watchtower), Arizona',
          27.8006, -97.3964, 34.8697, -111.761,
          74, 67, 244.23,
          178, 'Drive from Texas to Arizona', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-005', 'continental-usa-2025', '2025-06-06T08:00:00Z', '2025-06-08T08:00:00Z',
          182, 295, 'Sedona, Grand Canyon (Desert View Watchtower), Arizona', 'Zion National Park (first Utah stop), Utah',
          34.8697, -111.761, 37.2982, -113.0263,
          86, 49, 45.52,
          37, 'Drive from Arizona to Utah', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-006', 'continental-usa-2025', '2025-06-08T08:00:00Z', '2025-06-09T08:00:00Z',
          799, 199, 'Zion National Park (first Utah stop), Utah', 'Drove through Las Vegas → Los Angeles, Nevada → California',
          37.2982, -113.0263, 39.8283, -98.5795,
          89, 79, 199.73,
          240, 'Drive from Utah to Nevada → California', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-007', 'continental-usa-2025', '2025-06-09T08:00:00Z', '2025-06-09T08:00:00Z',
          1154, 135, 'Drove through Las Vegas → Los Angeles, Nevada → California', '4 days in Los Angeles, then PCH north, California',
          39.8283, -98.5795, 34.0522, -118.2437,
          72, 59, 288.51,
          511, 'Drive from Nevada → California to California', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-008', 'continental-usa-2025', '2025-06-09T08:00:00Z', '2025-06-14T08:00:00Z',
          0, 329, '4 days in Los Angeles, then PCH north, California', 'Redwoods National Park, California',
          34.0522, -118.2437, 34.0522, -118.2437,
          99, 55, 0,
          0, 'Drive from California to California', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-009', 'continental-usa-2025', '2025-06-14T08:00:00Z', '2025-06-15T08:00:00Z',
          685, 186, 'Redwoods National Park, California', 'Cannon Beach, Oregon',
          34.0522, -118.2437, 43.8041, -120.5542,
          81, 67, 171.28,
          220, 'Drive from California to Oregon', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-010', 'continental-usa-2025', '2025-06-15T08:00:00Z', '2025-06-16T08:00:00Z',
          273, 171, 'Cannon Beach, Oregon', 'Verlot, Mount Baker-Snoqualmie, Washington',
          43.8041, -120.5542, 47.7511, -120.7401,
          84, 71, 68.22,
          96, 'Drive from Oregon to Washington', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-011', 'continental-usa-2025', '2025-06-16T08:00:00Z', '2025-06-17T08:00:00Z',
          0, 130, 'Verlot, Mount Baker-Snoqualmie, Washington', 'Sequim, Washington',
          47.7511, -120.7401, 47.7511, -120.7401,
          88, 78, 0,
          0, 'Drive from Washington to Washington', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-012', 'continental-usa-2025', '2025-06-17T08:00:00Z', '2025-06-18T08:00:00Z',
          0, 355, 'Sequim, Washington', 'Seattle (Brian), Washington',
          47.7511, -120.7401, 47.7511, -120.7401,
          95, 78, 0,
          0, 'Drive from Washington to Washington', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-013', 'continental-usa-2025', '2025-06-18T08:00:00Z', '2025-06-19T08:00:00Z',
          0, 161, 'Seattle (Brian), Washington', 'Quincy hike, Washington',
          47.7511, -120.7401, 47.7511, -120.7401,
          98, 78, 0,
          0, 'Drive from Washington to Washington', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-014', 'continental-usa-2025', '2025-06-19T08:00:00Z', '2025-06-20T08:00:00Z',
          384, 299, 'Quincy hike, Washington', 'Coeur d’Alene (camped overnight), Idaho',
          47.7511, -120.7401, 44.0682, -114.742,
          79, 47, 96.1,
          77, 'Drive from Washington to Idaho', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-015', 'continental-usa-2025', '2025-06-20T08:00:00Z', '2025-06-21T08:00:00Z',
          322, 317, 'Coeur d’Alene (camped overnight), Idaho', 'Bozeman, Montana',
          44.0682, -114.742, 47.0527, -109.6333,
          84, 44, 80.44,
          61, 'Drive from Idaho to Montana', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-016', 'continental-usa-2025', '2025-06-21T08:00:00Z', '2025-06-22T08:00:00Z',
          0, 128, 'Bozeman, Montana', 'Big Sky (summited Lone Mountain), Montana',
          47.0527, -109.6333, 47.0527, -109.6333,
          85, 48, 0,
          0, 'Drive from Montana to Montana', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-017', 'continental-usa-2025', '2025-06-22T08:00:00Z', '2025-06-23T08:00:00Z',
          298, 319, 'Big Sky (summited Lone Mountain), Montana', 'Yellowstone National Park, Wyoming',
          47.0527, -109.6333, 43.0759, -107.2903,
          85, 53, 74.4,
          56, 'Drive from Montana to Wyoming', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-018', 'continental-usa-2025', '2025-06-23T08:00:00Z', '2025-06-25T08:00:00Z',
          501, 262, 'Yellowstone National Park, Wyoming', 'Salt Lake City → 2-day Provo visit (after Wyoming), Utah',
          43.0759, -107.2903, 37.2982, -113.0263,
          91, 56, 125.2,
          115, 'Drive from Wyoming to Utah', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-019', 'continental-usa-2025', '2025-06-25T08:00:00Z', '2025-06-27T08:00:00Z',
          799, 297, 'Salt Lake City → 2-day Provo visit (after Wyoming), Utah', 'Denver (Josh), Fort Collins (Caleb), Colorado',
          37.2982, -113.0263, 39.8283, -98.5795,
          70, 63, 199.73,
          162, 'Drive from Utah to Colorado', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-020', 'continental-usa-2025', '2025-06-27T08:00:00Z', '2025-07-03T08:00:00Z',
          134, 238, 'Denver (Josh), Fort Collins (Caleb), Colorado', 'Arrived Lincoln for 4-day stay, Nebraska',
          39.8283, -98.5795, 41.4925, -99.9018,
          97, 71, 33.57,
          34, 'Drive from Colorado to Nebraska', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-021', 'continental-usa-2025', '2025-07-03T08:00:00Z', '2025-07-04T08:00:00Z',
          134, 342, 'Arrived Lincoln for 4-day stay, Nebraska', 'Council Bluffs → Badlands, Iowa → South Dakota',
          41.4925, -99.9018, 39.8283, -98.5795,
          87, 70, 33.57,
          24, 'Drive from Nebraska to Iowa → South Dakota', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-022', 'continental-usa-2025', '2025-07-04T08:00:00Z', '2025-07-05T08:00:00Z',
          547, 334, 'Council Bluffs → Badlands, Iowa → South Dakota', 'Fargo (dinner + overnight), North Dakota',
          39.8283, -98.5795, 47.6201, -100.5407,
          81, 70, 136.79,
          98, 'Drive from Iowa → South Dakota to North Dakota', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-023', 'continental-usa-2025', '2025-07-05T08:00:00Z', '2025-07-06T08:00:00Z',
          289, 239, 'Fargo (dinner + overnight), North Dakota', 'Minneapolis, Minnesota',
          47.6201, -100.5407, 46.3544, -94.6859,
          70, 55, 72.35,
          73, 'Drive from North Dakota to Minnesota', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-024', 'continental-usa-2025', '2025-07-06T08:00:00Z', '2025-07-07T08:00:00Z',
          338, 343, 'Minneapolis, Minnesota', 'Mars Cheese Castle (Kenosha), Wisconsin',
          46.3544, -94.6859, 43.7844, -88.7879,
          76, 44, 84.52,
          59, 'Drive from Minnesota to Wisconsin', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-025', 'continental-usa-2025', '2025-07-07T08:00:00Z', '2025-07-08T08:00:00Z',
          573, 257, 'Mars Cheese Castle (Kenosha), Wisconsin', 'Chicago (Wrigleyville, met Connor McBride), Illinois',
          43.7844, -88.7879, 39.8283, -98.5795,
          89, 73, 143.28,
          134, 'Drive from Wisconsin to Illinois', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-026', 'continental-usa-2025', '2025-07-08T08:00:00Z', '2025-07-09T08:00:00Z',
          0, 137, 'Chicago (Wrigleyville, met Connor McBride), Illinois', 'Terre Haute (Jack Lavey), Turkey Run State Park, Indiana',
          39.8283, -98.5795, 39.8283, -98.5795,
          86, 43, 0,
          0, 'Drive from Illinois to Indiana', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-027', 'continental-usa-2025', '2025-07-09T08:00:00Z', '2025-07-10T08:00:00Z',
          834, 123, 'Terre Haute (Jack Lavey), Turkey Run State Park, Indiana', 'John Bryan SP, Clifton Gorge, Ohio',
          39.8283, -98.5795, 40.2732, -82.7937,
          82, 47, 208.6,
          407, 'Drive from Indiana to Ohio', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-028', 'continental-usa-2025', '2025-07-10T08:00:00Z', '2025-07-11T08:00:00Z',
          0, 205, 'John Bryan SP, Clifton Gorge, Ohio', '2 nights in Cincinnati (Cameron Hynes), Ohio',
          40.2732, -82.7937, 40.2732, -82.7937,
          78, 65, 0,
          0, 'Drive from Ohio to Ohio', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-029', 'continental-usa-2025', '2025-07-11T08:00:00Z', '2025-07-13T08:00:00Z',
          300, 310, '2 nights in Cincinnati (Cameron Hynes), Ohio', 'Erie + Lake Erie, Pennsylvania',
          40.2732, -82.7937, 41.2033, -77.1945,
          79, 42, 75.01,
          58, 'Drive from Ohio to Pennsylvania', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-030', 'continental-usa-2025', '2025-07-13T08:00:00Z', '2025-07-14T08:00:00Z',
          134, 125, 'Erie + Lake Erie, Pennsylvania', 'Albany (Phil Dalton), New York',
          41.2033, -77.1945, 42.1657, -74.9481,
          91, 73, 33.41,
          64, 'Drive from Pennsylvania to New York', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-031', 'continental-usa-2025', '2025-07-14T08:00:00Z', '2025-07-15T08:00:00Z',
          172, 238, 'Albany (Phil Dalton), New York', 'Green Mountain National Forest, Vermont',
          42.1657, -74.9481, 44.0459, -72.7107,
          85, 77, 43.02,
          43, 'Drive from New York to Vermont', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-032', 'continental-usa-2025', '2025-07-15T08:00:00Z', '2025-07-16T08:00:00Z',
          70, 314, 'Green Mountain National Forest, Vermont', 'White Mountain Visitor Center, New Hampshire',
          44.0459, -72.7107, 43.4525, -71.5639,
          91, 48, 17.6,
          13, 'Drive from Vermont to New Hampshire', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-033', 'continental-usa-2025', '2025-07-16T08:00:00Z', '2025-07-17T08:00:00Z',
          1411, 245, 'White Mountain Visitor Center, New Hampshire', 'Bar Harbor, Cadillac Mountain (sunrise hike), Maine',
          43.4525, -71.5639, 39.8283, -98.5795,
          71, 63, 352.72,
          345, 'Drive from New Hampshire to Maine', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-034', 'continental-usa-2025', '2025-07-17T08:00:00Z', '2025-07-19T08:00:00Z',
          1439, 215, 'Bar Harbor, Cadillac Mountain (sunrise hike), Maine', 'Drove through → Connecticut, Massachusetts',
          39.8283, -98.5795, 42.2352, -71.0275,
          88, 40, 359.84,
          401, 'Drive from Maine to Massachusetts', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-035', 'continental-usa-2025', '2025-07-19T08:00:00Z', '2025-07-20T08:00:00Z',
          99, 360, 'Drove through → Connecticut, Massachusetts', 'Stratford stay with Deanna, Connecticut',
          42.2352, -71.0275, 41.5978, -72.7554,
          77, 41, 24.79,
          17, 'Drive from Massachusetts to Connecticut', datetime('now'), datetime('now')
        );
      

        INSERT INTO drives (
          id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed_mph, notes, created_at, updated_at
        ) VALUES (
          'drive-036', 'continental-usa-2025', '2025-07-20T08:00:00Z', '2025-07-25T08:00:00Z',
          64, 199, 'Stratford stay with Deanna, Connecticut', 'Watch Hill Point (coastal visit), Rhode Island',
          41.5978, -72.7554, 41.6809, -71.5118,
          86, 59, 16.12,
          19, 'Drive from Connecticut to Rhode Island', datetime('now'), datetime('now')
        );
      

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-001', 'continental-usa-2025', '2025-06-02T09:00:00.000Z', '2025-06-02T09:42:00.000Z',
            'Supercharger - New Mexico', 39, 18.2,
            48, 100, 32.1776,
            -104.5281, 'Charging session in New Mexico', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-002', 'continental-usa-2025', '2025-06-04T09:00:00.000Z', '2025-06-04T09:37:00.000Z',
            'Supercharger - Texas', 34.5, 16.1,
            54, 100, 27.8006,
            -97.3964, 'Charging session in Texas', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-003', 'continental-usa-2025', '2025-06-05T09:00:00.000Z', '2025-06-05T09:42:00.000Z',
            'Supercharger - Texas', 39, 18.2,
            48, 100, 27.8006,
            -97.3964, 'Charging session in Texas', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-004', 'continental-usa-2025', '2025-06-06T09:00:00.000Z', '2025-06-06T09:26:00.000Z',
            'Supercharger - Grand Canyon (Desert View Watchtower)', 24.75, 11.55,
            67, 100, 34.8697,
            -111.761, 'Charging session in Grand Canyon (Desert View Watchtower)', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-005', 'continental-usa-2025', '2025-06-08T09:00:00.000Z', '2025-06-08T09:41:00.000Z',
            'Supercharger - Utah', 38.25, 17.85,
            49, 100, 37.2982,
            -113.0263, 'Charging session in Utah', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-006', 'continental-usa-2025', '2025-06-09T09:00:00.000Z', '2025-06-09T09:17:00.000Z',
            'Supercharger - Nevada → California', 15.75, 7.35,
            79, 100, 39.8283,
            -98.5795, 'Charging session in Nevada → California', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-007', 'continental-usa-2025', '2025-06-09T09:00:00.000Z', '2025-06-09T09:33:00.000Z',
            'Supercharger - then PCH north', 30.75, 14.35,
            59, 100, 34.0522,
            -118.2437, 'Charging session in then PCH north', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-008', 'continental-usa-2025', '2025-06-15T09:00:00.000Z', '2025-06-15T09:26:00.000Z',
            'Supercharger - Oregon', 24.75, 11.55,
            67, 100, 43.8041,
            -120.5542, 'Charging session in Oregon', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-009', 'continental-usa-2025', '2025-06-16T09:00:00.000Z', '2025-06-16T09:23:00.000Z',
            'Supercharger - Mount Baker-Snoqualmie', 21.75, 10.15,
            71, 100, 47.7511,
            -120.7401, 'Charging session in Mount Baker-Snoqualmie', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-010', 'continental-usa-2025', '2025-06-20T09:00:00.000Z', '2025-06-20T09:42:00.000Z',
            'Supercharger - Idaho', 39.75, 18.55,
            47, 100, 44.0682,
            -114.742, 'Charging session in Idaho', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-011', 'continental-usa-2025', '2025-06-21T09:00:00.000Z', '2025-06-21T09:45:00.000Z',
            'Supercharger - Montana', 42, 19.6,
            44, 100, 47.0527,
            -109.6333, 'Charging session in Montana', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-012', 'continental-usa-2025', '2025-06-22T09:00:00.000Z', '2025-06-22T09:42:00.000Z',
            'Supercharger - Montana', 39, 18.2,
            48, 100, 47.0527,
            -109.6333, 'Charging session in Montana', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-013', 'continental-usa-2025', '2025-06-23T09:00:00.000Z', '2025-06-23T09:38:00.000Z',
            'Supercharger - Wyoming', 35.25, 16.45,
            53, 100, 43.0759,
            -107.2903, 'Charging session in Wyoming', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-014', 'continental-usa-2025', '2025-06-25T09:00:00.000Z', '2025-06-25T09:35:00.000Z',
            'Supercharger - Utah', 33, 15.4,
            56, 100, 37.2982,
            -113.0263, 'Charging session in Utah', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-015', 'continental-usa-2025', '2025-06-27T09:00:00.000Z', '2025-06-27T09:30:00.000Z',
            'Supercharger - Fort Collins (Caleb)', 27.75, 12.95,
            63, 100, 39.8283,
            -98.5795, 'Charging session in Fort Collins (Caleb)', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-016', 'continental-usa-2025', '2025-07-05T09:00:00.000Z', '2025-07-05T09:24:00.000Z',
            'Supercharger - North Dakota', 22.5, 10.5,
            70, 100, 47.6201,
            -100.5407, 'Charging session in North Dakota', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-017', 'continental-usa-2025', '2025-07-06T09:00:00.000Z', '2025-07-06T09:36:00.000Z',
            'Supercharger - Minnesota', 33.75, 15.75,
            55, 100, 46.3544,
            -94.6859, 'Charging session in Minnesota', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-018', 'continental-usa-2025', '2025-07-07T09:00:00.000Z', '2025-07-07T09:45:00.000Z',
            'Supercharger - Wisconsin', 42, 19.6,
            44, 100, 43.7844,
            -88.7879, 'Charging session in Wisconsin', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-019', 'continental-usa-2025', '2025-07-08T09:00:00.000Z', '2025-07-08T09:22:00.000Z',
            'Supercharger - met Connor McBride)', 20.25, 9.45,
            73, 100, 39.8283,
            -98.5795, 'Charging session in met Connor McBride)', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-020', 'continental-usa-2025', '2025-07-09T09:00:00.000Z', '2025-07-09T09:46:00.000Z',
            'Supercharger - Turkey Run State Park', 42.75, 19.95,
            43, 100, 39.8283,
            -98.5795, 'Charging session in Turkey Run State Park', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-021', 'continental-usa-2025', '2025-07-10T09:00:00.000Z', '2025-07-10T09:42:00.000Z',
            'Supercharger - Clifton Gorge', 39.75, 18.55,
            47, 100, 40.2732,
            -82.7937, 'Charging session in Clifton Gorge', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-022', 'continental-usa-2025', '2025-07-13T09:00:00.000Z', '2025-07-13T09:46:00.000Z',
            'Supercharger - Pennsylvania', 43.5, 20.3,
            42, 100, 41.2033,
            -77.1945, 'Charging session in Pennsylvania', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-023', 'continental-usa-2025', '2025-07-16T09:00:00.000Z', '2025-07-16T09:42:00.000Z',
            'Supercharger - New Hampshire', 39, 18.2,
            48, 100, 43.4525,
            -71.5639, 'Charging session in New Hampshire', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-024', 'continental-usa-2025', '2025-07-17T09:00:00.000Z', '2025-07-17T09:30:00.000Z',
            'Supercharger - Cadillac Mountain (sunrise hike)', 27.75, 12.95,
            63, 100, 39.8283,
            -98.5795, 'Charging session in Cadillac Mountain (sunrise hike)', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-025', 'continental-usa-2025', '2025-07-19T09:00:00.000Z', '2025-07-19T09:48:00.000Z',
            'Supercharger - Massachusetts', 45, 21,
            40, 100, 42.2352,
            -71.0275, 'Charging session in Massachusetts', datetime('now'), datetime('now')
          );
        

          INSERT INTO charges (
            id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, notes, created_at, updated_at
          ) VALUES (
            'charge-026', 'continental-usa-2025', '2025-07-20T09:00:00.000Z', '2025-07-20T09:47:00.000Z',
            'Supercharger - Connecticut', 44.25, 20.65,
            41, 100, 41.5978,
            -72.7554, 'Charging session in Connecticut', datetime('now'), datetime('now')
          );
        