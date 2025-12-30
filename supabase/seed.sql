-- supabase/seed.sql
-- Idempotent-ish seed: uses WHERE NOT EXISTS checks (no unique constraints required).
-- Safe to re-run, but adding unique constraints is still recommended.

begin;

-- -------------------------------------------------------------------
-- 1) Delivery windows (Sat 11–19, Sun 11–15)
-- -------------------------------------------------------------------
with windows(day_of_week, start_time, end_time, capacity) as (
  values
    ('Saturday', '11:00'::time, '13:00'::time, 25),
    ('Saturday', '13:00'::time, '15:00'::time, 25),
    ('Saturday', '15:00'::time, '17:00'::time, 25),
    ('Saturday', '17:00'::time, '19:00'::time, 25),
    ('Sunday',   '11:00'::time, '13:00'::time, 25),
    ('Sunday',   '13:00'::time, '15:00'::time, 25)
)
insert into public.delivery_windows (day_of_week, start_time, end_time, capacity, is_active)
select w.day_of_week, w.start_time, w.end_time, w.capacity, true
from windows w
where not exists (
  select 1
  from public.delivery_windows dw
  where dw.day_of_week = w.day_of_week
    and dw.start_time  = w.start_time
    and dw.end_time    = w.end_time
);

-- -------------------------------------------------------------------
-- 2) Meal catalog (meal_items)
-- Prices are in cents.
-- -------------------------------------------------------------------
with items(name, description, price_cents) as (
  values
    -- All-Day Breakfast
    ('Kyay-O/Si-Chat (ကြေးအိုး/ဆီချက်)',
      $$Rice vermicelli noodle soup with pork, meatballs, intestines, eggs, bok choy. Chicken + egg option available.$$,
      1800),
    ('Nan-Gyi Mont Ti (နန်းကြီးမုန့်တီ)',
      $$Rice noodles with fish cake, garnishes, and crunch tossed in Mandalay chicken curry sauce.$$,
      1300),
    ('Mee-Shay (မြှီးရှည်)',
      $$Mandalay specialty rice noodles in sweet soybean sauce with pork, crunchy rind, pickled mustard.$$,
      1400),
    ('Ohno Khao-Swe (အုန်းနို့ခေါက်ဆွဲ)',
      $$Coconut cream + chickpea curry broth with wheat noodles, chicken drum, egg, garnishes.$$,
      1500),
    ('Shan Noodles (ရှမ်းခေါက်ဆွဲ)',
      $$Rice noodles with savory tomato-based sauce (pork) + peanuts, fried garlic, pickled mustard, chili paste.$$,
      1300),
    ('Mohinga (မုန့်ဟင်းခါး)',
      $$Traditional fish broth soup with rice noodles, garnishes, bean fritters, egg slices.$$,
      1400),

    -- Breakfast / Rice / Soups on menu page
    ('Burmese Fried Rice (ပဲပြုတ်ထမင်းကြော်)',
      $$Stir-fried rice with eggs, onion, garlic, and boiled yellow peas.$$,
      1900),
    ('Goat-Marrow Soup (ဆိတ်ရိုးစွပ်ပြုတ်)',
      $$Goat stew + bone marrow infused soup with chickpeas and potatoes. Best paired with Parata.$$,
      1200),
    ('Coconut Chicken & Rice (ကြက်အုန်းထမင်း)',
      $$Coconut rice with balachaung + Burmese chicken curry cooked in coconut oil.$$,
      1400),
    ('Ngapi-Rice Salad (ငပိထမင်း)',
      $$Rice tossed in fermented fish paste curry (Nga-Pi), served with sunny-side-up egg.$$,
      1300),
    ('Rice with Pickled Tea Salad (လက်ဖက်ထမင်း)',
      $$Rice tossed in pickled tea salad + garnishes, served with sunny-side-up egg.$$,
      1300),
    ('Tom-Yum Fried Rice/Noodles (တုန်ရန်းထမင်းကြော်/ခေါက်ဆွဲကြော်)',
      $$Stir-fry with shrimp + vegetables + tom yum aromatics (lemongrass/galangal/kaffir lime).$$,
      1600),

    -- Sides
    ('Parata (ပလာတာ)',
      $$Two pieces. Great with goat marrow soup/curries.$$,
      500),
    ('Coconut Rice (အုန်းထမင်း)',
      $$Coconut-cream cooked rice.$$,
      300),
    ('Rice (ထမင်းဖြူ)',
      $$Steamed plain white rice.$$,
      200),
    ('Balachaung (ဘာလချောင်ကြော်)',
      $$Shrimp condiment with fried onions, shrimp, garlic, ginger & red chilies.$$,
      300),

    -- Curries (A la Carte)
    ('Goat Curry [Original/Offal] (ဆိတ်သားဟင်း/ဆိတ်ကလီစာ)',
      $$Braised goat in Burmese-Indian masala curry (choice of meat or offal).$$,
      3000),
    ('Beef Curry (အမဲသားဟင်း/အမဲကြော်နှပ်)',
      $$Slow-cooked Burmese-Indian beef curry; non-spicy braised option available.$$,
      1900),
    ('Beef Pounded Deep Fried (အမဲထောင်းကြော်)',
      $$Pulled braised beef cooked in spicy chili oil.$$,
      1900),
    ('Chicken Curry (Original /Masala /Coconut) (ကြက်သားဟင်း)',
      $$Farm-raised chicken curry; masala spicy or sweet coconut option available.$$,
      1400),
    ('Chicken Giblets Curry (ကြက်အသဲမြစ်)',
      $$Chicken gizzards and liver in traditional Burmese curry.$$,
      1400),
    ('Pork Curry (ဝက်သနီ)',
      $$Classic pork curry in sweet, mildly spiced sauce.$$,
      1400),
    ('Pork Horsegram Bean Curry (ဝက်ပုန်းရည်ကြီး)',
      $$Pork curry with horse gram beans; mildly spiced, earthy/nutty.$$,
      1400),
    ('Pork Skewers (ဝက်သားဒုတ်ထိုး)',
      $$Slow-cooked pork + intestines + liver in herbal spices; served with dipping sauce.$$,
      1500),
    ('Bamboo Shoot with Pork Soup (ဝက်မျှစ်ချဥ်)',
      $$Pork in mildly spiced tamarind broth infused with bamboo shoots.$$,
      1400),
    ('Pork Offals Curry (ဝက်ကလီစာ)',
      $$Pork offal + intestines + liver in mildly spiced sauce.$$,
      1400),
    ('Duck Egg (ဘဲဥဟင်း)',
      $$Boiled duck eggs cooked in tomato-based curry.$$,
      1400),

    -- Vegetables
    ('Roselle with Shrimp Curry (ချဥ်ပေါင်ကြော်)',
      $$Roselle sour leaf curry with shrimp.$$,
      1400),
    ('Acacia with Shrimp Curry (ကင်ပွန်းချဥ်ကြော်)',
      $$Acacia sour leaf curry with shrimp.$$,
      1400),
    ('Bamboo Shoot Mushroom Soup (မျှစ်တောချက်)',
      $$Young bamboo shoots cooked with mushrooms in savory soup.$$,
      1400),
    ('Mixed Veggie Soup (သီးစုံပဲကုလားဟင်း)',
      $$Burmese Indian-style assorted vegetables in savory, mildly spicy soup.$$,
      1400),

    -- Seafood Curries
    ('Crab Masala Curry (ဂဏန်းမဆလာ)',
      $$Whole Dungeness crab simmered in masala chili curry with tamarind.$$,
      3000),
    ('Swai Fish Curry (ငါးမြင်းဟင်း)',
      $$Swai fish in mildly spiced sauce.$$,
      1900),
    ('Hilsa Fish (ငါးသလောက်ပေါင်း)',
      $$Hilsa fish in tomato-based curry.$$,
      2400),
    ('River Prawns Curry (ပုဇွန်ထုပ်ဟင်း)',
      $$Whole river prawns curry with aromatics + prawn oil.$$,
      2400),
    ('Sweet Shrimps Curry (ပုဇွန်ကြော်နှပ်)',
      $$Shrimp in mildly spiced sauce.$$,
      1900),
    ('Snakehead Innards Curry (ငါးရံအူဟင်း)',
      $$Snakehead intestines curry in spiced sauce.$$,
      1400),
    ('Fried Fish Cake Curry (ငါးဖယ်ချက်)',
      $$Crispy fish cakes simmered in mildly spiced tamarind sauce.$$,
      1400),
    ('Boneless Catfish Curry (ငါးခူမွှေချက်)',
      $$Boneless catfish in mildly spiced tamarind sauce.$$,
      1400),
    ('Fermented Fish Paste Nga-Pi (ငပိရည်ကျို)',
      $$Platter of vegetables with fermented fish paste dip.$$,
      1400),
    ('Fried Catfish Curry (ငါးခူကြော်နှပ်)',
      $$Fried catfish curry.$$,
      1900),
    ('Fish Paste Tomato Curry (ခရမ်းချဥ်သီးငါးပိချက်)',
      $$Fish paste in tomato curry with ginger/onions/garlic.$$,
      1400),

    -- Appetizers - Salads
    ('Pickled Tea Salad (လက်ဖတ်သုပ်)',
      $$Pickled tea leaves + lettuce + crispy beans/nuts; includes peanuts + dried shrimp powder.$$,
      1200),
    ('Tomato Salad (ခရမ်းချဥ်သီးသုပ်)',
      $$Organic tomatoes + shallots + chickpea powder + lettuce + Thai chili.$$,
      1200),
    ('Everything Salad (အသုပ်စုံ)',
      $$Seaweed, noodles, potato, banana shoots, papaya, lettuce; includes peanuts + dried shrimp powder.$$,
      1200),
    ('Century Egg Salad (ဆေးဘဲဥသုပ်)',
      $$Century egg + tomato + shallot + chickpea powder; includes peanuts + dried shrimp powder.$$,
      1200),
    ('Grilled Aubergine Salad (ခရမ်းသီးမီးဖုတ်သုပ်)',
      $$Grilled eggplant with shallot, chili, lime, peanuts; crispy shallots + coriander.$$,
      1200),

    -- Drinks
    ('Burmese Milk Tea (လက်ဖတ်ရည်)',
      $$Burmese roasted black tea with evaporated + condensed milk.$$,
      400),
    ('Faluda (ဖါလူဒါ)',
      $$Burmese sundae with pudding, jelly, assorted nuts.$$,
      900)
)
insert into public.meal_items (name, description, price_cents, is_active)
select i.name, i.description, i.price_cents, true
from items i
where not exists (
  select 1 from public.meal_items mi where mi.name = i.name
);

