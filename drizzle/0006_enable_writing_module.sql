UPDATE "modules"
SET
  "release_status" = 'available',
  "updated_at" = NOW()
WHERE "id" = 'writing';