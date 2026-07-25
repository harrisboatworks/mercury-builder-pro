do $migration$
declare
  target_job_id bigint;
  current_command text;
  updated_command text;
begin
  select jobid, command
    into target_job_id, current_command
  from cron.job
  where jobname = 'sync-elevenlabs-static-kb-daily'
    and active;

  if target_job_id is null then
    raise exception 'Active sync-elevenlabs-static-kb-daily cron job not found';
  end if;

  if current_command ~ 'timeout_milliseconds[[:space:]]*:=[[:space:]]*300000' then
    return;
  end if;

  if current_command ~ 'timeout_milliseconds[[:space:]]*:=' then
    updated_command := regexp_replace(
      current_command,
      'timeout_milliseconds[[:space:]]*:=[[:space:]]*[0-9]+',
      'timeout_milliseconds := 300000'
    );
  else
    updated_command := regexp_replace(
      current_command,
      E'\n[[:space:]]*\\) AS request_id;[[:space:]]*$',
      E',\n        timeout_milliseconds := 300000\n      ) AS request_id;'
    );
  end if;

  if updated_command = current_command then
    raise exception 'Could not add the static KB cron timeout safely';
  end if;

  perform cron.alter_job(
    job_id := target_job_id,
    command := updated_command
  );
end
$migration$;
