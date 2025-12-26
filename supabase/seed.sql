insert into public.delivery_windows (id, day_of_week, start_time, end_time, capacity, is_active)
values
  ('9d49e6b7-13d0-45bd-b08c-8ffca077b5f3', 'Saturday', '11:00', '19:00', 40, true),
  ('c2e71a8a-0f12-4cd5-96c6-9df3b8a0c8a2', 'Sunday', '11:00', '15:00', 30, true);

insert into public.meal_items (id, name, description, price_cents, is_active)
values
  ('f6f3d2c5-2f72-4b12-9d4a-2d5f2e72f1a0', 'Shan Noodle Bowl', 'Classic Shan noodles with garlic oil and herbs.', 1400, true),
  ('c6b7e2a8-5d67-4e3d-8f6d-2dc2c8c6b2e3', 'Tea Leaf Salad', 'Fermented tea leaves, peanuts, sesame, and crispy beans.', 900, true),
  ('bd8a8ef0-6d3d-4f1a-8f3a-8f59c2e6e1a2', 'Coconut Chicken Curry', 'Slow-simmered curry with jasmine rice.', 1600, true);

insert into public.meal_plan_templates (id, name, description, is_active)
values
  ('9a7bb5d4-8d4f-4d3b-9c41-2b0b7e1f6a2f', 'Weekly Classic', 'Default weekly subscription menu.', true);

insert into public.meal_plan_template_items (template_id, meal_item_id, quantity)
values
  ('9a7bb5d4-8d4f-4d3b-9c41-2b0b7e1f6a2f', 'f6f3d2c5-2f72-4b12-9d4a-2d5f2e72f1a0', 2),
  ('9a7bb5d4-8d4f-4d3b-9c41-2b0b7e1f6a2f', 'c6b7e2a8-5d67-4e3d-8f6d-2dc2c8c6b2e3', 1),
  ('9a7bb5d4-8d4f-4d3b-9c41-2b0b7e1f6a2f', 'bd8a8ef0-6d3d-4f1a-8f3a-8f59c2e6e1a2', 2);
