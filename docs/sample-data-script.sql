-- ============================================
-- NEURALTWIN Sample Data Creation Script
-- User: 조성신 (Cho Seongsin)
-- Organization: TCAG
-- Role: ORG_HQ
-- ============================================

-- STEP 1: Create User in auth.users (if not exists)
-- Note: You need to create this user through Supabase Auth UI or signup flow
-- Email: seongsin.cho@tcag.com
-- Password: (set through UI)
-- This script assumes the user already exists in auth.users

-- STEP 2: Get the user ID (replace with actual user_id after creating user)
-- You can get this from: SELECT id, email FROM auth.users WHERE email = 'seongsin.cho@tcag.com';
-- For this example, we'll use a placeholder variable
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_subscription_id UUID;
  v_hq_license_id UUID;
  v_store_license_id UUID;
  v_store1_id UUID;
  v_store2_id UUID;
  v_store3_id UUID;
BEGIN
  -- Get user ID (you need to replace this email with actual user email)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'seongsin.cho@tcag.com' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please create user through Supabase Auth UI first with email: seongsin.cho@tcag.com';
  END IF;

  RAISE NOTICE 'Found user ID: %', v_user_id;

  -- STEP 3: Create/Update Profile
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (v_user_id, '조성신', NULL)
  ON CONFLICT (id) 
  DO UPDATE SET 
    display_name = EXCLUDED.display_name,
    updated_at = now();

  RAISE NOTICE 'Profile created/updated';

  -- STEP 4: Create Organization (TCAG)
  INSERT INTO public.organizations (org_name, created_by, metadata)
  VALUES (
    'TCAG',
    v_user_id,
    jsonb_build_object(
      'country', 'South Korea',
      'industry', 'Retail',
      'company_size', 'medium',
      'phone', '+82-2-1234-5678',
      'address', 'Seoul, South Korea'
    )
  )
  ON CONFLICT (org_name) DO NOTHING
  RETURNING id INTO v_org_id;

  -- Get org_id if already exists
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM public.organizations WHERE org_name = 'TCAG' LIMIT 1;
  END IF;

  RAISE NOTICE 'Organization ID: %', v_org_id;

  -- STEP 5: Create Subscription for TCAG
  INSERT INTO public.subscriptions (
    org_id,
    subscription_type,
    status,
    hq_license_count,
    store_license_count,
    viewer_count,
    monthly_cost,
    billing_cycle,
    current_period_start,
    current_period_end
  )
  VALUES (
    v_org_id,
    'LICENSE_BASED',
    'active',
    1, -- 1 HQ license
    3, -- 3 Store licenses
    0, -- 0 viewers initially
    1250.00, -- (1 × 500) + (3 × 250)
    'monthly',
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month'
  )
  RETURNING id INTO v_subscription_id;

  RAISE NOTICE 'Subscription ID: %', v_subscription_id;

  -- STEP 6: Create HQ License
  INSERT INTO public.licenses (
    org_id,
    subscription_id,
    license_type,
    license_key,
    status,
    monthly_price,
    effective_date,
    next_billing_date,
    assigned_to,
    activated_at
  )
  VALUES (
    v_org_id,
    v_subscription_id,
    'HQ_SEAT',
    'NT-HQ-' || substring(gen_random_uuid()::text, 1, 8),
    'assigned',
    500.00,
    current_date,
    date_trunc('month', now()) + interval '1 month',
    v_user_id,
    now()
  )
  RETURNING id INTO v_hq_license_id;

  RAISE NOTICE 'HQ License ID: %', v_hq_license_id;

  -- STEP 7: Create Organization Member (ORG_HQ role)
  INSERT INTO public.organization_members (
    org_id,
    user_id,
    role,
    license_id,
    permissions
  )
  VALUES (
    v_org_id,
    v_user_id,
    'ORG_HQ',
    v_hq_license_id,
    jsonb_build_object(
      'canInvite', true,
      'canExport', true,
      'features', ARRAY['all']
    )
  )
  ON CONFLICT (user_id, org_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    license_id = EXCLUDED.license_id,
    permissions = EXCLUDED.permissions,
    updated_at = now();

  RAISE NOTICE 'Organization member created/updated';

  -- STEP 8: Create 3 Sample Stores
  INSERT INTO public.stores (
    user_id,
    org_id,
    store_name,
    location,
    address,
    city,
    country,
    store_type,
    area_sqm,
    status,
    metadata
  )
  VALUES 
    (
      v_user_id,
      v_org_id,
      'TCAG 강남점',
      '37.4979,127.0276',
      '서울시 강남구 테헤란로 123',
      'Seoul',
      'South Korea',
      'flagship',
      500.0,
      'active',
      jsonb_build_object(
        'opening_hours', '10:00-22:00',
        'floor_count', 3,
        'parking_spaces', 50
      )
    ),
    (
      v_user_id,
      v_org_id,
      'TCAG 홍대점',
      '37.5563,126.9236',
      '서울시 마포구 양화로 456',
      'Seoul',
      'South Korea',
      'standard',
      350.0,
      'active',
      jsonb_build_object(
        'opening_hours', '11:00-23:00',
        'floor_count', 2,
        'parking_spaces', 20
      )
    ),
    (
      v_user_id,
      v_org_id,
      'TCAG 부산점',
      '35.1796,129.0756',
      '부산시 해운대구 해운대로 789',
      'Busan',
      'South Korea',
      'standard',
      400.0,
      'active',
      jsonb_build_object(
        'opening_hours', '10:00-21:00',
        'floor_count', 2,
        'parking_spaces', 30
      )
    )
  RETURNING id INTO v_store1_id, v_store2_id, v_store3_id;

  RAISE NOTICE 'Store IDs: %, %, %', v_store1_id, v_store2_id, v_store3_id;

  -- STEP 9: Create Store Licenses and assign to stores
  FOR i IN 1..3 LOOP
    INSERT INTO public.licenses (
      org_id,
      subscription_id,
      license_type,
      license_key,
      status,
      monthly_price,
      effective_date,
      next_billing_date,
      assigned_store_id,
      activated_at
    )
    VALUES (
      v_org_id,
      v_subscription_id,
      'STORE',
      'NT-ST-' || substring(gen_random_uuid()::text, 1, 8),
      'assigned',
      250.00,
      current_date,
      date_trunc('month', now()) + interval '1 month',
      CASE 
        WHEN i = 1 THEN v_store1_id
        WHEN i = 2 THEN v_store2_id
        ELSE v_store3_id
      END,
      now()
    );
  END LOOP;

  RAISE NOTICE 'Store licenses created';

  -- STEP 10: Create Sample Products for each store
  FOR store_id IN SELECT unnest(ARRAY[v_store1_id, v_store2_id, v_store3_id]) LOOP
    INSERT INTO public.products (
      user_id,
      org_id,
      store_id,
      product_name,
      name,
      category,
      brand,
      price,
      cost_price,
      selling_price,
      stock,
      min_stock_level,
      sku
    )
    VALUES 
      (v_user_id, v_org_id, store_id, '프리미엄 티셔츠', '프리미엄 티셔츠', '의류', 'TCAG', 89000, 45000, 89000, 150, 30, 'TCAG-TS-001'),
      (v_user_id, v_org_id, store_id, '데님 진', '데님 진', '의류', 'TCAG', 129000, 65000, 129000, 100, 20, 'TCAG-DN-001'),
      (v_user_id, v_org_id, store_id, '캐주얼 셔츠', '캐주얼 셔츠', '의류', 'TCAG', 79000, 40000, 79000, 200, 40, 'TCAG-SH-001'),
      (v_user_id, v_org_id, store_id, '스포츠 재킷', '스포츠 재킷', '의류', 'TCAG', 199000, 100000, 199000, 80, 15, 'TCAG-JK-001'),
      (v_user_id, v_org_id, store_id, '니트 스웨터', '니트 스웨터', '의류', 'TCAG', 99000, 50000, 99000, 120, 25, 'TCAG-KN-001');
  END LOOP;

  RAISE NOTICE 'Products created for all stores';

  -- STEP 11: Create Sample Customers
  FOR store_id IN SELECT unnest(ARRAY[v_store1_id, v_store2_id, v_store3_id]) LOOP
    INSERT INTO public.customers (
      user_id,
      org_id,
      store_id,
      customer_name,
      email,
      phone,
      segment,
      total_purchases,
      last_visit_date
    )
    VALUES 
      (v_user_id, v_org_id, store_id, '김민수', 'minsu.kim@example.com', '010-1234-5678', 'VIP', 2500000, now() - interval '2 days'),
      (v_user_id, v_org_id, store_id, '이서연', 'seoyeon.lee@example.com', '010-2345-6789', 'Regular', 850000, now() - interval '5 days'),
      (v_user_id, v_org_id, store_id, '박지훈', 'jihoon.park@example.com', '010-3456-7890', 'New', 150000, now() - interval '1 day'),
      (v_user_id, v_org_id, store_id, '최유진', 'yujin.choi@example.com', '010-4567-8901', 'Regular', 620000, now() - interval '10 days'),
      (v_user_id, v_org_id, store_id, '정하윤', 'hayoon.jung@example.com', '010-5678-9012', 'VIP', 3200000, now() - interval '3 days');
  END LOOP;

  RAISE NOTICE 'Customers created for all stores';

  -- STEP 12: Create Dashboard KPIs for last 30 days
  FOR store_id IN SELECT unnest(ARRAY[v_store1_id, v_store2_id, v_store3_id]) LOOP
    FOR day IN 0..29 LOOP
      INSERT INTO public.dashboard_kpis (
        user_id,
        org_id,
        store_id,
        date,
        total_revenue,
        total_visits,
        total_purchases,
        conversion_rate,
        sales_per_sqm,
        labor_hours,
        funnel_entry,
        funnel_browse,
        funnel_fitting,
        funnel_purchase,
        funnel_return,
        is_holiday,
        weather_condition,
        consumer_sentiment_index
      )
      VALUES (
        v_user_id,
        v_org_id,
        store_id,
        current_date - day,
        (random() * 2000000 + 1000000)::numeric(10,2),
        (random() * 500 + 200)::integer,
        (random() * 50 + 20)::integer,
        (random() * 0.15 + 0.05)::numeric(5,4),
        (random() * 15000 + 5000)::numeric(10,2),
        (random() * 50 + 40)::numeric(5,2),
        (random() * 500 + 200)::integer,
        (random() * 300 + 100)::integer,
        (random() * 150 + 50)::integer,
        (random() * 50 + 20)::integer,
        (random() * 10 + 2)::integer,
        CASE WHEN day % 7 IN (0, 6) THEN true ELSE false END,
        CASE (random() * 3)::integer
          WHEN 0 THEN 'sunny'
          WHEN 1 THEN 'cloudy'
          ELSE 'rainy'
        END,
        (random() * 20 + 80)::numeric(5,2)
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Dashboard KPIs created for last 30 days';

  -- STEP 13: Create Sample AI Recommendations
  FOR store_id IN SELECT unnest(ARRAY[v_store1_id, v_store2_id, v_store3_id]) LOOP
    INSERT INTO public.ai_recommendations (
      user_id,
      org_id,
      store_id,
      recommendation_type,
      title,
      description,
      priority,
      status,
      action_category,
      evidence,
      expected_impact
    )
    VALUES 
      (
        v_user_id,
        v_org_id,
        store_id,
        'inventory',
        '프리미엄 티셔츠 재고 보충 필요',
        '현재 재고가 최소 수준 이하로 떨어졌습니다. 향후 7일 내 재고 소진 예상',
        'high',
        'pending',
        'inventory_management',
        jsonb_build_object('current_stock', 28, 'min_stock', 30, 'daily_sales', 4),
        jsonb_build_object('revenue_increase', '5%', 'stockout_prevention', true)
      ),
      (
        v_user_id,
        v_org_id,
        store_id,
        'pricing',
        '데님 진 가격 최적화 제안',
        '경쟁사 대비 5% 높은 가격으로 판매량 감소 중. 가격 조정 권장',
        'medium',
        'pending',
        'pricing_optimization',
        jsonb_build_object('current_price', 129000, 'competitor_avg', 122000, 'sales_trend', 'declining'),
        jsonb_build_object('sales_increase', '12%', 'market_share_gain', '3%')
      );
  END LOOP;

  RAISE NOTICE 'AI Recommendations created';

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Sample data creation completed successfully!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'User: 조성신 (seongsin.cho@tcag.com)';
  RAISE NOTICE 'Organization: TCAG';
  RAISE NOTICE 'Role: ORG_HQ';
  RAISE NOTICE 'Stores: 3 (강남점, 홍대점, 부산점)';
  RAISE NOTICE 'Products: 15 (5 per store)';
  RAISE NOTICE 'Customers: 15 (5 per store)';
  RAISE NOTICE 'KPIs: 90 records (30 days × 3 stores)';
  RAISE NOTICE '===========================================';
  
END $$;
