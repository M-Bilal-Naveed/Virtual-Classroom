
CREATE OR REPLACE FUNCTION increment_material_downloads(material_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.materials 
  SET downloads = COALESCE(downloads, 0) + 1 
  WHERE id = material_id;
END;
$$ LANGUAGE plpgsql;
