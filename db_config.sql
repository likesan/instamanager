/* Create Like logging table in each DB account*/

CREATE TABLE insta_logs(
date DATE, 
like_counts_today INTEGER
);


ALTER TABLE insta_logs ALTER COLUMN date SET  DEFAULT current_date;



/* insert like log */
UPDATE insta_logs SET like_counts_today = like_counts_today + 1 WHERE date=current_date RETURNING date,like_counts_today;

