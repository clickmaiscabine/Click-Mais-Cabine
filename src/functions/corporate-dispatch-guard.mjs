// Meta has no client idempotency key for message sends. Unknown outcomes require review.
export function dispatchFailurePatch(input, claimed, now) {
  const error=input?.error??input??{};
  const status=Number(error.httpCode??error.statusCode??error.response?.statusCode??error.response?.status);
  const meta=error.response?.body?.error??error.cause?.error??error.error??error;
  const code=Number(meta.code);
  const message=String(error.message??meta.message??'whatsapp_send_failed').slice(0,850);
  const acknowledged=Boolean(input?.messages?.[0]?.id);
  const rejected=!acknowledged&&status>=400&&status<500&&status!==408;
  const transient=rejected&&(status===429||[4,17,32,613,80007,130429,131048,131056].includes(code));
  const canRetry=transient&&claimed.attempts<claimed.max_attempts;
  return {status:'failed',last_error:(rejected?'META_SEND_REJECTED:':'UNCERTAIN_DISPATCH_REQUIRES_HUMAN:')+message,
    attempts:canRetry?claimed.attempts:claimed.max_attempts,
    next_attempt_at:canRetry?new Date(new Date(now).getTime()+60000).toISOString():null,updated_at:now};
}
