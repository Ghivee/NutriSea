-- ============================================
-- NUTRISEA DUMMY DATA SEEDING (40 USERS)
-- SEMUA KOLOM TERISI SEMPURNA (NO NULLS)
-- ============================================

DO $$
DECLARE
    new_user_id UUID;
    i INT;
    -- 40 Nama Bunda
    bunda_names TEXT[] := ARRAY[
        'Siti Aminah', 'Dewi Lestari', 'Ayu Wandira', 'Rina Melati', 'Maya Sari', 
        'Rini Yulianti', 'Nina Karlina', 'Tika Panggabean', 'Sari Nila', 'Dian Sastro',
        'Endang Sukenti', 'Lani Marini', 'Wati Setiawati', 'Yuni Shara', 'Kris Dayanti',
        'Rosa Linda', 'Melly Goeslaw', 'Bunga Citra', 'Raisa Andriana', 'Isyana Sarasvati',
        'Agnez Mo', 'Inul Daratista', 'Soimah Pancawati', 'Zaskia Gotik', 'Via Vallen',
        'Nella Kharisma', 'Cita Citata', 'Ayu Ting Ting', 'Nagita Slavina', 'Paula Verhoeven',
        'Sarwendah Tan', 'Ashanty Siddik', 'Aurel Hermansyah', 'Titi Kamal', 'Laudya Bella',
        'Zaskia Adya', 'Shireen Sungkar', 'Citra Kirana', 'Irish Bella', 'Jessica Mila'
    ];
    -- 40 Nama Anak
    anak_names TEXT[] := ARRAY[
        'Gibran Rakabuming', 'Hanzalah', 'Aisyah Putri', 'Bintang Kejora', 'Cahaya Iman',
        'Daffa Alghifari', 'Erlangga', 'Fathir', 'Ghani', 'Hafiz',
        'Irfan', 'Junaedi', 'Kaila', 'Laras', 'Manda',
        'Naufal', 'Olivia', 'Putra', 'Qonita', 'Rizky',
        'Syafira', 'Tiara', 'Umar', 'Vanya', 'Wira',
        'Xena', 'Yusuf', 'Zahra', 'Abid', 'Bilal',
        'Cika', 'Doni', 'Elisa', 'Fani', 'Gani',
        'Hana', 'Iis', 'Joko', 'Kiki', 'Lulu'
    ];
    gender TEXT;
    med_id UUID;
    existing_user_id UUID;
    email_str TEXT;
    
    -- Wilayah Data
    prov_ids TEXT[] := ARRAY['32', '33', '35', '31'];
    prov_names TEXT[] := ARRAY['Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'DKI Jakarta'];
    
    city_ids TEXT[] := ARRAY['3201', '3301', '3501', '3101'];
    city_names TEXT[] := ARRAY['Bogor', 'Semarang', 'Surabaya', 'Jakarta Pusat'];
    
    dist_ids TEXT[] := ARRAY['320101', '330101', '350101', '310101'];
    dist_names TEXT[] := ARRAY['Cibinong', 'Semarang Timur', 'Gubeng', 'Gambir'];
    
    vill_ids TEXT[] := ARRAY['32010101', '33010101', '35010101', '31010101'];
    vill_names TEXT[] := ARRAY['Pabuaran', 'Kemijen', 'Airlangga', 'Kebon Kelapa'];

BEGIN
    FOR i IN 1..40 LOOP
        gender := CASE WHEN i % 2 = 0 THEN 'Perempuan' ELSE 'Laki-laki' END;
        email_str := LOWER(REPLACE(bunda_names[i], ' ', '.')) || '@nutrisea.demo';

        -- 1. Create or Get User from auth.users
        SELECT id INTO existing_user_id FROM auth.users WHERE email = email_str LIMIT 1;

        IF existing_user_id IS NOT NULL THEN
            new_user_id := existing_user_id;
        ELSE
            new_user_id := gen_random_uuid();
            INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
            VALUES (
                new_user_id, 'authenticated', 'authenticated', email_str, 
                crypt('password123', gen_salt('bf')), NOW(), 
                '{"provider":"email","providers":["email"]}', '{"role":"user"}', 
                NOW(), NOW(), '', '', '', ''
            );
        END IF;

        -- 2. Insert/Update Profile (NO NULLS)
        INSERT INTO profiles (
            id, email, full_name, role, gender, phone, date_of_birth, 
            is_profile_complete, allergy_info, created_at, updated_at,
            rt, rw, desa, child_name, nik_anak, birth_weight, birth_length,
            province_id, city_id, district_id, village_id,
            province, city, district, village
        )
        VALUES (
            new_user_id,
            email_str,
            bunda_names[i],
            'user',
            gender,
            '0812' || floor(random() * 90000000 + 10000000)::text,
            (NOW() - ((1 + (random() * 3)::INT) || ' years')::interval)::date, -- Tanggal Lahir Anak 1-4 thn
            true,
            CASE WHEN i % 10 = 0 THEN 'Alergi Seafood' ELSE 'Tidak Ada' END,
            NOW() - ((random() * 30)::INT || ' days')::interval,
            NOW(),
            lpad((i % 15 + 1)::text, 2, '0'), -- RT
            lpad((i % 10 + 1)::text, 2, '0'), -- RW
            vill_names[(i % 4) + 1],
            anak_names[i],
            '320' || floor(random() * 9000000000000 + 1000000000000)::text,
            2.5 + (random() * 1.5), -- Weight 2.5 - 4.0 kg
            45 + (random() * 10),    -- Length 45 - 55 cm
            prov_ids[(i % 4) + 1],
            city_ids[(i % 4) + 1],
            dist_ids[(i % 4) + 1],
            vill_ids[(i % 4) + 1],
            prov_names[(i % 4) + 1],
            city_names[(i % 4) + 1],
            dist_names[(i % 4) + 1],
            vill_names[(i % 4) + 1]
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            gender = EXCLUDED.gender,
            phone = EXCLUDED.phone,
            date_of_birth = EXCLUDED.date_of_birth,
            allergy_info = EXCLUDED.allergy_info,
            rt = EXCLUDED.rt,
            rw = EXCLUDED.rw,
            desa = EXCLUDED.desa,
            child_name = EXCLUDED.child_name,
            nik_anak = EXCLUDED.nik_anak,
            birth_weight = EXCLUDED.birth_weight,
            birth_length = EXCLUDED.birth_length,
            province_id = EXCLUDED.province_id,
            city_id = EXCLUDED.city_id,
            district_id = EXCLUDED.district_id,
            village_id = EXCLUDED.village_id,
            province = EXCLUDED.province,
            city = EXCLUDED.city,
            district = EXCLUDED.district,
            village = EXCLUDED.village,
            is_profile_complete = true,
            updated_at = NOW();

        -- 3. Medications (Jadwal Gummy)
        -- Delete old meds first to prevent double active meds for one user if rerunning
        DELETE FROM medications WHERE user_id = new_user_id;
        
        INSERT INTO medications (id, user_id, name, dosage, frequency, instruction, total_tablets, remaining_tablets, start_date, is_active, schedule_times)
        VALUES (
            gen_random_uuid(), 
            new_user_id, 
            'NutriSea Gummy High-DHA', 
            '1 Butir', 
            '1x Sehari', 
            'Setelah sarapan pagi', 
            30, 
            (random() * 25 + 5)::INT, 
            (NOW() - interval '15 days')::date, 
            true, 
            ARRAY['08:00']::TEXT[]
        ) RETURNING id INTO med_id;

        -- 4. Compliance Logs (History)
        DELETE FROM compliance_logs WHERE user_id = new_user_id;
        
        INSERT INTO compliance_logs (user_id, medication_id, status, taken_at, notes)
        SELECT 
            new_user_id, 
            med_id, 
            CASE WHEN random() > 0.15 THEN 'taken' ELSE 'missed' END,
            NOW() - (n || ' days')::interval,
            'Catatan kepatuhan harian dummy'
        FROM generate_series(1, 14) n;

        -- 5. Symptom/Growth Logs (Pertumbuhan)
        DELETE FROM symptom_logs WHERE user_id = new_user_id;
        
        INSERT INTO symptom_logs (user_id, symptoms, severity, notes, created_at)
        VALUES (
            new_user_id, 
            ARRAY['tumbuh_kembang']::TEXT[],
            5,
            'TB: ' || (72 + (random() * 15))::numeric(4,1) || ' cm, BB: ' || (9 + (random() * 8))::numeric(4,1) || ' kg, Catatan: Pertumbuhan terpantau stabil dan anak ceria.',
            NOW() - interval '7 days'
        );

    END LOOP;
END $$;
