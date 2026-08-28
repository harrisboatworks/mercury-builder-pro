DELETE FROM public.financing_applications
WHERE applicant_data->>'lastName' = 'Repair'
  AND applicant_data->>'firstName' = 'TestAnon';

DELETE FROM public.financing_submission_logs
WHERE correlation_id LIKE 'FIN-TEST-%';