-- -------------------------------------------------------------------
-- 3) Weekly menu (published) + items
-- Uses the *current week* (week_of = Monday of current week)
-- -------------------------------------------------------------------
with week as (
  select date_trunc('week', now())::date as week_of
),
menu as (
  insert into public.weekly_menus (week_of, title, is_published, published_at)
  select week_of, 'Chef-Curated Weekly Menu', true, now()
  from week
  on conflict (week_of) do update
    set title = excluded.title,
        is_published = excluded.is_published,
        published_at = coalesce(public.weekly_menus.published_at, excluded.published_at),
        updated_at = now()
  returning id, week_of
),
witems(sort_order, name, description, price_cents) as (
  values
    (10, 'Mohinga (မုန့်ဟင်းခါး)', $$Traditional fish broth soup with rice noodles, garnishes, bean fritters, egg slices.$$ , 1400),
    (20, 'Shan Noodles (ရှမ်းခေါက်ဆွဲ)', $$Rice noodles with savory tomato-based sauce (pork) + peanuts, fried garlic, pickled mustard.$$ , 1300),
    (30, 'Nan-Gyi Mont Ti (နန်းကြီးမုန့်တီ)', $$Rice noodles with fish cake, garnishes, and crunch tossed in Mandalay chicken curry sauce.$$ , 1300),
    (40, 'Pickled Tea Salad (လက်ဖတ်သုပ်)', $$Pickled tea leaves + lettuce + crispy beans/nuts; includes peanuts + dried shrimp powder.$$ , 1200),
    (50, 'Chicken Curry (Original /Masala /Coconut) (ကြက်သားဟင်း)', $$Chicken curry; masala spicy or sweet coconut option available.$$ , 1400),
    (60, 'Beef Curry (အမဲသားဟင်း/အမဲကြော်နှပ်)', $$Slow-cooked Burmese-Indian beef curry; non-spicy braised option available.$$ , 1900),
    (70, 'Crab Masala Curry (ဂဏန်းမဆလာ)', $$Whole Dungeness crab simmered in masala chili curry with tamarind.$$ , 3000),
    (80, 'Burmese Milk Tea (လက်ဖတ်ရည်)', $$Burmese roasted black tea with evaporated + condensed milk.$$ , 400),
    (90, 'Faluda (ဖါလူဒါ)', $$Burmese sundae with pudding, jelly, assorted nuts.$$ , 900)
),
ins as (
  insert into public.weekly_menu_items (weekly_menu_id, name, description, price_cents, sort_order)
  select m.id, wi.name, wi.description, wi.price_cents, wi.sort_order
  from menu m
  join witems wi on true
  where not exists (
    select 1
    from public.weekly_menu_items existing
    where existing.weekly_menu_id = m.id
      and existing.name = wi.name
  )
  returning 1
)
select 'seeded weekly menu for week_of=' || (select week_of from menu);

