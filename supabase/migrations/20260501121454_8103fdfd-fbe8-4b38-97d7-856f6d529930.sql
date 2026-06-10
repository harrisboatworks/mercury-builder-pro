-- Promote 18 curated motor_media hero rows into motor_models.hero_image_url + hero_media_id
-- Source: docs/runbooks/dropbox-image-backfill-audit-2026-05-01-revised.md (19 approved; 115 EXLPT ProXS deferred — only inactive motor_media rows exist)
-- Reversible: prior values are NULL; rollback = UPDATE motor_models SET hero_image_url=NULL, hero_media_id=NULL WHERE id IN (...the 18 ids...)

WITH mapping(media_id, motor_id) AS (VALUES
  ('fe9ae5b7-a17c-41e9-bde9-97ba36bd4d98'::uuid, '1e47ff24-472a-4bb9-b0d1-bd522801bc61'::uuid), -- 2.5MH FourStroke
  ('0877ad4e-3e04-40fa-b3e0-16d93d9e8ffe'::uuid, 'd9853a2e-fdb7-44c9-948c-28fa52fd95f9'::uuid), -- 9.9 EH FourStroke
  ('d132e483-eeaa-4755-b66a-d423cc30a845'::uuid, '4fa932da-bd7e-4d2f-b1da-9aaed16932a8'::uuid), -- 9.9 ELH FourStroke
  ('0230e13d-65e2-4eba-95ee-4b459fc87311'::uuid, '54c38ffc-923e-4a88-b0ad-3338f8d0eeab'::uuid), -- 15 MH FourStroke
  ('2aedc5e8-8737-4b72-9291-a5278ad68ab5'::uuid, '782de8b4-6f7e-459f-ac58-400a6b49ad0b'::uuid), -- 20 EH FourStroke
  ('10e57fac-7dec-49f9-a935-6384e0d4c88f'::uuid, '4fab2935-c80e-4cd3-95ec-f201a3fd59f2'::uuid), -- 20 ELH FourStroke
  ('35c5c75b-9106-46e1-87b6-7e558cdff74d'::uuid, '2e892176-96f0-44f3-baa4-0896d8cc5ab2'::uuid), -- 20 ELHPT FourStroke
  ('fce61960-595e-4829-8a02-04a2cb33e2d4'::uuid, '71d56079-1b47-44e9-8447-969ec6ef416b'::uuid), -- 25 ELHPT FourStroke
  ('5c0ece1a-70ae-4d6a-aa2f-137c938f9978'::uuid, '70870b08-2d14-42d2-93db-974b93c6557f'::uuid), -- 25 ELPT FourStroke
  ('d6642831-fed9-415c-b34e-2dc862fb7ea1'::uuid, '06a95675-6418-4902-964f-e04b5f6bd0f2'::uuid), -- 40 ELPT FourStroke
  ('41776fce-ad4c-4c03-8ec2-2ea3a9bf9c3f'::uuid, 'b16ac296-e506-4357-ad69-18a0aa347cbf'::uuid), -- 90 ELPT FourStroke
  ('58323c86-e886-4536-ae3d-c41269ef0458'::uuid, 'eee34e36-54e0-4563-b276-aa5c4f751798'::uuid), -- 115 ELPT FourStroke
  ('af2a29be-5e9d-4340-9713-44532d0675ce'::uuid, '5587d161-617b-4b71-ad24-4d44df14f035'::uuid), -- 115 ELPT ProXS
  ('e4f193dd-021c-449e-90f3-04f1adb5805b'::uuid, 'e5317ef2-8420-494f-8d84-a6abef00e5d8'::uuid), -- 150 ELPT ProXS
  ('5c97230c-b6bc-400b-8dd8-4d3df85d3b06'::uuid, 'ffb1f5fd-fc8a-4a0a-bd21-5a1ac1af917b'::uuid), -- 150 EXLPT ProXS
  ('6e0f40b2-2a2c-400a-8671-467329f2f7a8'::uuid, '06c0da2c-c54d-4bfe-bbc1-c6af3534cd19'::uuid), -- 175 EXLPT ProXS
  ('0b3a2b7a-42d6-41a2-91f0-3128de675be4'::uuid, '9e7a8b58-bc3f-401e-b24e-25b2b102d0fd'::uuid), -- 200 ELPT ProXS
  ('0d4d005d-ea25-4e4c-885b-8f95ea9e04eb'::uuid, '0f6192df-bdfe-4ca4-add5-1e8042ade8d8'::uuid)  -- 250 ELPT ProXS
)
UPDATE motor_models mm
SET
  hero_image_url = med.media_url,
  hero_media_id = med.id,
  media_last_updated = now()
FROM mapping m
JOIN motor_media med
  ON med.id = m.media_id
 AND med.motor_id = m.motor_id
 AND med.is_active = true
WHERE mm.id = m.motor_id
  AND mm.hero_image_url IS NULL
  AND mm.image_url IS NULL;