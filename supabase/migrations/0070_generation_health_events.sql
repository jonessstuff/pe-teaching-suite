-- Record privacy-safe AI reliability events in the existing product-usage
-- stream. No lesson text, prompt content, student data, or error body is stored.
alter table product_usage_events
  drop constraint if exists product_usage_events_action_check;

alter table product_usage_events
  add constraint product_usage_events_action_check
  check (action in (
    'opened', 'template_selected', 'created', 'updated', 'completed',
    'reopened', 'printed', 'exported', 'copied',
    'generation_retry', 'generation_recovered', 'generation_failed'
  ));