-- -------------------------------------------------------------------
-- 4) Sample meal plan templates (optional)
-- -------------------------------------------------------------------
-- Template A
insert into public.meal_plan_templates (name, description, is_active)
select
  'Weekend Essentials',
  'A balanced starter: mohinga + tea salad + milk tea.',
  true
where not exists (select 1 from public.meal_plan_templates where name = 'Weekend Essentials');

-- Template B
insert into public.meal_plan_templates (name, description, is_active)
select
  'Curry Lover Pack',
  'Chicken curry + beef curry + rice add-ons (great for sharing).',
  true
where not exists (select 1 from public.meal_plan_templates where name = 'Curry Lover Pack');

-- Template items (A)
with t as (
  select id as template_id from public.meal_plan_templates where name = 'Weekend Essentials'
),
m as (
  select id, name from public.meal_items
  where name in (
    'Mohinga (မုန့်ဟင်းခါး)',
    'Pickled Tea Salad (လက်ဖတ်သုပ်)',
    'Burmese Milk Tea (လက်ဖတ်ရည်)'
  )
)
insert into public.meal_plan_template_items (template_id, meal_item_id, quantity)
select t.template_id, m.id, 1
from t, m
where not exists (
  select 1
  from public.meal_plan_template_items x
  where x.template_id = t.template_id and x.meal_item_id = m.id
);

-- Template items (B)
with t as (
  select id as template_id from public.meal_plan_templates where name = 'Curry Lover Pack'
),
m as (
  select id, name from public.meal_items
  where name in (
    'Chicken Curry (Original /Masala /Coconut) (ကြက်သားဟင်း)',
    'Beef Curry (အမဲသားဟင်း/အမဲကြော်နှပ်)',
    'Rice (ထမင်းဖြူ)'
  )
)
insert into public.meal_plan_template_items (template_id, meal_item_id, quantity)
select
  t.template_id,
  m.id,
  case when m.name = 'Rice (ထမင်းဖြူ)' then 2 else 1 end
from t, m
where not exists (
  select 1
  from public.meal_plan_template_items x
  where x.template_id = t.template_id and x.meal_item_id = m.id
);

commit;
