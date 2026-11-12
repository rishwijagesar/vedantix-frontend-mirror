-- Growth scherper gepositioneerd tegen goedkope aanbieders (was 995 in de vorige migratie).
update public.product_catalog set price_ex_vat = 895, updated_at = now() where code = 'GROWTH';
