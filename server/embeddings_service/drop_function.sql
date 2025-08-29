-- Step 1: Drop existing function (run this first)
DROP FUNCTION IF EXISTS similarity_search(vector, double precision, integer);
DROP FUNCTION IF EXISTS similarity_search(vector, float, integer);
DROP FUNCTION IF EXISTS similarity_search;
