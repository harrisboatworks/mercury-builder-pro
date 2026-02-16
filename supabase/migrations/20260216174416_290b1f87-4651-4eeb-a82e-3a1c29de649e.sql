-- Update image_url for the 3 remaining vented covers (data update via migration)
UPDATE motor_options SET image_url = '/images/options/8M0228522.jpeg', updated_at = now() WHERE id = '21dec827-a085-4123-be26-bb3270389351';
UPDATE motor_options SET image_url = '/images/options/8M0228535.jpeg', updated_at = now() WHERE id = '27287a07-a786-459f-b24b-5ba29d560b94';
UPDATE motor_options SET image_url = '/images/options/8M0228536.jpeg', updated_at = now() WHERE id = 'b880f15a-f55d-4411-91e3-3a065823129c';