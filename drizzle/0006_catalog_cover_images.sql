UPDATE products
SET images = '["/catalog/sphere/sphere-bench/cover.png","/catalog/sphere/sphere-bench/01.jpg","/catalog/sphere/sphere-bench/02.jpg","/catalog/sphere/sphere-bench/03.jpg","/catalog/sphere/sphere-bench/04.jpg","/catalog/sphere/sphere-bench/05.jpg","/catalog/sphere/sphere-bench/06.jpg","/catalog/sphere/sphere-bench/07.jpg","/catalog/sphere/sphere-bench/08.jpg","/catalog/sphere/sphere-bench/09.jpg","/catalog/sphere/sphere-bench/10.jpg"]'
WHERE slug = 'sphere-bench'
  AND source = 'catalog'
  AND json(images) = json('["/catalog/sphere/sphere-bench/01.jpg","/catalog/sphere/sphere-bench/02.jpg","/catalog/sphere/sphere-bench/03.jpg","/catalog/sphere/sphere-bench/04.jpg","/catalog/sphere/sphere-bench/05.jpg","/catalog/sphere/sphere-bench/06.jpg","/catalog/sphere/sphere-bench/07.jpg","/catalog/sphere/sphere-bench/08.jpg","/catalog/sphere/sphere-bench/09.jpg","/catalog/sphere/sphere-bench/10.jpg"]');
--> statement-breakpoint
UPDATE products
SET images = '["/catalog/sphere/commode/cover.jpg","/catalog/sphere/commode/01.jpg","/catalog/sphere/commode/02.jpg","/catalog/sphere/commode/03.jpg","/catalog/sphere/commode/04.jpg","/catalog/sphere/commode/05.jpg","/catalog/sphere/commode/06.jpg","/catalog/sphere/commode/07.jpg","/catalog/sphere/commode/08.jpg"]'
WHERE slug = 'commode'
  AND source = 'catalog'
  AND json(images) = json('["/catalog/sphere/commode/01.jpg","/catalog/sphere/commode/02.jpg","/catalog/sphere/commode/03.jpg","/catalog/sphere/commode/04.jpg","/catalog/sphere/commode/05.jpg","/catalog/sphere/commode/06.jpg","/catalog/sphere/commode/07.jpg","/catalog/sphere/commode/08.jpg"]');
--> statement-breakpoint
UPDATE products
SET images = '["/catalog/sphere/coffee-table-iii/views/sage-green.png","/catalog/sphere/coffee-table-iii/cover.jpg","/catalog/sphere/coffee-table-iii/02.jpg","/catalog/sphere/coffee-table-iii/03.jpg","/catalog/sphere/coffee-table-iii/04.jpg","/catalog/sphere/coffee-table-iii/05.jpg","/catalog/sphere/coffee-table-iii/06.jpg","/catalog/sphere/coffee-table-iii/07.jpg","/catalog/sphere/coffee-table-iii/08.jpg","/catalog/sphere/coffee-table-iii/09.jpg","/catalog/sphere/coffee-table-iii/10.jpg","/catalog/sphere/coffee-table-iii/11.jpg","/catalog/sphere/coffee-table-iii/12.jpg"]'
WHERE slug = 'coffee-table-iii'
  AND source = 'catalog'
  AND json(images) = json('["/catalog/sphere/coffee-table-iii/cover.jpg","/catalog/sphere/coffee-table-iii/02.jpg","/catalog/sphere/coffee-table-iii/03.jpg","/catalog/sphere/coffee-table-iii/04.jpg","/catalog/sphere/coffee-table-iii/05.jpg","/catalog/sphere/coffee-table-iii/06.jpg","/catalog/sphere/coffee-table-iii/07.jpg","/catalog/sphere/coffee-table-iii/08.jpg","/catalog/sphere/coffee-table-iii/09.jpg","/catalog/sphere/coffee-table-iii/10.jpg","/catalog/sphere/coffee-table-iii/11.jpg","/catalog/sphere/coffee-table-iii/12.jpg"]');
