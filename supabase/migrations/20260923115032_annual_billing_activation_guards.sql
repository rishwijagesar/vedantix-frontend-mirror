CREATE OR REPLACE FUNCTION public.activate_invoice_yearly_billing(p_invoice_id uuid, p_service_start_date date, p_auto_finalize boolean DEFAULT false, p_renewal_reminder_days integer DEFAULT 14, p_cancellation_notice_days integer DEFAULT 31)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  i public.invoices%rowtype;
  v_existing public.subscriptions%rowtype;
  v_subscription_id uuid;
  v_subscription_number text;
  v_next_renewal date;
  v_reminder date;
  v_cancellation_deadline date;
begin
  if not public.is_staff(array['ADMIN','OPERATOR']) then raise exception 'Not authorized'; end if;
  if p_service_start_date is null then raise exception 'Service start date is required'; end if;
  p_renewal_reminder_days := greatest(0, least(coalesce(p_renewal_reminder_days,14),120));
  p_cancellation_notice_days := greatest(0, least(coalesce(p_cancellation_notice_days,31),365));
  select * into i from public.invoices where id=p_invoice_id for update;
  if not found then raise exception 'Invoice not found'; end if;
  if i.status not in ('FINALIZED','SENT','PARTIALLY_PAID','PAID','OVERDUE') then raise exception 'Invoice must be finalized before annual billing can be activated'; end if;
  if not i.is_active or i.finalized_at is null then raise exception 'Maak de factuur eerst definitief en actief.'; end if;
  if i.subscription_id is not null or i.source_quote_id is not null then raise exception 'Beheer deze jaarfacturatie via het bestaande abonnement of de offerte.'; end if;
  if p_service_start_date < date '2000-01-01' or p_service_start_date > date '2100-12-31' then raise exception 'Vul een geldige startdatum in.'; end if;
  if not exists(select 1 from public.invoice_items where invoice_id=i.id and billing_type='YEARLY') then raise exception 'Invoice has no yearly items'; end if;
  select * into v_existing from public.subscriptions where source_invoice_id=i.id and billing_type='YEARLY' limit 1;
  if found then
    v_next_renewal := v_existing.next_invoice_date;
    return jsonb_build_object('subscription_id',v_existing.id,'subscription_number',v_existing.subscription_number,'next_renewal_date',v_next_renewal,'reminder_date',v_next_renewal-v_existing.renewal_reminder_days,'cancellation_deadline',v_next_renewal-v_existing.cancellation_notice_days,'reused',true);
  end if;
  v_subscription_number:=public.allocate_subscription_number();
  v_next_renewal:=(p_service_start_date+interval '1 year')::date;
  v_reminder:=v_next_renewal-p_renewal_reminder_days;
  v_cancellation_deadline:=v_next_renewal-p_cancellation_notice_days;
  insert into public.subscriptions(subscription_number,source_invoice_id,customer_id,billing_type,status,start_date,next_invoice_date,last_invoice_date,auto_finalize,discount_type,discount_value,first_invoice_discount_ex_vat,company_snapshot,customer_snapshot,renewal_reminder_days,cancellation_notice_days,created_by)
  values(v_subscription_number,i.id,i.customer_id,'YEARLY','ACTIVE',p_service_start_date,v_next_renewal,i.invoice_date,p_auto_finalize,'NONE',0,0,i.company_snapshot,i.customer_snapshot,p_renewal_reminder_days,p_cancellation_notice_days,auth.uid()) returning id into v_subscription_id;
  insert into public.subscription_items(subscription_id,position,catalog_product_id,code,description,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value)
  select v_subscription_id,position,catalog_product_id,code,description,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value from public.invoice_items where invoice_id=i.id and billing_type='YEARLY' order by position,id;
  return jsonb_build_object('subscription_id',v_subscription_id,'subscription_number',v_subscription_number,'next_renewal_date',v_next_renewal,'reminder_date',v_reminder,'cancellation_deadline',v_cancellation_deadline,'reused',false);
end;
$function$;

revoke all on function public.activate_invoice_yearly_billing(uuid,date,boolean,integer,integer) from public,anon;
grant execute on function public.activate_invoice_yearly_billing(uuid,date,boolean,integer,integer) to authenticated;
